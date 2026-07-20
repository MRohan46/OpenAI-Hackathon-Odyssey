-- Close Odyssey's production progression and scheduling gaps in one durable layer.
-- The client may be closed: Postgres still expands habits, advances statuses,
-- creates in-app reminders, and keeps streak/progression state trustworthy.

create extension if not exists pg_cron with schema pg_catalog;

alter table public.quests
  add column if not exists time_zone text not null default 'UTC';

alter table public.notifications
  add column if not exists dedupe_key text;

alter table public.reward_inventory
  add column if not exists reserved_streak_protection boolean not null default false;

alter table public.reward_inventory
  add column if not exists streak_protection_reserved_at timestamptz;

create unique index if not exists notifications_owner_dedupe_idx
  on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null;

create or replace function public.odyssey_next_occurrence(
  p_scheduled_at timestamptz,
  p_recurrence text,
  p_time_zone text default 'UTC'
) returns timestamptz
language plpgsql stable set search_path = public as $$
declare
  zone_name text;
  local_time timestamp;
  candidate timestamp;
  interval_days integer;
  weekday_token text;
begin
  select name into zone_name from pg_timezone_names where name = p_time_zone limit 1;
  zone_name := coalesce(zone_name, 'UTC');
  local_time := p_scheduled_at at time zone zone_name;

  if p_recurrence = 'Daily' then
    candidate := local_time + interval '1 day';
  elsif lower(coalesce(p_recurrence, '')) ~ '^every [0-9]+ days$' then
    interval_days := greatest(2, substring(lower(p_recurrence) from 'every ([0-9]+) days')::integer);
    candidate := local_time + make_interval(days => interval_days);
  else
    for offset_days in 1..7 loop
      candidate := local_time + make_interval(days => offset_days);
      weekday_token := case extract(isodow from candidate)::integer
        when 1 then 'Mon' when 2 then 'Tue' when 3 then 'Wed' when 4 then 'Thu'
        when 5 then 'Fri' when 6 then 'Sat' else 'Sun' end;
      exit when position(weekday_token in coalesce(p_recurrence, '')) > 0;
    end loop;
    if position(weekday_token in coalesce(p_recurrence, '')) = 0 then
      candidate := local_time + interval '7 days';
    end if;
  end if;

  return candidate at time zone zone_name;
end; $$;

