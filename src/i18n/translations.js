export const ru = {
  nav: {
    lessons: "Уроки", tests: "Тесты", trainers: "Тренажёры",
    analytics: "Аналитика", profile: "Профиль",
    progress: "{done}/10 ✓",
    mobileProfile: "Профиль — {name}", mobileCourse: "Прогресс курса",
    mobileTests: "{done}/10 тестов",
  },
  theme: { toDark: "Тёмная тема", toLight: "Светлая тема" },

  home: {
    chip: "Курс по киберграмотности · 2025",
    title: "Cyber<gradient>Aware</gradient>",
    subtitle: "Учись распознавать цифровые угрозы — через короткие уроки, тесты с разбором ошибок и интерактивные тренажёры.",
    cta1: "Начать обучение →", cta2: "Открыть тренажёры",
    stats: { topics: "тем в курсе", questions: "вопросов", trainers: "тренажёров" },
    progress: {
      hi: "Привет, {name}! 👋", welcome: "Добро пожаловать обратно!",
      done: "Пройдено {done} из 10 тестов · Средний балл {avg}%",
      complete: "Курс пройден! Твой сертификат готов.",
      continue: "Продолжить →", certificate: "Получить сертификат →",
    },
    features: {
      eyebrow: "Что включает курс", title: "Всё для обучения в одном месте",
      subtitle: "От теории до практики — четыре раздела, которые вместе формируют полноценный навык цифровой безопасности.",
      lessons:   { label: "10 тем", title: "Уроки",      desc: "10 тем — от основ до реагирования. Концепции, реальные кейсы и советы.",     link: "Перейти →" },
      tests:     { label: "50 вопросов", title: "Тесты",  desc: "По 5 вопросов на каждую тему. Ответы с разбором ошибок после прохождения.", link: "Перейти →" },
      analytics: { label: "Твой прогресс", title: "Аналитика", desc: "Детальная картина результатов: средний балл, прогресс, слабые места.", link: "Перейти →" },
      trainers:  { label: "6 модулей", title: "Тренажёры", desc: "Фишинговые SMS, проверка паролей, определение фейков и другие практики.", link: "Перейти →" },
    },
    how: {
      eyebrow: "Как это работает", title: "Три шага до сертификата",
      steps: [
        { title: "Изучи урок",       desc: "Теория, реальные кейсы и советы по каждой теме курса." },
        { title: "Пройди тест",       desc: "5 вопросов с разбором ошибок после каждого урока." },
        { title: "Получи сертификат", desc: "Все 10 тестов ≥ 75% — и официальный сертификат твой." },
      ],
    },
    cookie: {
      text: "Мы используем localStorage для сохранения прогресса и результатов тестов. Никаких данных на сервер.",
      accept: "Понятно", decline: "Не сейчас",
      toastAccept: "Готово. Хороший повод читать баннеры перед кликом.",
      toastDecline: "Окей, продолжаем без лишнего шума.",
    },
  },

  lessons: {
    eyebrow: "Учебный план", title: "Уроки по кибербезопасности",
    subtitle: "10 тем от основ до продвинутых концепций. Каждый урок — теория, реальный кейс и тест.",
    progress: { label: "Прогресс курса", read: "прочитано", passed: "тестов сдано" },
    start: "Начать урок", reread: "Перечитать", retry: "Повторить урок",
    badgeRead: "📖 Прочитано", badgePassed: "✓ Сдан", badgeFailed: "✗ Не сдан",
    goTo: "→",
  },

  lessonPage: {
    lessonOf: "Урок {idx} из {total}",
    read: "✓ Прочитано",
    concepts: "Ключевые концепции",
    facts: "Ключевые факты",
    doTitle: "Что делать", dontTitle: "Чего избегать",
    caseTitle: "Реальный кейс",
    caseLesson: "Вывод:",
    tips: "Советы",
    takeTest: "Пройти тест →",
    nextLesson: "Следующий урок →",
    backToLessons: "← Все уроки",
  },

  tests: {
    eyebrow: "Проверь знания", title: "Тесты по кибербезопасности",
    subtitle: "5 вопросов по каждой теме. Результат сохраняется — возвращайся и улучшай счёт.",
    notStarted: "Ещё не сдан", start: "Начать тест →", retry: "Пройти снова",
    scoreLabel: "Лучший результат",
  },

  testPage: {
    eyebrow: "Тест",
    answered: "{answered} / {total} отвечено",
    timerUrgent: "⏱ {time} — скоро конец!",
    timer: "⏱ {time}",
    submit: "Завершить тест",
    timedOut: "⏰ Время вышло!",
    result: {
      passed: "🎉 Отлично! Тест пройден.",
      failed: "Попробуй ещё раз — изучи урок заново.",
      score: "Результат: {score} / {total}",
      explanation: "Разбор:",
      retry: "Пройти снова",
      backLessons: "← К урокам",
      correct: "✓ Верно", wrong: "✗ Неверно",
    },
  },

  analytics: {
    eyebrow: "Твой прогресс", title: "Аналитика обучения",
    noData: "Ещё нет результатов. Пройди хотя бы один тест.",
    stats: {
      done: "Пройдено тестов", avg: "Средний балл", best: "Лучший результат", worst: "Требует внимания",
    },
    table: { test: "Тест", score: "Балл", date: "Дата", status: "Статус", passed: "Сдан", failed: "Не сдан" },
    chart: "Прогресс по тестам",
  },

  funzone: {
    eyebrow: "Интерактивные модули", title: "Тренажёры",
    subtitle: "Практика важнее теории. Таймеры, комбо, рекорды — прокачай навык прямо сейчас.",
    hiScore: "Твой рекорд в Hacker Game: {score} очков",
    trainers: {
      hackerGame: { title: "Hacker Game", desc: "Таймер, жизни, комбо-множитель. Определи фишинг по реалистичным email, SMS, браузеру и уведомлениям — за 12 секунд.", time: "5–8 мин", badge: "Геймификация", score: "Рекорд: {s} очков" },
      phishing:   { title: "Фишинг-тренажёр", desc: "Найди опасные элементы в реалистичных SMS. Нажимай на подозрительные части сообщения.", time: "5–7 мин", badge: "Интерактив", score: "Раундов: {s}" },
      socialEng:  { title: "Социальная инженерия", desc: "6 реальных сценариев манипуляции — угрозы, давление, претекстинг. Выбери правильную реакцию.", time: "6 мин", badge: "Новое", score: "Верно: {s}/6" },
      urlScanner: { title: "URL-инспектор", desc: "Учись замечать тайпосквоттинг, подменные домены, IDN-атаки и скрытые IP в ссылках.", time: "4 мин", badge: "Новое" },
      fakeNews:   { title: "Fake News", desc: "Отличай настоящие новости от фейков. Тренируй критическое мышление на реальных примерах.", time: "5 мин" },
      password:   { title: "Проверка пароля", desc: "Мгновенный анализ надёжности: энтропия, паттерны, время перебора и конкретные советы.", time: "2 мин" },
      dataSort:   { title: "Сортировка данных", desc: "Раздели данные на критичные и некритичные — пойми, что безопасно раскрывать публично.", time: "3 мин" },
    },
    start: "Начать →",
  },

  hackerGame: {
    eyebrow: "Раунд {idx} / {total}", title: "Hacker Game",
    subtitle: "Определи — это фишинг или нет?",
    hud: { lives: "Жизни", points: "очков", combo: "🔥 ×{m} комбо" },
    block: "🚫 Это фишинг", safe: "✅ Безопасно",
    fb: {
      correct: "✅ Верно! +{pts} очков",
      correctCombo: "✅ Верно! +{pts} очков (×{m})",
      wrong: "❌ Ошибка! −❤️",
      timeout: "⏰ Время вышло! −❤️",
    },
    result: {
      eyebrow: "Результат игры", newRecord: "🏆 Новый рекорд!",
      points: "очков",
      great: "Отличная защита! 🛡️",
      ok: "Неплохо, но угрозы проскользнули",
      bad: "Аккаунт скомпрометирован 🚨",
      accuracy: "Точность", correct: "Верно", maxCombo: "Макс. комбо", record: "Рекорд",
      replay: "Играть снова", back: "Все тренажёры",
    },
    back: "← Все тренажёры",
  },

  profile: {
    eyebrow: "Личный профиль", title: "Профиль",
    name: "Имя", color: "Цвет аватара",
    save: "Сохранить", saved: "Сохранено!",
    progress: "Прогресс", tests: "Тестов", avgScore: "Средний балл",
    noProfile: "Создай профиль, чтобы персонализировать опыт обучения.",
  },

  notFound: {
    code: "404", icon: "🔍",
    title: "Страница не найдена",
    desc: "Такой страницы не существует. Возможно, ссылка устарела или была удалена.",
    home: "На главную", lessons: "К урокам",
  },

  footer: {
    copy: "© 2025 CyberAware Project by Nurgalym Jambul",
    follow: "Следите за нами:",
    tagline: "Разрабатываем для безопасного и умного цифрового мира!",
  },

  common: {
    backToLessons: "← К урокам", backToAll: "← Все тренажёры",
    loading: "Загрузка...", error: "Ошибка",
  },
};

