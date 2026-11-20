-- CyberAware: тестовые аккаунты отдельно от настоящих участников.
-- Применить после 005_revoke_anon.sql: SQL Editor → New query → вставить файл → Run.
-- Скрипт можно запускать повторно.
--
-- profiles.is_test = true:
--   • у тестовых аккаунтов свой подсчёт групп: они делятся поровну между собой
--     и не сбивают баланс настоящих участников;
--   • не входят в «прогресс команды» настоящих участников;
--   • сайт не показывает их в статистике и выгрузке исследования (только в режиме «Тестовые»).
-- Участник не может сам поставить или снять пометку: права на это поле у него нет.

alter table public.profiles add column if not exists is_test boolean not null default false;

-- Распределение по группам: считается только внутри своего пула (тестовые / настоящие)
create or replace function public.assign_cohort()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  me public.profiles;
  n_exp int;
  n_ctl int;
  chosen text;
begin
  perform pg_advisory_xact_lock(hashtext('cyberaware_assign_cohort'));

  select * into me from public.profiles where id = auth.uid() for update;
  if me.id is null then raise exception 'no profile'; end if;
  if me.role <> 'participant' then return me.cohort; end if;
  if not me.consent then raise exception 'consent required'; end if;
  if me.cohort_assigned_at is not null then return me.cohort; end if;

  select count(*) filter (where cohort = 'experimental'),
         count(*) filter (where cohort = 'control')
    into n_exp, n_ctl
    from public.profiles
   where role = 'participant' and consent and cohort_assigned_at is not null
     and is_test = me.is_test;

  chosen := case
    when n_exp < n_ctl then 'experimental'
    when n_ctl < n_exp then 'control'
    when random() < 0.5 then 'experimental'
    else 'control'
  end;

  update public.profiles set cohort = chosen, cohort_assigned_at = now() where id = me.id;
  return chosen;
end;
$$;

revoke all on function public.assign_cohort() from public, anon;
grant execute on function public.assign_cohort() to authenticated;

-- Прогресс команды: участники того же пула, что и спрашивающий
create or replace function public.team_progress()
returns json
language sql
stable
security definer set search_path = public
as $$
  with me as (
    select coalesce((select is_test from public.profiles where id = auth.uid()), false) as is_test
  ),
  members as (
    select p.id from public.profiles p, me
    where p.role = 'participant' and p.consent and p.cohort = 'experimental' and p.is_test = me.is_test
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

revoke all on function public.team_progress() from public, anon;
grant execute on function public.team_progress() to authenticated;

-- Пометить аккаунт тестовым или снять пометку. Только исследователь.
-- Группа при этом не меняется (случайное распределение не трогаем).
create or replace function public.set_test_account(target uuid, flag boolean)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_researcher() then raise exception 'researchers only'; end if;
  update public.profiles set is_test = flag where id = target and role = 'participant';
  if not found then raise exception 'participant not found'; end if;
  insert into public.events (user_id, type, payload)
    values (target, 'test_flag_changed', jsonb_build_object('is_test', flag, 'by', auth.uid()));
  return flag;
end;
$$;

revoke all on function public.set_test_account(uuid, boolean) from public, anon;
grant execute on function public.set_test_account(uuid, boolean) to authenticated;
