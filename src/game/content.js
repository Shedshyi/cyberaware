// Тексты геймификации: звания, награды, брифинги миссий, причины опыта. RU / EN.

export const RANKS = {
  ru: [
    { name: "Стажёр", line: "Первый день в центре киберзащиты. Осмотрись и начни с первой миссии." },
    { name: "Младший аналитик", line: "Тебе доверяют разбирать подозрительные письма." },
    { name: "Аналитик", line: "Коллеги приходят к тебе с вопросами про пароли и ссылки." },
    { name: "Старший аналитик", line: "Ты замечаешь атаки раньше, чем они срабатывают." },
    { name: "Защитник", line: "Команда полагается на твоё решение в сложных случаях." },
    { name: "Эксперт центра", line: "Ты учишь других тому, что умеешь сам." },
  ],
  en: [
    { name: "Intern", line: "Day one at the cyber defence centre. Look around and start your first mission." },
    { name: "Junior analyst", line: "You're trusted to review suspicious emails." },
    { name: "Analyst", line: "Colleagues come to you about passwords and links." },
    { name: "Senior analyst", line: "You spot attacks before they land." },
    { name: "Defender", line: "The team relies on your call in tricky cases." },
    { name: "Centre expert", line: "You teach others what you can do yourself." },
  ],
};

export const BADGE_TEXT = {
  ru: {
    first_mission: { icon: "🎯", title: "Первая миссия", desc: "Сдай первую тему на 75% и выше" },
    half_way:      { icon: "🧭", title: "Половина пути", desc: "Серебро в 5 темах" },
    full_course:   { icon: "🛡️", title: "Полный курс", desc: "Серебро во всех 10 темах" },
    gold_three:    { icon: "🥇", title: "Мастер", desc: "Золото в 3 темах" },
    no_hints:      { icon: "💪", title: "Сам справлюсь", desc: "Сдай 3 теста без подсказок" },
    comeback:      { icon: "🔁", title: "Работа над ошибками", desc: "Пересдай тему, которая не получилась" },
    detective:     { icon: "🕵️", title: "Детектив", desc: "75% верных раундов в Hacker Game" },
    streak_3:      { icon: "🔥", title: "Три дня подряд", desc: "Выполни дневную цель 3 дня подряд" },
    streak_7:      { icon: "📅", title: "Неделя практики", desc: "Выполни дневную цель 7 дней подряд" },
  },
  en: {
    first_mission: { icon: "🎯", title: "First mission", desc: "Pass your first topic with 75%+" },
    half_way:      { icon: "🧭", title: "Halfway", desc: "Silver in 5 topics" },
    full_course:   { icon: "🛡️", title: "Full course", desc: "Silver in all 10 topics" },
    gold_three:    { icon: "🥇", title: "Master", desc: "Gold in 3 topics" },
    no_hints:      { icon: "💪", title: "On my own", desc: "Pass 3 tests without hints" },
    comeback:      { icon: "🔁", title: "Learning from mistakes", desc: "Retake a topic that didn't work out" },
    detective:     { icon: "🕵️", title: "Detective", desc: "75% correct rounds in Hacker Game" },
    streak_3:      { icon: "🔥", title: "Three days in a row", desc: "Meet the daily goal 3 days in a row" },
    streak_7:      { icon: "📅", title: "A week of practice", desc: "Meet the daily goal 7 days in a row" },
  },
};

// Брифинг миссии — одна строка сюжета над уроком
export const MISSION_BRIEF = {
  ru: {
    basics:    "В общий чат компании прилетела «срочная новость». Разберись, как проверять информацию, прежде чем ей верить.",
    passwords: "Утекла база паролей одного сервиса. Проверь, чьи аккаунты под угрозой, и научи коллег защищаться.",
    phishing:  "Бухгалтерия получила письмо «от директора» с просьбой срочно перевести деньги. Найди подвох.",
    socials:   "Мошенники собирают данные сотрудников из открытых профилей. Закрой утечки.",
    malware:   "На одном из ноутбуков файлы стали недоступны. Выясни, что за программа и как не допустить повтора.",
    wifi:      "Командировка, аэропорт, бесплатный Wi-Fi. Реши, к какой сети можно подключиться.",
    updates:   "На сервере висит обновление «на потом». Объясни команде, почему ждать нельзя.",
    privacy:   "Новое приложение просит доступ ко всему подряд. Реши, какие разрешения действительно нужны.",
    recovery:  "Кто-то вошёл в почту сотрудника. Действуй по шагам, пока ущерб не вырос.",
    summary:   "Финальная проверка: собери всё, чему научился, в план защиты.",
  },
  en: {
    basics:    "An “urgent news” message hits the company chat. Learn how to check information before trusting it.",
    passwords: "A service's password database leaked. Find out whose accounts are at risk and teach colleagues to protect themselves.",
    phishing:  "Accounting got an email “from the director” asking for an urgent transfer. Spot the catch.",
    socials:   "Scammers are collecting staff data from public profiles. Close the leaks.",
    malware:   "Files on one laptop became unreadable. Find out what program it is and how to prevent it.",
    wifi:      "Business trip, airport, free Wi-Fi. Decide which network is safe to join.",
    updates:   "An update on the server is waiting “for later”. Explain to the team why it can't wait.",
    privacy:   "A new app asks for access to everything. Decide which permissions it really needs.",
    recovery:  "Someone got into a colleague's mailbox. Act step by step before the damage grows.",
    summary:   "Final check: turn everything you've learned into a protection plan.",
  },
};

export const GAIN_TEXT = {
  ru: {
    lesson_first_open: "Новая миссия открыта", practice_done: "Тест пройден", practice_correct: "Верные ответы",
    topic_passed_first: "Тема сдана", improved: "Результат улучшен", game_round_correct: "Верные раунды",
    skill_check: "Оценка уровня", daily_goal: "Дневная цель выполнена",
  },
  en: {
    lesson_first_open: "New mission opened", practice_done: "Test completed", practice_correct: "Correct answers",
    topic_passed_first: "Topic passed", improved: "Result improved", game_round_correct: "Correct rounds",
    skill_check: "Skill check", daily_goal: "Daily goal met",
  },
};

export const MEDAL = {
  ru: { started: "Начата", bronze: "Бронза", silver: "Серебро", gold: "Золото" },
  en: { started: "Started", bronze: "Bronze", silver: "Silver", gold: "Gold" },
};
export const MEDAL_ICON = { started: "◔", bronze: "🥉", silver: "🥈", gold: "🥇" };