// ─────────────────────────────────────────────
export const en = {
  nav: {
    lessons: "Lessons", tests: "Tests", trainers: "Trainers",
    analytics: "Analytics", profile: "Profile",
    progress: "{done}/10 ✓",
    mobileProfile: "Profile — {name}", mobileCourse: "Course progress",
    mobileTests: "{done}/10 tests",
  },
  theme: { toDark: "Dark theme", toLight: "Light theme" },

  home: {
    chip: "Cyber Literacy Course · 2025",
    title: "Cyber<gradient>Aware</gradient>",
    subtitle: "Learn to recognize digital threats through concise lessons, quizzes with explanations, and interactive trainers.",
    cta1: "Start Learning →", cta2: "Open Trainers",
    stats: { topics: "course topics", questions: "questions", trainers: "trainers" },
    progress: {
      hi: "Hi, {name}! 👋", welcome: "Welcome back!",
      done: "Completed {done} of 10 tests · Average score {avg}%",
      complete: "Course complete! Your certificate is ready.",
      continue: "Continue →", certificate: "Get Certificate →",
    },
    features: {
      eyebrow: "What's included", title: "Everything in one place",
      subtitle: "From theory to practice — four sections that together build a solid digital security skill.",
      lessons:   { label: "10 topics", title: "Lessons",   desc: "10 topics — from fundamentals to incident response. Concepts, real cases, and tips.",   link: "Go →" },
      tests:     { label: "50 questions", title: "Tests",   desc: "5 questions per topic. Detailed explanations for every answer after submission.",        link: "Go →" },
      analytics: { label: "Your progress", title: "Analytics", desc: "A full picture of your results: average score, progress, and weak spots.",           link: "Go →" },
      trainers:  { label: "6 modules", title: "Trainers",   desc: "Phishing SMS, password checker, fake news detector, and more interactive practice.",    link: "Go →" },
    },
    how: {
      eyebrow: "How it works", title: "Three steps to your certificate",
      steps: [
        { title: "Read a lesson",      desc: "Theory, real-world cases, and actionable tips for each topic." },
        { title: "Take the test",      desc: "5 questions with explanations after each lesson." },
        { title: "Get your certificate", desc: "Score ≥ 75% on all 10 tests and earn your official certificate." },
      ],
    },
    cookie: {
      text: "We use localStorage to save your progress and test results. No data is sent to a server.",
      accept: "Got it", decline: "Not now",
      toastAccept: "Done. Good habit — always read banners before clicking.",
      toastDecline: "OK, continuing without the noise.",
    },
  },

  lessons: {
    eyebrow: "Curriculum", title: "Cybersecurity Lessons",
    subtitle: "10 topics from fundamentals to advanced concepts. Every lesson includes theory, a real case, and a test.",
    progress: { label: "Course progress", read: "read", passed: "tests passed" },
    start: "Start lesson", reread: "Re-read", retry: "Repeat lesson",
    badgeRead: "📖 Read", badgePassed: "✓ Passed", badgeFailed: "✗ Failed",
    goTo: "→",
  },

  lessonPage: {
    lessonOf: "Lesson {idx} of {total}",
    read: "✓ Read",
    concepts: "Key Concepts",
    facts: "Key Facts",
    doTitle: "Do", dontTitle: "Avoid",
    caseTitle: "Real-World Case",
    caseLesson: "Takeaway:",
    tips: "Tips",
    takeTest: "Take the Test →",
    nextLesson: "Next Lesson →",
    backToLessons: "← All Lessons",
  },

  tests: {
    eyebrow: "Test your knowledge", title: "Cybersecurity Tests",
    subtitle: "5 questions per topic. Results are saved — come back and improve your score.",
    notStarted: "Not attempted yet", start: "Start Test →", retry: "Retry",
    scoreLabel: "Best result",
  },

  testPage: {
    eyebrow: "Test",
    answered: "{answered} / {total} answered",
    timerUrgent: "⏱ {time} — hurry!",
    timer: "⏱ {time}",
    submit: "Submit",
    timedOut: "⏰ Time's up!",
    result: {
      passed: "🎉 Great work! Test passed.",
      failed: "Try again — go back and review the lesson.",
      score: "Score: {score} / {total}",
      explanation: "Explanation:",
      retry: "Retry",
      backLessons: "← Back to Lessons",
      correct: "✓ Correct", wrong: "✗ Wrong",
    },
  },

  analytics: {
    eyebrow: "Your progress", title: "Learning Analytics",
    noData: "No results yet. Complete at least one test to see your stats.",
    stats: {
      done: "Tests completed", avg: "Average score", best: "Best result", worst: "Needs attention",
    },
    table: { test: "Test", score: "Score", date: "Date", status: "Status", passed: "Passed", failed: "Failed" },
    chart: "Progress across tests",
  },

  funzone: {
    eyebrow: "Interactive modules", title: "Trainers",
    subtitle: "Practice beats theory. Timers, combos, high scores — level up your skills right now.",
    hiScore: "Your Hacker Game record: {score} points",
    trainers: {
      hackerGame: { title: "Hacker Game", desc: "Timer, lives, combo multiplier. Spot phishing in realistic emails, SMS, browser tabs, and notifications — in 12 seconds.", time: "5–8 min", badge: "Gamified", score: "Record: {s} pts" },
      phishing:   { title: "Phishing Trainer", desc: "Find the dangerous elements in realistic SMS messages. Tap the suspicious parts.", time: "5–7 min", badge: "Interactive", score: "Rounds: {s}" },
      socialEng:  { title: "Social Engineering", desc: "6 real manipulation scenarios — threats, pressure, pretexting. Choose the right response.", time: "6 min", badge: "New", score: "Correct: {s}/6" },
      urlScanner: { title: "URL Inspector", desc: "Learn to spot typosquatting, spoofed domains, IDN homograph attacks, and hidden IPs in links.", time: "4 min", badge: "New" },
      fakeNews:   { title: "Fake News", desc: "Distinguish real news from fakes. Train your critical thinking with real examples.", time: "5 min" },
      password:   { title: "Password Checker", desc: "Instant strength analysis: entropy, patterns, crack time, and concrete tips.", time: "2 min" },
      dataSort:   { title: "Data Sorting", desc: "Classify data as sensitive or safe — understand what you can safely share publicly.", time: "3 min" },
    },
    start: "Start →",
  },

  hackerGame: {
    eyebrow: "Round {idx} / {total}", title: "Hacker Game",
    subtitle: "Is it phishing or legitimate?",
    hud: { lives: "Lives", points: "points", combo: "🔥 ×{m} combo" },
    block: "🚫 It's Phishing", safe: "✅ It's Safe",
    fb: {
      correct: "✅ Correct! +{pts} points",
      correctCombo: "✅ Correct! +{pts} points (×{m})",
      wrong: "❌ Wrong! −❤️",
      timeout: "⏰ Time's up! −❤️",
    },
    result: {
      eyebrow: "Game Over", newRecord: "🏆 New Record!",
      points: "points",
      great: "Excellent defense! 🛡️",
      ok: "Not bad, but some threats slipped through",
      bad: "Account compromised 🚨",
      accuracy: "Accuracy", correct: "Correct", maxCombo: "Max Combo", record: "Record",
      replay: "Play Again", back: "All Trainers",
    },
    back: "← All Trainers",
  },

  profile: {
    eyebrow: "Personal Profile", title: "Profile",
    name: "Name", color: "Avatar color",
    save: "Save", saved: "Saved!",
    progress: "Progress", tests: "Tests", avgScore: "Avg. score",
    noProfile: "Create a profile to personalize your learning experience.",
  },

  notFound: {
    code: "404", icon: "🔍",
    title: "Page Not Found",
    desc: "This page doesn't exist. The link may be outdated or removed.",
    home: "Go Home", lessons: "Lessons",
  },

  footer: {
    copy: "© 2025 CyberAware Project by Nurgalym Jambul",
    follow: "Follow us:",
    tagline: "Building a safer, smarter digital world!",
  },

  common: {
    backToLessons: "← Back to Lessons", backToAll: "← All Trainers",
    loading: "Loading...", error: "Error",
  },
};
