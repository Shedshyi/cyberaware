-- CyberAware: схема базы данных для Supabase
-- Как применить: Supabase Dashboard → SQL Editor → New query → вставить весь файл → Run.
-- Скрипт можно запускать повторно: он ничего не удаляет и не дублирует.

-- ─────────────────────────────────────────────────────────────
-- 1. Профили участников (1:1 с auth.users)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_color  text,
  age           int  check (age between 10 and 100),
  occupation    text,                 -- студент / работает / школьник и т.п.
  study_group   text,                 -- учебная группа или курс, для отчётов
  cohort        text not null default 'experimental'
                check (cohort in ('experimental', 'control')),
  role          text not null default 'participant'
                check (role in ('participant', 'researcher')),
  consent       boolean not null default false,  -- согласие на участие в исследовании
  consent_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Попытки прохождения тестов
--    phase: pre  — входное тестирование (до обучения)
--           post — итоговое тестирование (после обучения)
--           practice — обычное прохождение теста после урока
-- ─────────────────────────────────────────────────────────────
create table if not exists public.test_attempts (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  test_id       text not null,
  phase         text not null default 'practice'
                check (phase in ('pre', 'post', 'practice')),
  score         int  not null check (score >= 0),
  total         int  not null check (total > 0),
  duration_sec  int,
  timed_out     boolean not null default false,
  lang          text,
  created_at    timestamptz not null default now()
);
create index if not exists test_attempts_user_idx on public.test_attempts (user_id, created_at);
create index if not exists test_attempts_test_idx on public.test_attempts (test_id, phase);

-- ─────────────────────────────────────────────────────────────
-- 3. Ответы на отдельные вопросы (для анализа слабых тем)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.answers (
  id            bigint generated always as identity primary key,
  attempt_id    bigint not null references public.test_attempts (id) on delete cascade,
  user_id       uuid   not null references public.profiles (id) on delete cascade,
  question_id   int    not null,
  selected      int,                  -- null, если не ответил (вышло время)
  is_correct    boolean not null
);
create index if not exists answers_attempt_idx on public.answers (attempt_id);

-- ─────────────────────────────────────────────────────────────
-- 4. События (чтение уроков, тренажёры, игры)
--    type: lesson_open, lesson_read, game_finish, trainer_round и т.д.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.events (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          text not null,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists events_user_idx on public.events (user_id, created_at);
create index if not exists events_type_idx on public.events (type);

-- ─────────────────────────────────────────────────────────────
-- 5. Автосоздание профиля при регистрации
--    Группа (экспериментальная/контрольная) назначается случайно 50/50.
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, cohort)
  values (new.id, case when random() < 0.5 then 'experimental' else 'control' end)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 6. Права доступа (Row Level Security)
--    Участник видит и пишет только свои данные.
--    Исследователь (role = 'researcher') читает данные всех.
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_researcher()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'researcher');
$$;

alter table public.profiles      enable row level security;
alter table public.test_attempts enable row level security;
alter table public.answers       enable row level security;
alter table public.events        enable row level security;

-- profiles
drop policy if exists "profiles: read own or researcher" on public.profiles;
create policy "profiles: read own or researcher" on public.profiles
  for select using (id = auth.uid() or public.is_researcher());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Участник не может сам сменить себе роль или группу
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_color, age, occupation, study_group, consent, consent_at)
  on public.profiles to authenticated;

-- test_attempts
drop policy if exists "attempts: read own or researcher" on public.test_attempts;
create policy "attempts: read own or researcher" on public.test_attempts
  for select using (user_id = auth.uid() or public.is_researcher());

drop policy if exists "attempts: insert own" on public.test_attempts;
create policy "attempts: insert own" on public.test_attempts
  for insert with check (user_id = auth.uid());

-- answers
drop policy if exists "answers: read own or researcher" on public.answers;
create policy "answers: read own or researcher" on public.answers
  for select using (user_id = auth.uid() or public.is_researcher());

drop policy if exists "answers: insert own" on public.answers;
create policy "answers: insert own" on public.answers
  for insert with check (user_id = auth.uid());

-- events
drop policy if exists "events: read own or researcher" on public.events;
create policy "events: read own or researcher" on public.events
  for select using (user_id = auth.uid() or public.is_researcher());

drop policy if exists "events: insert own" on public.events;
create policy "events: insert own" on public.events
  for insert with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Как сделать себя исследователем (выполнить один раз после первого входа):
--   update public.profiles set role = 'researcher'
--   where id = (select id from auth.users where email = 'твой@email');
-- ─────────────────────────────────────────────────────────────
