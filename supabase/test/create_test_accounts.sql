-- CyberAware: 10 тестовых аккаунтов test01…test10@cyberaware.test
-- Применять ПОСЛЕ миграции 006_test_accounts.sql.
--
-- 1. Впиши пароль между кавычками в строке  pw text := '';  ниже (не короче 8 символов; один на все 10 аккаунтов).
-- 2. SQL Editor → New query → вставить файл → Run.
--
-- Что делает скрипт:
--   • создаёт аккаунты с подтверждённой почтой (письма не нужны), входить — по email и паролю;
--   • помечает их тестовыми (is_test = true) и заполняет анкету с согласием;
--   • распределяет по группам той же функцией assign_cohort(), что и настоящих участников,
--     но в отдельном пуле тестовых — баланс настоящих участников не меняется;
--   • в конце показывает, кто в какой группе.
-- Повторный запуск не создаёт дубликаты и не меняет уже назначенные группы.
-- Удаление: supabase/test/delete_test_accounts.sql.

do $$
declare
  pw  text := '';  -- ← пароль между кавычками
  i   int;
  uid uuid;
  em  text;
  grp text;
begin
  if length(pw) < 8 then
    raise exception 'Впиши пароль (не короче 8 символов) в строку pw в начале скрипта';
  end if;

  for i in 1..10 loop
    em := format('test%s@cyberaware.test', lpad(i::text, 2, '0'));
    select id into uid from auth.users where email = em;

    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
        extensions.crypt(pw, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
        '', '', '', ''
      );
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text,
              jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
              'email', now(), now(), now());
    end if;

    -- Профиль создаёт триггер handle_new_user; на всякий случай — если его нет
    insert into public.profiles (id) values (uid) on conflict (id) do nothing;

    update public.profiles set
      is_test        = true,
      display_name   = coalesce(display_name, format('Тест %s', lpad(i::text, 2, '0'))),
      age            = coalesce(age, 18 + i % 6),
      occupation     = coalesce(occupation, case when i % 3 = 0 then 'master' else 'bachelor' end),
      prior_training = coalesce(prior_training, i % 4 = 0),
      self_rating    = coalesce(self_rating, 1 + i % 5),
      consent        = true,
      consent_at     = coalesce(consent_at, now()),
      onboarded_at   = coalesce(onboarded_at, now())
    where id = uid;

    -- Назначение группы «от имени» участника — ровно как на сайте после анкеты
    if (select cohort_assigned_at from public.profiles where id = uid) is null then
      perform set_config('request.jwt.claims', json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
      grp := public.assign_cohort();
      insert into public.events (user_id, type, payload)
        values (uid, 'cohort_assigned', jsonb_build_object('cohort', grp, 'source', 'test_seed'));
    end if;
  end loop;
end $$;

-- Итог: кто в какой группе
select u.email, p.display_name, p.cohort, p.cohort_assigned_at
from public.profiles p join auth.users u on u.id = p.id
where p.is_test
order by u.email;