create or replace function public.odyssey_expand_series(
  p_source_id uuid,
  p_horizon timestamptz default now() + interval '45 days'
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  source_quest public.quests%rowtype;
  next_scheduled timestamptz;
  last_scheduled timestamptz;
  deadline_delta interval;
  created_count integer := 0;
  inserted_count integer;
begin
  select * into source_quest from public.quests where id = p_source_id;
  if not found or source_quest.kind <> 'habit' or source_quest.series_id is null or source_quest.recurrence is null then
    return 0;
  end if;

  -- The cron job and an interactive account refresh may meet. Serialize one
  -- series so their identical NOT EXISTS checks cannot create twins.
  perform pg_advisory_xact_lock(hashtextextended(source_quest.series_id, 0));

  last_scheduled := source_quest.scheduled_at;
  deadline_delta := source_quest.deadline_at - source_quest.scheduled_at;

  loop
    next_scheduled := public.odyssey_next_occurrence(last_scheduled, source_quest.recurrence, source_quest.time_zone);
    exit when next_scheduled > p_horizon or next_scheduled <= last_scheduled;

    insert into public.quests(
      user_id, goal_id, title, description, kind, status, scheduled_at, deadline_at,
      duration_minutes, priority, planned_intensity, recurrence, proof_policy, series_id,
      reward_xp, reward_rubies, boss_damage, time_zone
    )
    select
      source_quest.user_id, source_quest.goal_id, source_quest.title, source_quest.description,
      'habit', case when next_scheduled > now() + interval '1 hour' then 'upcoming' else 'scheduled' end,
      next_scheduled,
      case when source_quest.deadline_at is null then null else next_scheduled + deadline_delta end,
      source_quest.duration_minutes, source_quest.priority, source_quest.planned_intensity,
      source_quest.recurrence, source_quest.proof_policy, source_quest.series_id,
      source_quest.reward_xp, source_quest.reward_rubies, source_quest.boss_damage,
      source_quest.time_zone
    where not exists (
      select 1 from public.quests existing
      where existing.user_id = source_quest.user_id
        and existing.series_id = source_quest.series_id
        and existing.scheduled_at = next_scheduled
    );
    get diagnostics inserted_count = row_count;
    created_count := created_count + inserted_count;
    last_scheduled := next_scheduled;
  end loop;

  return created_count;
end; $$;

create or replace function public.odyssey_recalculate_streak(p_user_id uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare streak_value integer := 0;
begin
  with decided_days as (
    select
      (scheduled_at at time zone time_zone)::date as quest_day,
      bool_or(status = 'completed') as completed,
      bool_or(status in ('missed', 'overdue') and not streak_protected) as broken
    from public.quests
    where user_id = p_user_id
      and scheduled_at <= now()
      and status in ('completed', 'missed', 'overdue')
    group by 1
  ), ranked as (
    select *, sum(case when broken then 1 else 0 end) over (order by quest_day desc) as breaks_seen
    from decided_days
  )
  select count(*) filter (where completed and breaks_seen = 0)::integer
  into streak_value
  from ranked;

  update public.profiles set overall_streak = coalesce(streak_value, 0) where id = p_user_id;
  return coalesce(streak_value, 0);
end; $$;

create or replace function public.odyssey_maintain_user(p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  source_id uuid;
  reminder_settings public.preferences%rowtype;
  reserved_guard boolean := false;
  reserved_at timestamptz;
  protected_quest_id uuid;
begin
  for source_id in
    select id from (
      select distinct on (series_id) id
      from public.quests
      where user_id = p_user_id and kind = 'habit' and recurrence is not null and series_id is not null
      order by series_id, scheduled_at desc
    ) latest_series
  loop
    perform public.odyssey_expand_series(source_id, now() + interval '45 days');
  end loop;

  update public.quests q set status = case
    when coalesce(q.deadline_at, q.scheduled_at + make_interval(mins => q.duration_minutes)) <= now() - interval '24 hours' then 'missed'
    when coalesce(q.deadline_at, q.scheduled_at + make_interval(mins => q.duration_minutes)) < now() then 'overdue'
    when q.scheduled_at > now() + interval '1 hour' then 'upcoming'
    else 'scheduled'
  end
  where q.user_id = p_user_id
    and q.status in ('scheduled', 'upcoming', 'overdue', 'inProgress')
    and q.status <> case
      when coalesce(q.deadline_at, q.scheduled_at + make_interval(mins => q.duration_minutes)) <= now() - interval '24 hours' then 'missed'
      when coalesce(q.deadline_at, q.scheduled_at + make_interval(mins => q.duration_minutes)) < now() then 'overdue'
      when q.scheduled_at > now() + interval '1 hour' then 'upcoming'
      else 'scheduled'
    end;

  select reserved_streak_protection, streak_protection_reserved_at into reserved_guard, reserved_at
  from public.reward_inventory where user_id = p_user_id for update;
  if coalesce(reserved_guard, false) then
    select id into protected_quest_id
    from public.quests
    where user_id = p_user_id
      and status = 'missed'
      and not streak_protected
      and updated_at >= coalesce(reserved_at, now())
    order by updated_at, scheduled_at
    limit 1;
    if protected_quest_id is not null then
      update public.quests set streak_protected = true where id = protected_quest_id;
      update public.reward_inventory
      set reserved_streak_protection = false, streak_protection_reserved_at = null
      where user_id = p_user_id;
    end if;
  end if;

  select * into reminder_settings from public.preferences where user_id = p_user_id;

  if reminder_settings.quest_reminders then
    insert into public.notifications(user_id, title, body, kind, target_route, dedupe_key)
    select p_user_id, q.title || ' starts soon', 'Your next quest begins soon.', 'scheduled', '/quest/' || q.id, 'quest:' || q.id || ':start'
    from public.quests q
    where q.user_id = p_user_id
      and q.status in ('scheduled', 'upcoming')
      and q.scheduled_at between now() and now() + make_interval(mins => reminder_settings.reminder_lead_minutes)
    on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
  end if;

  if reminder_settings.deadline_reminders then
    insert into public.notifications(user_id, title, body, kind, target_route, dedupe_key)
    select p_user_id, q.title || ' deadline approaching', 'Time remains for an honest next step.', 'deadline', '/quest/' || q.id, 'quest:' || q.id || ':deadline'
    from public.quests q
    where q.user_id = p_user_id
      and q.status in ('scheduled', 'upcoming', 'inProgress')
      and q.deadline_at between now() and now() + make_interval(mins => reminder_settings.reminder_lead_minutes)
    on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
  end if;

  if reminder_settings.overdue_reminders then
    insert into public.notifications(user_id, title, body, kind, target_route, dedupe_key)
    select p_user_id, q.title || ' is overdue', 'The missed time stays honest. Choose the next useful action.', 'overdue', '/quest/' || q.id, 'quest:' || q.id || ':overdue'
    from public.quests q
    where q.user_id = p_user_id and q.status = 'overdue'
    on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
  end if;

  perform public.odyssey_recalculate_streak(p_user_id);
end; $$;

create or replace function public.odyssey_maintain_all() returns void
language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  for owner_id in select id from public.profiles loop
    perform public.odyssey_maintain_user(owner_id);
  end loop;
end; $$;

create or replace function public.odyssey_refresh_account_state() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  perform public.odyssey_maintain_user(auth.uid());
end; $$;

create or replace function public.odyssey_create_quest(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); row_quest public.quests%rowtype; reward record; series_value text;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  if not exists(select 1 from public.goals where id = (p_input->>'goalId')::uuid and user_id = uid and status = 'active') then raise exception 'Choose one of your active Odysseys'; end if;
  select * into reward from public.odyssey_reward_for_priority(coalesce(p_input->>'priority', 'medium'));
  series_value := case when p_input->>'kind' = 'habit' then coalesce(nullif(p_input->>'seriesId',''), gen_random_uuid()::text) else null end;
  insert into public.quests(user_id, goal_id, title, description, kind, status, scheduled_at, deadline_at, duration_minutes, priority, planned_intensity, recurrence, proof_policy, series_id, reward_xp, reward_rubies, boss_damage, time_zone)
  values (uid, (p_input->>'goalId')::uuid, trim(p_input->>'title'), coalesce(p_input->>'description',''), p_input->>'kind', 'scheduled', (p_input->>'scheduledAt')::timestamptz, nullif(p_input->>'deadlineAt','')::timestamptz, (p_input->>'durationMinutes')::integer, p_input->>'priority', p_input->>'plannedIntensity', nullif(p_input->>'recurrence',''), coalesce(p_input->>'proofPolicy','none'), series_value, reward.xp, reward.rubies, reward.damage, coalesce(nullif(p_input->>'timeZone',''), 'UTC'))
  returning * into row_quest;
  if row_quest.kind = 'habit' then perform public.odyssey_expand_series(row_quest.id); end if;
  return to_jsonb(row_quest);
end; $$;

create or replace function public.odyssey_update_quest(p_quest_id uuid, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); row_quest public.quests%rowtype; reward record; priority_value text; series_scope boolean := coalesce((p_patch->>'seriesScope')::boolean, false);
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  select coalesce(p_patch->>'priority', priority) into priority_value from public.quests where id = p_quest_id and user_id = uid;
  if priority_value is null then raise exception 'Quest not found'; end if;
  select * into reward from public.odyssey_reward_for_priority(priority_value);
  update public.quests set
    title = coalesce(nullif(trim(p_patch->>'title'),''), title), description = coalesce(p_patch->>'description', description),
    goal_id = coalesce(nullif(p_patch->>'goalId','')::uuid, goal_id), kind = coalesce(p_patch->>'kind', kind),
    scheduled_at = coalesce(nullif(p_patch->>'scheduledAt','')::timestamptz, scheduled_at), deadline_at = case when p_patch ? 'deadlineAt' then nullif(p_patch->>'deadlineAt','')::timestamptz else deadline_at end,
    duration_minutes = coalesce(nullif(p_patch->>'durationMinutes','')::integer, duration_minutes), priority = priority_value,
    planned_intensity = coalesce(p_patch->>'plannedIntensity', planned_intensity), recurrence = case when p_patch ? 'recurrence' then nullif(p_patch->>'recurrence','') else recurrence end,
    proof_policy = coalesce(p_patch->>'proofPolicy', proof_policy), reward_xp = reward.xp, reward_rubies = reward.rubies, boss_damage = reward.damage,
    time_zone = coalesce(nullif(p_patch->>'timeZone',''), time_zone),
    status = case when p_patch->>'status' = 'scheduled' and status in ('missed','overdue','upcoming','scheduled') then 'scheduled' else status end
  where id = p_quest_id and user_id = uid and status not in ('completed', 'completionPending') returning * into row_quest;
  if not found then raise exception 'Only a scheduled quest can be updated'; end if;

  if series_scope and row_quest.series_id is not null then
    delete from public.quests
    where user_id = uid and series_id = row_quest.series_id and id <> row_quest.id
      and status in ('scheduled','upcoming','inProgress');
    perform public.odyssey_expand_series(row_quest.id);
  end if;
  return to_jsonb(row_quest);
end; $$;

create or replace function public.odyssey_complete_quest(p_quest_id uuid, p_actual_intensity text, p_proof_object_key text, p_client_mutation_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); row_quest public.quests%rowtype; row_goal public.goals%rowtype; inv public.reward_inventory%rowtype;
  proof_required boolean; bonus_xp integer := 0; new_health integer; old_health integer; new_level integer; old_level integer;
  old_account_level integer; new_account_level integer; new_xp integer; milestone_count integer := 0; chest_award integer := 0;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  if p_actual_intensity not in ('light', 'normal', 'intense') then raise exception 'Choose Light, Normal, or Intense effort'; end if;
  select * into row_quest from public.quests where id = p_quest_id and user_id = uid for update;
  if not found then raise exception 'Quest not found'; end if;
  if row_quest.completion_mutation_id = p_client_mutation_id then
    select * into row_goal from public.goals where id = row_quest.goal_id;
    return jsonb_build_object('quest', to_jsonb(row_quest), 'rewards', jsonb_build_object('xp', row_quest.reward_xp, 'rubies', row_quest.reward_rubies), 'bossHealth', row_goal.boss_health);
  end if;
  if row_quest.status = 'completed' then raise exception 'This quest has already been completed'; end if;
  proof_required := row_quest.proof_policy = 'required';
  if proof_required and coalesce(p_proof_object_key, '') = '' then raise exception 'Private photo proof is required for this quest'; end if;
  if p_proof_object_key is not null and p_proof_object_key not like uid::text || '/proofs/%' then raise exception 'Invalid proof object key'; end if;
  if p_proof_object_key is not null and p_proof_object_key <> '' and not exists (select 1 from storage.objects where bucket_id = 'odyssey-private-proof' and name = p_proof_object_key and owner_id::text = uid::text) then raise exception 'Private proof upload was not confirmed'; end if;

  select * into inv from public.reward_inventory where user_id = uid for update;
  select * into row_goal from public.goals where id = row_quest.goal_id and user_id = uid for update;
  select account_level, xp into old_account_level, new_xp from public.profiles where id = uid for update;
  old_level := row_goal.current_level;
  old_health := row_goal.boss_health;
  if inv.active_boost_id = 'boost-focus' and p_actual_intensity = 'intense' then bonus_xp := 25; end if;
  new_xp := new_xp + row_quest.reward_xp + bonus_xp;
  new_account_level := greatest(1, floor(new_xp::numeric / 500)::integer + 1);
  new_health := greatest(0, old_health - row_quest.boss_damage);
  new_level := least(10, greatest(1, floor((100 - new_health)::numeric / 10)::integer + 1));

  update public.quests set status = 'completed', actual_intensity = p_actual_intensity, proof_object_key = nullif(p_proof_object_key,''), completed_at = now(), completion_mutation_id = p_client_mutation_id where id = row_quest.id returning * into row_quest;
  if p_proof_object_key is not null and p_proof_object_key <> '' then insert into public.proofs(user_id, quest_id, object_key, captured_at) values(uid, row_quest.id, p_proof_object_key, now()); end if;

  update public.goals set boss_health = new_health, progress = 100 - new_health, current_level = new_level where id = row_goal.id returning * into row_goal;
  update public.roadmap_levels set
    status = case when number < new_level or (number = 10 and new_health = 0) then 'completed' when number = new_level then 'active' else 'locked' end,
    boss_health = case
      when boss_type = 'none' then null
      when number < new_level or (number = 10 and new_health = 0) then 0
      when number = new_level then greatest(0, (new_health - (10 - new_level) * 10) * 10)
      else 100 end
  where goal_id = row_goal.id and user_id = uid;

  select count(*)::integer into milestone_count from public.roadmap_levels
  where goal_id = row_goal.id and boss_type = 'mini' and number >= old_level and number < new_level;
  chest_award := milestone_count + greatest(0, new_account_level - old_account_level) + case when old_health > 0 and new_health = 0 and old_level = 10 then 1 else 0 end;

  update public.profiles set xp = new_xp, account_level = new_account_level, xp_to_next_level = floor(new_xp::numeric / 500)::integer * 500 + 500 where id = uid;
  update public.reward_inventory set
    rubies = rubies + row_quest.reward_rubies,
    unopened_chests = unopened_chests + chest_award,
    streak_protection = streak_protection + milestone_count,
    boosts = case when milestone_count = 0 then boosts else (
      select jsonb_agg(case when x->>'id' = 'boost-focus' then jsonb_set(x, '{quantity}', to_jsonb(coalesce((x->>'quantity')::integer, 0) + milestone_count)) else x end)
      from jsonb_array_elements(boosts) x
    ) end,
    active_boost_id = null
  where user_id = uid;

  insert into public.reward_ledger(user_id, kind, title, xp, rubies, source_id) values(uid, 'quest', row_quest.title || ' completed', row_quest.reward_xp + bonus_xp, row_quest.reward_rubies, row_quest.id::text);
  insert into public.notifications(user_id, title, body, kind, target_route, dedupe_key) values(uid, row_quest.title || ' completed', (row_quest.reward_xp + bonus_xp) || ' XP and ' || row_quest.reward_rubies || ' rubies were confirmed.', 'reward', '/rewards', 'quest:' || row_quest.id || ':reward') on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
  perform public.odyssey_recalculate_streak(uid);
  return jsonb_build_object('quest', to_jsonb(row_quest), 'rewards', jsonb_build_object('xp', row_quest.reward_xp + bonus_xp, 'rubies', row_quest.reward_rubies), 'bossHealth', row_goal.boss_health);
end; $$;

create or replace function public.odyssey_open_chest(p_chest_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); xp_amount integer := 120; ruby_amount integer := 24;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_chest_id, 0));
  if exists (
    select 1 from public.reward_ledger
    where user_id = uid and kind = 'chest' and source_id = p_chest_id
  ) then
    return jsonb_build_object('chestId', p_chest_id, 'xp', xp_amount, 'rubies', ruby_amount);
  end if;
  update public.reward_inventory set unopened_chests = unopened_chests - 1 where user_id = uid and unopened_chests > 0;
  if not found then raise exception 'There is no earned chest ready to open'; end if;
  update public.profiles set xp = xp + xp_amount,
    account_level = greatest(1, floor((xp + xp_amount)::numeric / 500)::integer + 1),
    xp_to_next_level = floor((xp + xp_amount)::numeric / 500)::integer * 500 + 500
  where id = uid;
  update public.reward_inventory set rubies = rubies + ruby_amount where user_id = uid;
  insert into public.reward_ledger(user_id, kind, title, xp, rubies, source_id) values(uid, 'chest', 'Earned chest opened', xp_amount, ruby_amount, p_chest_id);
  return jsonb_build_object('chestId', p_chest_id, 'xp', xp_amount, 'rubies', ruby_amount);
end; $$;

create or replace function public.odyssey_use_streak_protection(p_quest_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); title_value text := 'Streak protection reserved for the next eligible miss';
begin
  update public.reward_inventory set streak_protection = streak_protection - 1,
    reserved_streak_protection = p_quest_id is null,
    streak_protection_reserved_at = case when p_quest_id is null then now() else null end
  where user_id = uid and streak_protection > 0;
  if not found then raise exception 'No streak protection is available'; end if;
  if p_quest_id is not null then
    update public.quests set streak_protected = true where id = p_quest_id and user_id = uid and status in ('missed','overdue');
    if not found then raise exception 'Choose one of your missed or overdue quests'; end if;
    select 'Streak protected after ' || title into title_value from public.quests where id = p_quest_id;
  end if;
  insert into public.reward_ledger(user_id, kind, title, source_id) values(uid, 'streakProtection', title_value, coalesce(p_quest_id::text, 'reserved'));
  perform public.odyssey_recalculate_streak(uid);
  return (select to_jsonb(i) - 'user_id' - 'updated_at' from public.reward_inventory i where user_id = uid);
end; $$;

do $$
declare existing_job bigint;
begin
  for existing_job in select jobid from cron.job where jobname = 'odyssey-maintenance' loop
    perform cron.unschedule(existing_job);
  end loop;
  perform cron.schedule('odyssey-maintenance', '*/5 * * * *', 'select public.odyssey_maintain_all();');
end $$;

revoke execute on function public.odyssey_next_occurrence(timestamptz, text, text) from public, anon, authenticated;
revoke execute on function public.odyssey_expand_series(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.odyssey_recalculate_streak(uuid) from public, anon, authenticated;
revoke execute on function public.odyssey_maintain_user(uuid) from public, anon, authenticated;
revoke execute on function public.odyssey_maintain_all() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.odyssey_reward_for_priority(text) from public, anon, authenticated;
revoke execute on function public.odyssey_ensure_profile() from public, anon;
revoke execute on function public.odyssey_accept_roadmap(jsonb) from public, anon;
revoke execute on function public.odyssey_update_goal(uuid, jsonb) from public, anon;
revoke execute on function public.odyssey_complete_goal(uuid, text) from public, anon;
revoke execute on function public.odyssey_refresh_account_state() from public, anon;
revoke execute on function public.odyssey_create_quest(jsonb) from public, anon;
revoke execute on function public.odyssey_update_quest(uuid, jsonb) from public, anon;
revoke execute on function public.odyssey_delete_quest(uuid) from public, anon;
revoke execute on function public.odyssey_complete_quest(uuid, text, text, text) from public, anon;
revoke execute on function public.odyssey_attach_proof(uuid, text, timestamptz) from public, anon;
revoke execute on function public.odyssey_open_chest(text) from public, anon;
revoke execute on function public.odyssey_select_cosmetic(text) from public, anon;
revoke execute on function public.odyssey_unlock_cosmetic(text) from public, anon;
revoke execute on function public.odyssey_apply_boost(text) from public, anon;
revoke execute on function public.odyssey_use_streak_protection(uuid) from public, anon;

grant execute on function public.odyssey_ensure_profile() to authenticated;
grant execute on function public.odyssey_accept_roadmap(jsonb) to authenticated;
grant execute on function public.odyssey_update_goal(uuid, jsonb) to authenticated;
grant execute on function public.odyssey_complete_goal(uuid, text) to authenticated;
grant execute on function public.odyssey_refresh_account_state() to authenticated;
grant execute on function public.odyssey_create_quest(jsonb) to authenticated;
grant execute on function public.odyssey_update_quest(uuid, jsonb) to authenticated;
grant execute on function public.odyssey_delete_quest(uuid) to authenticated;
grant execute on function public.odyssey_complete_quest(uuid, text, text, text) to authenticated;
grant execute on function public.odyssey_attach_proof(uuid, text, timestamptz) to authenticated;
grant execute on function public.odyssey_open_chest(text) to authenticated;
grant execute on function public.odyssey_select_cosmetic(text) to authenticated;
grant execute on function public.odyssey_unlock_cosmetic(text) to authenticated;
grant execute on function public.odyssey_apply_boost(text) to authenticated;
grant execute on function public.odyssey_use_streak_protection(uuid) to authenticated;
