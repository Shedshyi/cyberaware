-- CyberAware: строго равное распределение по группам, поведенческие данные для модели,
-- журнал обучающих взаимодействий. Применить ПОСЛЕ 002_research.sql. Можно запускать повторно.

-- ── 1. Группа назначается при согласии, а не при регистрации ───────────────
-- Раньше триггер при регистрации бросал монетку 50/50. Теперь группа пустая до согласия,
-- а при согласии участник попадает в ту группу, где сейчас меньше людей (равенство → случайно).
-- Так при любом числе участников группы отличаются не больше чем на одного человека.
alter table public.profiles alter column cohort drop not null;
alter table public.profiles alter column cohort drop default;
alter table public.profiles add column if not exists cohort_assigned_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

-- Профили без согласия, созданные старым триггером, теряют случайную группу
update public.profiles set cohort = null
where consent = false and cohort_assigned_at is null and role = 'participant';

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
  -- Один участник за раз: иначе двое одновременно могут попасть в одну и ту же «меньшую» группу
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
   where role = 'participant' and consent and cohort_assigned_at is not null;

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

revoke all on function public.assign_cohort() from public;
grant execute on function public.assign_cohort() to authenticated;

-- ── 2. Поведенческие данные ответа (входы модели из статьи ID137) ──────────
-- x2 время ответа, x3 подсказка, x4 сложность. x1 правильность уже есть (is_correct).
alter table public.answers add column if not exists response_ms int check (response_ms >= 0);
alter table public.answers add column if not exists hint_used boolean not null default false;
alter table public.answers add column if not exists difficulty smallint check (difficulty between 1 and 3);

-- ── 3. Обучающие взаимодействия вне тестов (тренажёры, адаптивная практика) ─
create table if not exists public.interactions (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  source       text not null,            -- trainer:hacker_game, trainer:fake_news, practice, …
  topic        text,                     -- id темы курса (basics, phishing, …)
  item_id      text not null,
  correct      boolean not null,
  response_ms  int check (response_ms >= 0),
  hint_used    boolean not null default false,
  difficulty   smallint check (difficulty between 1 and 3),
  created_at   timestamptz not null default now()
);
create index if not exists interactions_user_idx on public.interactions (user_id, created_at);

alter table public.interactions enable row level security;

drop policy if exists "interactions: read own or researcher" on public.interactions;
create policy "interactions: read own or researcher" on public.interactions
  for select using (user_id = auth.uid() or public.is_researcher());

drop policy if exists "interactions: insert own" on public.interactions;
create policy "interactions: insert own" on public.interactions
  for insert with check (user_id = auth.uid());
