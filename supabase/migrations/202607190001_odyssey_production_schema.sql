-- Odyssey production data model. Apply with `supabase db push` after linking the project.
-- All user-owned data is private by default. Progress/rewards mutate only through RPCs below.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Odyssey traveler',
  handle text not null default '@traveler',
  account_level integer not null default 1 check (account_level > 0),
  xp integer not null default 0 check (xp >= 0),
  xp_to_next_level integer not null default 500 check (xp_to_next_level > 0),
  overall_streak integer not null default 0 check (overall_streak >= 0),
  avatar_seed text not null default 'shore-sunrise',
  selected_cosmetic text not null default 'Sea Glass Halo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reduced_motion_override text not null default 'system' check (reduced_motion_override in ('system', 'on', 'off')),
  haptics boolean not null default true,
  high_contrast boolean not null default false,
  graphics_quality text not null default 'auto' check (graphics_quality in ('auto', 'full', 'balanced', 'calm')),
  quest_reminders boolean not null default true,
  deadline_reminders boolean not null default true,
  overdue_reminders boolean not null default true,
  reminder_lead_minutes integer not null default 15 check (reminder_lead_minutes between 0 and 1440),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  short_title text not null check (char_length(short_title) between 1 and 90),
  description text not null default '',
  deadline date not null,
  current_level integer not null default 1 check (current_level between 1 and 10),
  progress integer not null default 0 check (progress between 0 and 100),
  accent text not null default '#18B8C8',
  status text not null default 'active' check (status in ('active', 'completed', 'draft')),
  boss_name text not null default 'The Horizon',
  boss_health integer not null default 100 check (boss_health between 0 and 100),
  completed_at timestamptz,
  victory_note text,
  starting_point text,
  available_days text[] not null default '{}',
  minutes_per_day integer check (minutes_per_day between 1 and 1440),
  preferred_intensity text check (preferred_intensity in ('light', 'normal', 'intense')),
  constraints text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_owner_status_idx on public.goals(user_id, status, deadline);

create table if not exists public.roadmap_levels (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  number integer not null check (number between 1 and 10),
  title text not null,
  purpose text not null default '',
  status text not null default 'locked' check (status in ('locked', 'active', 'completed')),
  milestone text not null default '',
  boss_type text not null default 'none' check (boss_type in ('none', 'mini', 'final')),
  boss_name text,
  boss_health integer check (boss_health between 0 and 100),
  habits jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  unique(goal_id, number)
);
create index if not exists roadmap_levels_owner_goal_idx on public.roadmap_levels(user_id, goal_id, number);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '',
  kind text not null check (kind in ('habit', 'task')),
  status text not null default 'scheduled' check (status in ('scheduled', 'inProgress', 'completionPending', 'completed', 'upcoming', 'overdue', 'missed')),
  scheduled_at timestamptz not null,
  deadline_at timestamptz,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  planned_intensity text not null check (planned_intensity in ('light', 'normal', 'intense')),
  actual_intensity text check (actual_intensity in ('light', 'normal', 'intense')),
  recurrence text,
  proof_policy text not null default 'none' check (proof_policy in ('required', 'optional', 'none')),
  proof_object_key text,
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_rubies integer not null default 0 check (reward_rubies >= 0),
  boss_damage integer not null default 0 check (boss_damage >= 0),
  completed_at timestamptz,
  series_id text,
  streak_protected boolean not null default false,
  completion_mutation_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deadline_at is null or deadline_at >= scheduled_at)
);
create index if not exists quests_owner_schedule_idx on public.quests(user_id, scheduled_at desc);
create index if not exists quests_owner_goal_idx on public.quests(user_id, goal_id);
create index if not exists quests_owner_series_idx on public.quests(user_id, series_id);

create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null unique references public.quests(id) on delete cascade,
  object_key text not null unique,
  captured_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (object_key like user_id::text || '/%')
);

