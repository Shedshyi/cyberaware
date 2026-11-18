-- CyberAware: функции исследования доступны только вошедшим пользователям.
-- Supabase по умолчанию разрешает вызов функций из схемы public анонимной роли,
-- поэтому право нужно снять явно. Можно запускать повторно.
revoke execute on function public.assign_cohort() from anon;
revoke execute on function public.team_progress() from anon;
