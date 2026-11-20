-- CyberAware: обнулить прогресс тестовых аккаунтов (is_test = true), не удаляя сами аккаунты.
-- Удаляет их попытки тестов, ответы, взаимодействия и события, кроме назначения группы.
-- Группа, анкета и пароль остаются: после входа аккаунт снова начинает с входного теста.
-- Настоящих участников не трогает. Отменить нельзя.
-- SQL Editor → New query → вставить файл → Run.

delete from public.answers      where user_id in (select id from public.profiles where is_test);
delete from public.test_attempts where user_id in (select id from public.profiles where is_test);
delete from public.interactions where user_id in (select id from public.profiles where is_test);
delete from public.events
 where user_id in (select id from public.profiles where is_test)
   and type <> 'cohort_assigned';

-- Проверка: у тестовых аккаунтов не осталось попыток
select u.email, p.cohort,
       (select count(*) from public.test_attempts a where a.user_id = p.id) as attempts
from public.profiles p join auth.users u on u.id = p.id
where p.is_test
order by u.email;
