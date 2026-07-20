-- Accepted roadmaps remain editable, but boss placement is structural rather
-- than client-controlled. The deferrable constraint permits safe reordering.

alter table public.roadmap_levels drop constraint roadmap_levels_goal_id_number_key;
alter table public.roadmap_levels add constraint roadmap_levels_goal_id_number_key unique (goal_id, number) deferrable initially immediate;

create or replace function public.odyssey_boss_type_for_level(p_number integer) returns text
language sql immutable set search_path = public as $$
  select case when p_number = 10 then 'final' when p_number in (3, 6, 8) then 'mini' else 'none' end;
$$;

update public.roadmap_levels
set boss_type = public.odyssey_boss_type_for_level(number),
    boss_name = case when public.odyssey_boss_type_for_level(number) = 'none' then null else boss_name end,
    boss_health = case when public.odyssey_boss_type_for_level(number) = 'none' then null else coalesce(boss_health, 100) end;

create or replace function public.odyssey_accept_roadmap(p_draft jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); goal_row public.goals%rowtype; item jsonb; n integer := 0; boss_type_value text;
begin
  if uid is null then raise exception 'Authentication is required'; end if;
  if jsonb_array_length(coalesce(p_draft->'levels', '[]'::jsonb)) <> 10 then raise exception 'A roadmap must contain exactly ten levels'; end if;
  insert into public.goals(user_id, title, short_title, description, deadline, boss_name, starting_point, available_days, minutes_per_day, preferred_intensity, constraints)
  values (uid, trim(p_draft->>'goalTitle'), left(trim(p_draft->>'goalTitle'), 90), '', (p_draft->>'deadline')::date, coalesce(nullif(p_draft->'levels'->9->>'bossName', ''), 'The Final Shore'), p_draft->>'startingPoint', array(select jsonb_array_elements_text(coalesce(p_draft->'availableDays', '[]'::jsonb))), nullif(p_draft->>'minutesPerDay','')::integer, p_draft->>'preferredIntensity', p_draft->>'constraints')
  returning * into goal_row;
  for item in select * from jsonb_array_elements(p_draft->'levels') loop
    n := n + 1;
    boss_type_value := public.odyssey_boss_type_for_level(n);
    insert into public.roadmap_levels(goal_id, user_id, number, title, purpose, status, milestone, boss_type, boss_name, boss_health, habits, tasks)
    values (goal_row.id, uid, n, coalesce(item->>'title', 'Level ' || n), coalesce(item->>'purpose',''), case when n = 1 then 'active' else 'locked' end, coalesce(item->>'milestone',''), boss_type_value, case when boss_type_value = 'none' then null else coalesce(nullif(item->>'bossName',''), case when boss_type_value = 'final' then 'The Final Shore' else 'Trial of Level ' || n end) end, case when boss_type_value = 'none' then null else 100 end, coalesce(item->'habits','[]'::jsonb), coalesce(item->'tasks','[]'::jsonb));
  end loop;
  return to_jsonb(goal_row);
end; $$;

create or replace function public.odyssey_update_goal(p_goal_id uuid, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare row_goal public.goals%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  update public.goals set
    title = coalesce(nullif(trim(p_patch->>'title'), ''), title), short_title = coalesce(nullif(trim(p_patch->>'shortTitle'), ''), short_title),
    description = coalesce(p_patch->>'description', description), deadline = coalesce(nullif(p_patch->>'deadline', '')::date, deadline),
    starting_point = coalesce(p_patch->>'startingPoint', starting_point),
    available_days = case when p_patch ? 'availableDays' then array(select jsonb_array_elements_text(coalesce(p_patch->'availableDays', '[]'::jsonb))) else available_days end,
    minutes_per_day = coalesce(nullif(p_patch->>'minutesPerDay','')::integer, minutes_per_day), preferred_intensity = coalesce(p_patch->>'preferredIntensity', preferred_intensity), constraints = coalesce(p_patch->>'constraints', constraints)
  where id = p_goal_id and user_id = auth.uid() returning * into row_goal;
  if not found then raise exception 'Goal not found'; end if;

  if p_patch ? 'roadmap' then
    if jsonb_array_length(coalesce(p_patch->'roadmap', '[]'::jsonb)) <> 10
      or exists (select 1 from jsonb_array_elements(p_patch->'roadmap') level where coalesce(level->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or coalesce(level->>'number','') !~ '^(10|[1-9])$')
      or (select count(distinct level->>'id') from jsonb_array_elements(p_patch->'roadmap') level) <> 10
      or (select count(distinct (level->>'number')::integer) from jsonb_array_elements(p_patch->'roadmap') level) <> 10 then
      raise exception 'Roadmap levels must be a complete ordered set';
    end if;
    if exists (select 1 from public.roadmap_levels current left join jsonb_array_elements(p_patch->'roadmap') level on level->>'id' = current.id::text where current.goal_id = p_goal_id and current.user_id = auth.uid() and level is null)
      or exists (select 1 from jsonb_array_elements(p_patch->'roadmap') level left join public.roadmap_levels current on current.id::text = level->>'id' and current.goal_id = p_goal_id and current.user_id = auth.uid() where current.id is null) then
      raise exception 'Roadmap levels do not belong to this Odyssey';
    end if;
    if exists (select 1 from public.roadmap_levels current join jsonb_array_elements(p_patch->'roadmap') level on level->>'id' = current.id::text where current.goal_id = p_goal_id and current.user_id = auth.uid() and current.status = 'completed' and (current.number <> (level->>'number')::integer or current.title <> coalesce(level->>'title','') or current.purpose <> coalesce(level->>'purpose','') or current.milestone <> coalesce(level->>'milestone','') or current.habits <> coalesce(level->'habits','[]'::jsonb) or current.tasks <> coalesce(level->'tasks','[]'::jsonb))) then
      raise exception 'Completed roadmap levels are preserved as history';
    end if;
    set constraints roadmap_levels_goal_id_number_key deferred;
    update public.roadmap_levels current set
      number = (level->>'number')::integer,
      title = case when current.status = 'completed' then current.title else coalesce(nullif(trim(level->>'title'), ''), current.title) end,
      purpose = case when current.status = 'completed' then current.purpose else coalesce(level->>'purpose', current.purpose) end,
      milestone = case when current.status = 'completed' then current.milestone else coalesce(level->>'milestone', current.milestone) end,
      habits = case when current.status = 'completed' then current.habits else coalesce(level->'habits', current.habits) end,
      tasks = case when current.status = 'completed' then current.tasks else coalesce(level->'tasks', current.tasks) end,
      boss_type = public.odyssey_boss_type_for_level((level->>'number')::integer),
      boss_name = case when public.odyssey_boss_type_for_level((level->>'number')::integer) = 'none' then null else coalesce(nullif(level->>'bossName',''), case when (level->>'number')::integer = 10 then 'The Final Shore' else 'Trial of Level ' || (level->>'number') end) end,
      boss_health = case when public.odyssey_boss_type_for_level((level->>'number')::integer) = 'none' then null else coalesce(current.boss_health, 100) end
    from jsonb_array_elements(p_patch->'roadmap') level
    where current.id::text = level->>'id' and current.goal_id = p_goal_id and current.user_id = auth.uid();
  end if;
  return to_jsonb(row_goal);
end; $$;

revoke execute on function public.odyssey_boss_type_for_level(integer) from public, anon, authenticated;
