-- CyberAware: итоговый тест не раньше чем через 3 дня после входного.
-- Применить после 006_test_accounts.sql: SQL Editor → New query → вставить файл → Run.
-- Скрипт можно запускать повторно.
--
-- Сайт проверяет то же самое (src/research/config.js → postMinDaysAfterPre = 3).
-- Здесь запас 12 часов на расхождение часов устройства и сервера, чтобы честный участник
-- никогда не получил отказ при сохранении. Тестовых аккаунтов (is_test) правило не касается.

create or replace function public.check_post_after_pre()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  pre_at timestamptz;
  is_test_account boolean;
begin
  if new.phase <> 'post' then return new; end if;

  select min(created_at) into pre_at
    from public.test_attempts where user_id = new.user_id and phase = 'pre';
  if pre_at is null then
    raise exception 'post-test requires a completed pre-test';
  end if;

  select coalesce(is_test, false) into is_test_account from public.profiles where id = new.user_id;
  if not is_test_account and now() < pre_at + interval '3 days' - interval '12 hours' then
    raise exception 'post-test opens 3 days after the pre-test';
  end if;
  return new;
end;
$$;
