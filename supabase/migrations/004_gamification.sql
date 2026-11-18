-- CyberAware: общий прогресс команды экспериментальной группы (причастность).
-- Возвращает только суммы: сколько участников и сколько тем они сдали вместе. Имена и
-- результаты отдельных людей не раскрываются. Применить после 003_adaptive.sql.

create or replace function public.team_progress()
returns json
language sql
stable
security definer set search_path = public
as $$
  with members as (
    select id from public.profiles
    where role = 'participant' and consent and cohort = 'experimental'
  ),
  passed as (
    select distinct e.user_id, e.payload->>'topic' as topic
    from public.events e
    join members m on m.id = e.user_id
    where e.type = 'xp_awarded' and e.payload->>'reason' = 'topic_passed_first'
  )
  select json_build_object(
    'members', (select count(*) from members),
    'topics_passed', (select count(*) from passed)
  );
$$;

revoke all on function public.team_progress() from public;
grant execute on function public.team_progress() to authenticated;
