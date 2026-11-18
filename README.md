# CyberAware

Интерактивная платформа по киберграмотности: уроки, тесты, тренажёры и сбор данных для исследования.

Демо: https://shedshyi.github.io/cyberaware/

## Стек
- React 19 + Vite
- Supabase (Postgres, вход по email), опционально: без ключей сайт работает только на localStorage

## Запуск
```bash
npm install
npm run dev        # http://localhost:3000/cyberaware/
npm run build      # сборка в build/
npm run deploy     # публикация на GitHub Pages
```

## Подключение Supabase
1. Создай проект на https://supabase.com (бесплатный тариф).
2. SQL Editor → вставь `supabase/schema.sql` → Run.
3. Authentication → URL Configuration:
   - Site URL: `https://shedshyi.github.io/cyberaware/`
   - Redirect URLs: добавь `http://localhost:3000/cyberaware/`
4. (Опционально) Authentication → Email Templates → Magic Link: добавь в письмо `{{ .Token }}`,
   чтобы можно было войти по коду, а не только по ссылке.
5. Скопируй `.env.example` в `.env.local` и вставь Project URL и anon key (Project Settings → API).
6. После первого входа сделай себя исследователем (SQL в конце `schema.sql`).

## Документация
- `docs/adaptivity-gamification.md` — дизайн эксперимента, нечёткая модель, адаптивность, геймификация, сбор данных (для диссертации)
- `docs/sources.md` — источники фактов в уроках и тестах

## Данные
| Таблица | Что хранит |
|---|---|
| `profiles` | участник, группа (experimental/control), роль, согласие |
| `test_attempts` | попытки тестов: балл, время, фаза (pre/post/practice) |
| `answers` | ответ на каждый вопрос |
| `events` | открытие уроков, результаты игр |

Слой данных: `src/lib/store.js`. localStorage служит кэшем, при входе данные пишутся в Supabase.
