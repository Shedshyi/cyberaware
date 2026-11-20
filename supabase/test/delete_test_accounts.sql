-- CyberAware: удалить ВСЕ тестовые аккаунты (is_test = true и адреса @cyberaware.test)
-- вместе со всеми их данными: попытки тестов, ответы, события, взаимодействия.
-- Настоящих участников не трогает. Отменить удаление нельзя.
-- SQL Editor → New query → вставить файл → Run.

-- 1. Сначала посмотреть, кто будет удалён:
select u.email, p.display_name, p.cohort
from auth.users u left join public.profiles p on p.id = u.id
where u.email like '%@cyberaware.test' or p.is_test
order by u.email;

-- 2. Удаление (данные в public.* удаляются каскадом вместе с аккаунтом):
delete from auth.users
where email like '%@cyberaware.test'
   or id in (select id from public.profiles where is_test);
