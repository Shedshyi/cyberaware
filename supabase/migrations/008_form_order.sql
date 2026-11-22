-- CyberAware: параллельные варианты входного/итогового теста (A и B) с контрбалансировкой.
-- Применить после 007_post_delay.sql: SQL Editor → New query → вставить файл → Run.
-- Скрипт можно запускать повторно.
--
-- profiles.form_order: 'AB' — на входе вариант A, на выходе B; 'BA' — наоборот.
-- Назначается вместе с группой и поровну ВНУТРИ каждой группы (и отдельно для тестовых
-- аккаунтов), чтобы разница в сложности вариантов не смешивалась с эффектом платформы.
-- Участник не может сам изменить поле: прав на него у него нет.

alter table public.profiles add column if not exists form_order text
  check (form_order in ('AB', 'BA'));

create or replace function public.assign_cohort()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  me public.profiles;
  n_exp int;
  n_ctl int;
  n_ab int;
  n_ba int;
  chosen text;
  order_chosen text;
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

  -- Порядок вариантов — поровну внутри выбранной группы
  select count(*) filter (where form_order = 'AB'),
         count(*) filter (where form_order = 'BA')
    into n_ab, n_ba
    from public.profiles
   where role = 'participant' and consent and cohort_assigned_at is not null
     and is_test = me.is_test and cohort = chosen;

  order_chosen := case
    when n_ab < n_ba then 'AB'
    when n_ba < n_ab then 'BA'
    when random() < 0.5 then 'AB'
    else 'BA'
  end;

  update public.profiles
     set cohort = chosen, cohort_assigned_at = now(), form_order = order_chosen
   where id = me.id;
  return chosen;
end;
$$;

revoke all on function public.assign_cohort() from public, anon;
grant execute on function public.assign_cohort() to authenticated;

-- Уже распределённым участникам без порядка — чередование по времени назначения
-- внутри (пул, группа). Тем, кто уже прошёл входной тест, порядок не меняет смысла:
-- их ответы всё равно привязаны к id вопросов.
with ranked as (
  select id, row_number() over (partition by is_test, cohort order by cohort_assigned_at, id) as rn
    from public.profiles
   where role = 'participant' and cohort_assigned_at is not null and form_order is null
)
update public.profiles p
   set form_order = case when r.rn % 2 = 1 then 'AB' else 'BA' end
  from ranked r
 where p.id = r.id;
