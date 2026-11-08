-- CyberAware: режим исследования (входной и итоговый тест, анкета)
-- Применить ПОСЛЕ schema.sql: Supabase → SQL Editor → вставить → Run.
-- Можно запускать повторно.

-- ── Анкета участника ─────────────────────────────────────────
alter table public.profiles add column if not exists prior_training  boolean;          -- проходил ли раньше обучение по ИБ
alter table public.profiles add column if not exists self_rating     int
  check (self_rating between 1 and 5);                                                  -- самооценка киберграмотности 1–5
alter table public.profiles add column if not exists onboarded_at    timestamptz;

grant update (display_name, avatar_color, age, occupation, study_group,
              prior_training, self_rating, consent, consent_at, onboarded_at)
  on public.profiles to authenticated;

-- ── Входной (pre) и итоговый (post) тест — не более одного на участника ──
create unique index if not exists test_attempts_one_pre_post
  on public.test_attempts (user_id, phase)
  where phase in ('pre', 'post');

-- Итоговый тест нельзя сдать раньше входного
create or replace function public.check_post_after_pre()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.phase = 'post' and not exists (
    select 1 from public.test_attempts where user_id = new.user_id and phase = 'pre'
  ) then
    raise exception 'post-test requires a completed pre-test';
  end if;
  return new;
end;
$$;

drop trigger if exists test_attempts_post_after_pre on public.test_attempts;
create trigger test_attempts_post_after_pre
  before insert on public.test_attempts
  for each row execute function public.check_post_after_pre();

-- ── Сделать себя исследователем (после первого входа на сайт) ──
--   update public.profiles set role = 'researcher'
--   where id = (select id from auth.users where email = 'твой@email');