create table if not exists public.reward_inventory (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  rubies integer not null default 0 check (rubies >= 0),
  unopened_chests integer not null default 0 check (unopened_chests >= 0),
  boosts jsonb not null default '[{"id":"boost-focus","name":"Deep Focus","description":"Adds a modest XP bonus to one completed Intense quest.","quantity":0},{"id":"boost-recovery","name":"Second Wind","description":"Supports a recovery day without completing work for you.","quantity":0}]'::jsonb,
  cosmetics jsonb not null default '[{"id":"cosmetic-halo","name":"Sea Glass Halo","description":"A quiet turquoise profile ring.","unlocked":true,"selected":true},{"id":"cosmetic-sun","name":"Sunwake Frame","description":"A warm profile frame earned from a mini-boss victory.","unlocked":false,"selected":false},{"id":"cosmetic-compass","name":"Coral Compass Pin","description":"An appearance-only profile accent available for rubies.","unlocked":false,"selected":false,"rubyPrice":120}]'::jsonb,
  streak_protection integer not null default 0 check (streak_protection >= 0),
  active_boost_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('quest', 'chest', 'boost', 'cosmetic', 'streakProtection')),
  title text not null,
  xp integer not null default 0,
  rubies integer not null default 0,
  source_id text
);
create index if not exists reward_ledger_owner_created_idx on public.reward_ledger(user_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false,
  kind text not null check (kind in ('scheduled', 'deadline', 'overdue', 'reward')),
  target_route text
);
create index if not exists notifications_owner_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create or replace trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create or replace trigger goals_updated_at before update on public.goals for each row execute function public.set_updated_at();
create or replace trigger quests_updated_at before update on public.quests for each row execute function public.set_updated_at();
create or replace trigger inventory_updated_at before update on public.reward_inventory for each row execute function public.set_updated_at();
create or replace trigger preferences_updated_at before update on public.preferences for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare display_name text := coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'traveler'), '@', 1));
begin
  insert into public.profiles(id, name, handle, avatar_seed)
  values (new.id, display_name, '@' || lower(regexp_replace(display_name, '[^a-zA-Z0-9_]+', '', 'g')), new.id::text)
  on conflict (id) do nothing;
  insert into public.preferences(user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.reward_inventory(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.odyssey_ensure_profile() returns public.profiles
language plpgsql security definer set search_path = public as $$
declare result public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  insert into public.profiles(id, name, handle, avatar_seed)
  select id,
    coalesce(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'full_name', split_part(coalesce(email, 'traveler'), '@', 1)),
    '@' || lower(regexp_replace(coalesce(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'full_name', split_part(coalesce(email, 'traveler'), '@', 1)), '[^a-zA-Z0-9_]+', '', 'g')),
    id::text
  from auth.users where id = auth.uid() on conflict (id) do nothing;
  insert into public.preferences(user_id) values (auth.uid()) on conflict (user_id) do nothing;
  insert into public.reward_inventory(user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into result from public.profiles where id = auth.uid();
  return result;
end; $$;

-- Private storage bucket. Objects must be under <auth.uid()>/proofs/… .
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('odyssey-private-proof', 'odyssey-private-proof', false, 10485760, array['image/jpeg', 'image/png', 'image/heic'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.goals enable row level security;
alter table public.roadmap_levels enable row level security;
alter table public.quests enable row level security;
alter table public.proofs enable row level security;
alter table public.reward_inventory enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are private" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "preferences are private" on public.preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners update preferences" on public.preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals are private" on public.goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "levels are private" on public.roadmap_levels for select to authenticated using ((select auth.uid()) = user_id);
create policy "quests are private" on public.quests for select to authenticated using ((select auth.uid()) = user_id);
create policy "proof rows are private" on public.proofs for select to authenticated using ((select auth.uid()) = user_id);
create policy "inventory is private" on public.reward_inventory for select to authenticated using ((select auth.uid()) = user_id);
create policy "ledger is private" on public.reward_ledger for select to authenticated using ((select auth.uid()) = user_id);
create policy "notifications are private" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "owners can mark notifications read" on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "owners upload private proof" on storage.objects for insert to authenticated with check (
  bucket_id = 'odyssey-private-proof' and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "owners read private proof" on storage.objects for select to authenticated using (
  bucket_id = 'odyssey-private-proof' and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "owners replace private proof" on storage.objects for update to authenticated using (
  bucket_id = 'odyssey-private-proof' and (storage.foldername(name))[1] = (select auth.uid()::text)
) with check (bucket_id = 'odyssey-private-proof' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "owners delete private proof" on storage.objects for delete to authenticated using (
  bucket_id = 'odyssey-private-proof' and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create or replace function public.odyssey_reward_for_priority(p_priority text) returns table(xp integer, rubies integer, damage integer)
language sql immutable as $$
  select case p_priority when 'critical' then 120 when 'high' then 90 when 'medium' then 45 else 25 end,
         case p_priority when 'critical' then 16 when 'high' then 12 when 'medium' then 6 else 3 end,
         case p_priority when 'critical' then 10 when 'high' then 7 when 'medium' then 3 else 1 end;
$$;

create or replace function public.odyssey_accept_roadmap(p_draft jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); goal_row public.goals%rowtype; item jsonb; n integer := 0;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  if jsonb_array_length(coalesce(p_draft->'levels', '[]'::jsonb)) <> 10 then raise exception 'A roadmap must contain exactly ten levels'; end if;
  insert into public.goals(user_id, title, short_title, description, deadline, boss_name, starting_point, available_days, minutes_per_day, preferred_intensity, constraints)
  values (uid, trim(p_draft->>'goalTitle'), left(trim(p_draft->>'goalTitle'), 90), '', (p_draft->>'deadline')::date, coalesce((p_draft->'levels'->0->>'bossName'), 'The Horizon'), p_draft->>'startingPoint', array(select jsonb_array_elements_text(coalesce(p_draft->'availableDays', '[]'::jsonb))), nullif(p_draft->>'minutesPerDay','')::integer, p_draft->>'preferredIntensity', p_draft->>'constraints')
  returning * into goal_row;
  for item in select * from jsonb_array_elements(p_draft->'levels') loop
    n := n + 1;
    insert into public.roadmap_levels(goal_id, user_id, number, title, purpose, status, milestone, boss_type, boss_name, boss_health, habits, tasks)
    values (goal_row.id, uid, n, coalesce(item->>'title', 'Level ' || n), coalesce(item->>'purpose',''), case when n = 1 then 'active' else 'locked' end, coalesce(item->>'milestone',''), coalesce(item->>'bossType','none'), item->>'bossName', case when coalesce(item->>'bossType','none') = 'none' then null else 100 end, coalesce(item->'habits','[]'::jsonb), coalesce(item->'tasks','[]'::jsonb));
  end loop;
  return to_jsonb(goal_row);
end; $$;

create or replace function public.odyssey_update_goal(p_goal_id uuid, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare row_goal public.goals%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  update public.goals set
    title = coalesce(nullif(trim(p_patch->>'title'), ''), title),
    short_title = coalesce(nullif(trim(p_patch->>'shortTitle'), ''), short_title),
    description = coalesce(p_patch->>'description', description),
    deadline = coalesce(nullif(p_patch->>'deadline', '')::date, deadline),
    starting_point = coalesce(p_patch->>'startingPoint', starting_point),
    available_days = case when p_patch ? 'availableDays' then array(select jsonb_array_elements_text(coalesce(p_patch->'availableDays', '[]'::jsonb))) else available_days end,
    minutes_per_day = coalesce(nullif(p_patch->>'minutesPerDay','')::integer, minutes_per_day),
    preferred_intensity = coalesce(p_patch->>'preferredIntensity', preferred_intensity),
    constraints = coalesce(p_patch->>'constraints', constraints)
  where id = p_goal_id and user_id = auth.uid() returning * into row_goal;
  if not found then raise exception 'Goal not found'; end if;
  return to_jsonb(row_goal);
end; $$;

create or replace function public.odyssey_complete_goal(p_goal_id uuid, p_victory_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare row_goal public.goals%rowtype;
begin
  update public.goals set status = 'completed', progress = 100, completed_at = now(), victory_note = coalesce(p_victory_note, victory_note)
  where id = p_goal_id and user_id = auth.uid() and current_level = 10 and boss_health = 0
  returning * into row_goal;
  if not found then raise exception 'The final level and boss must be completed before this Odyssey can close'; end if;
  return to_jsonb(row_goal);
end; $$;

create or replace function public.odyssey_create_quest(p_input jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); row_quest public.quests%rowtype; reward record;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  if not exists(select 1 from public.goals where id = (p_input->>'goalId')::uuid and user_id = uid and status = 'active') then raise exception 'Choose one of your active Odysseys'; end if;
  select * into reward from public.odyssey_reward_for_priority(coalesce(p_input->>'priority', 'medium'));
  insert into public.quests(user_id, goal_id, title, description, kind, status, scheduled_at, deadline_at, duration_minutes, priority, planned_intensity, recurrence, proof_policy, series_id, reward_xp, reward_rubies, boss_damage)
  values (uid, (p_input->>'goalId')::uuid, trim(p_input->>'title'), coalesce(p_input->>'description',''), p_input->>'kind', 'scheduled', (p_input->>'scheduledAt')::timestamptz, nullif(p_input->>'deadlineAt','')::timestamptz, (p_input->>'durationMinutes')::integer, p_input->>'priority', p_input->>'plannedIntensity', nullif(p_input->>'recurrence',''), coalesce(p_input->>'proofPolicy','none'), nullif(p_input->>'seriesId',''), reward.xp, reward.rubies, reward.damage)
  returning * into row_quest;
  return to_jsonb(row_quest);
end; $$;

create or replace function public.odyssey_update_quest(p_quest_id uuid, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); row_quest public.quests%rowtype; reward record; priority_value text;
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
    proof_policy = coalesce(p_patch->>'proofPolicy', proof_policy), reward_xp = reward.xp, reward_rubies = reward.rubies, boss_damage = reward.damage
  where id = p_quest_id and user_id = uid and status not in ('completed', 'completionPending') returning * into row_quest;
  if not found then raise exception 'Only a scheduled quest can be updated'; end if;
  return to_jsonb(row_quest);
end; $$;

create or replace function public.odyssey_delete_quest(p_quest_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.quests where id = p_quest_id and user_id = auth.uid() and status not in ('completed', 'completionPending');
  if not found then raise exception 'Only a scheduled quest can be deleted'; end if;
end; $$;

create or replace function public.odyssey_complete_quest(p_quest_id uuid, p_actual_intensity text, p_proof_object_key text, p_client_mutation_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); row_quest public.quests%rowtype; row_goal public.goals%rowtype; inv public.reward_inventory%rowtype; proof_required boolean; bonus_xp integer := 0;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  if p_actual_intensity not in ('light', 'normal', 'intense') then raise exception 'Choose Light, Normal, or Intense effort'; end if;
  select * into row_quest from public.quests where id = p_quest_id and user_id = uid for update;
  if not found then raise exception 'Quest not found'; end if;
  if row_quest.completion_mutation_id = p_client_mutation_id then
    select * into row_goal from public.goals where id = row_quest.goal_id; return jsonb_build_object('quest', to_jsonb(row_quest), 'rewards', jsonb_build_object('xp', row_quest.reward_xp, 'rubies', row_quest.reward_rubies), 'bossHealth', row_goal.boss_health);
  end if;
  if row_quest.status = 'completed' then raise exception 'This quest has already been completed'; end if;
  proof_required := row_quest.proof_policy = 'required';
  if proof_required and coalesce(p_proof_object_key, '') = '' then raise exception 'Private photo proof is required for this quest'; end if;
  if p_proof_object_key is not null and p_proof_object_key not like uid::text || '/proofs/%' then raise exception 'Invalid proof object key'; end if;
  if p_proof_object_key is not null and p_proof_object_key <> '' and not exists (select 1 from storage.objects where bucket_id = 'odyssey-private-proof' and name = p_proof_object_key and owner_id = uid) then raise exception 'Private proof upload was not confirmed'; end if;
  select * into inv from public.reward_inventory where user_id = uid for update;
  if inv.active_boost_id = 'boost-focus' and p_actual_intensity = 'intense' then bonus_xp := 25; end if;
  update public.quests set status = 'completed', actual_intensity = p_actual_intensity, proof_object_key = nullif(p_proof_object_key,''), completed_at = now(), completion_mutation_id = p_client_mutation_id where id = row_quest.id returning * into row_quest;
  if p_proof_object_key is not null and p_proof_object_key <> '' then insert into public.proofs(user_id, quest_id, object_key, captured_at) values(uid, row_quest.id, p_proof_object_key, now()); end if;
  update public.goals set boss_health = greatest(0, boss_health - row_quest.boss_damage), progress = least(100, greatest(progress, floor((100 - greatest(0, boss_health - row_quest.boss_damage))::numeric / 100 * 10)::integer)) where id = row_quest.goal_id and user_id = uid returning * into row_goal;
  update public.profiles set xp = xp + row_quest.reward_xp + bonus_xp, account_level = greatest(1, floor((xp + row_quest.reward_xp + bonus_xp)::numeric / 500)::integer + 1), xp_to_next_level = (floor((xp + row_quest.reward_xp + bonus_xp)::numeric / 500)::integer + 1) * 500 where id = uid;
  update public.reward_inventory set rubies = rubies + row_quest.reward_rubies, active_boost_id = null where user_id = uid;
  insert into public.reward_ledger(user_id, kind, title, xp, rubies, source_id) values(uid, 'quest', row_quest.title || ' completed', row_quest.reward_xp + bonus_xp, row_quest.reward_rubies, row_quest.id::text);
  insert into public.notifications(user_id, title, body, kind, target_route) values(uid, row_quest.title || ' completed', (row_quest.reward_xp + bonus_xp) || ' XP and ' || row_quest.reward_rubies || ' rubies were confirmed.', 'reward', '/rewards');
  return jsonb_build_object('quest', to_jsonb(row_quest), 'rewards', jsonb_build_object('xp', row_quest.reward_xp + bonus_xp, 'rubies', row_quest.reward_rubies), 'bossHealth', row_goal.boss_health);
end; $$;

create or replace function public.odyssey_attach_proof(p_quest_id uuid, p_object_key text, p_captured_at timestamptz) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); row_proof public.proofs%rowtype;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  if p_object_key not like uid::text || '/proofs/%' then raise exception 'Invalid proof object key'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'odyssey-private-proof' and name = p_object_key and owner_id = uid) then raise exception 'Private proof upload was not confirmed'; end if;
  update public.quests set proof_object_key = p_object_key where id = p_quest_id and user_id = uid and status = 'completed' and proof_object_key is null;
  if not found then raise exception 'A proof can only be attached once to one of your completed quests'; end if;
  insert into public.proofs(user_id, quest_id, object_key, captured_at) values(uid, p_quest_id, p_object_key, p_captured_at) returning * into row_proof;
  return to_jsonb(row_proof);
end; $$;

create or replace function public.odyssey_open_chest(p_chest_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); xp_amount integer := 120; ruby_amount integer := 24;
begin
  update public.reward_inventory set unopened_chests = unopened_chests - 1 where user_id = uid and unopened_chests > 0;
  if not found then raise exception 'There is no earned chest ready to open'; end if;
  update public.profiles set xp = xp + xp_amount where id = uid;
  update public.reward_inventory set rubies = rubies + ruby_amount where user_id = uid;
  insert into public.reward_ledger(user_id, kind, title, xp, rubies, source_id) values(uid, 'chest', 'Earned chest opened', xp_amount, ruby_amount, p_chest_id);
  return jsonb_build_object('chestId', p_chest_id, 'xp', xp_amount, 'rubies', ruby_amount);
end; $$;

create or replace function public.odyssey_select_cosmetic(p_cosmetic_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); cosmetics_value jsonb; selected_name text;
begin
  select cosmetics into cosmetics_value from public.reward_inventory where user_id = uid for update;
  if not exists(select 1 from jsonb_array_elements(cosmetics_value) x where x->>'id' = p_cosmetic_id and coalesce((x->>'unlocked')::boolean, false)) then raise exception 'This cosmetic is not unlocked'; end if;
  selected_name := (select x->>'name' from jsonb_array_elements(cosmetics_value) x where x->>'id' = p_cosmetic_id);
  update public.reward_inventory set cosmetics = (select jsonb_agg(x || jsonb_build_object('selected', x->>'id' = p_cosmetic_id)) from jsonb_array_elements(cosmetics_value) x) where user_id = uid;
  update public.profiles set selected_cosmetic = selected_name where id = uid;
  return (select to_jsonb(i) - 'user_id' - 'updated_at' from public.reward_inventory i where user_id = uid);
end; $$;

create or replace function public.odyssey_unlock_cosmetic(p_cosmetic_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); current_inventory public.reward_inventory%rowtype; price integer;
begin
  select * into current_inventory from public.reward_inventory where user_id = uid for update;
  select coalesce((x->>'rubyPrice')::integer, -1) into price from jsonb_array_elements(current_inventory.cosmetics) x where x->>'id' = p_cosmetic_id and coalesce((x->>'unlocked')::boolean, false) = false;
  if price is null or price < 0 then raise exception 'This cosmetic cannot be unlocked with rubies'; end if;
  if current_inventory.rubies < price then raise exception 'Not enough rubies'; end if;
  update public.reward_inventory set rubies = rubies - price, cosmetics = (select jsonb_agg(case when x->>'id' = p_cosmetic_id then x || '{"unlocked":true}'::jsonb else x end) from jsonb_array_elements(current_inventory.cosmetics) x) where user_id = uid;
  insert into public.reward_ledger(user_id, kind, title, rubies, source_id) values(uid, 'cosmetic', 'Cosmetic unlocked', -price, p_cosmetic_id);
  return (select to_jsonb(i) - 'user_id' - 'updated_at' from public.reward_inventory i where user_id = uid);
end; $$;

create or replace function public.odyssey_apply_boost(p_boost_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); current_inventory public.reward_inventory%rowtype; boost_name text;
begin
  select * into current_inventory from public.reward_inventory where user_id = uid for update;
  select x->>'name' into boost_name from jsonb_array_elements(current_inventory.boosts) x where x->>'id' = p_boost_id and coalesce((x->>'quantity')::integer,0) > 0;
  if boost_name is null then raise exception 'This boost is not available'; end if;
  update public.reward_inventory set active_boost_id = p_boost_id, boosts = (select jsonb_agg(case when x->>'id' = p_boost_id then jsonb_set(x, '{quantity}', to_jsonb(greatest(0, (x->>'quantity')::integer - 1))) else x end) from jsonb_array_elements(current_inventory.boosts) x) where user_id = uid;
  insert into public.reward_ledger(user_id, kind, title, source_id) values(uid, 'boost', boost_name || ' prepared', p_boost_id);
  return (select to_jsonb(i) - 'user_id' - 'updated_at' from public.reward_inventory i where user_id = uid);
end; $$;

create or replace function public.odyssey_use_streak_protection(p_quest_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); title_value text := 'Streak protection reserved for the next eligible miss';
begin
  update public.reward_inventory set streak_protection = streak_protection - 1 where user_id = uid and streak_protection > 0;
  if not found then raise exception 'No streak protection is available'; end if;
  if p_quest_id is not null then update public.quests set streak_protected = true where id = p_quest_id and user_id = uid and status in ('missed','overdue'); if found then select 'Streak protected after ' || title into title_value from public.quests where id = p_quest_id; end if; end if;
  insert into public.reward_ledger(user_id, kind, title, source_id) values(uid, 'streakProtection', title_value, coalesce(p_quest_id::text, 'reserved'));
  return (select to_jsonb(i) - 'user_id' - 'updated_at' from public.reward_inventory i where user_id = uid);
end; $$;

revoke all on all tables in schema public from anon;
grant select on public.profiles, public.preferences, public.goals, public.roadmap_levels, public.quests, public.proofs, public.reward_inventory, public.reward_ledger, public.notifications to authenticated;
grant update on public.preferences to authenticated;
grant update (read) on public.notifications to authenticated;
grant execute on all functions in schema public to authenticated;
