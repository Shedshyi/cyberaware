// Инструмент оценки киберграмотности для входного (pre) и итогового (post) тестирования.
// 20 вопросов, по 2 на каждую тему курса. Вопросы НЕ пересекаются с практическими тестами,
// чтобы прирост отражал усвоение навыка, а не запоминание конкретных вопросов.
// Один и тот же набор используется до и после обучения (одинаковый порядок).
//
// ВАЖНО: после начала эксперимента вопросы не менять — иначе pre и post станут несравнимы.
// id вопросов стабильны и попадают в таблицу answers (test_id = "assessment").

export const ASSESSMENT_TEST_ID = "assessment";

export const TOPICS = {
  basics:    { ru: "Основы",                 en: "Basics" },
  passwords: { ru: "Пароли",                 en: "Passwords" },
  phishing:  { ru: "Фишинг",                 en: "Phishing" },
  socials:   { ru: "Соцсети",                en: "Social media" },
  malware:   { ru: "Вредоносное ПО",         en: "Malware" },
  wifi:      { ru: "Сети и Wi-Fi",           en: "Networks & Wi-Fi" },
  updates:   { ru: "Обновления",             en: "Updates" },
  privacy:   { ru: "Приватность",            en: "Privacy" },
  recovery:  { ru: "Действия при инциденте", en: "Incident response" },
  summary:   { ru: "Комплексные ситуации",   en: "Mixed scenarios" },
};

const RU = [
  // basics
  { id: 101, topic: "basics", question: "В чате группы появилось сообщение: «Срочно! С понедельника занятия отменяются, приказ ректора». Ссылки на источник нет. Что разумнее всего сделать?",
    options: ["Переслать в другие чаты, чтобы все знали", "Проверить на официальном сайте вуза или у куратора", "Поверить, раз написали в общий чат", "Проигнорировать любые новости о занятиях"], correct: 1 },
  { id: 102, topic: "basics", question: "Что из перечисленного лучше всего описывает «цифровой след»?",
    options: ["Только история браузера на компьютере", "Все данные, которые человек оставляет в сети: публикации, лайки, покупки, геометки", "Вирус, который отслеживает действия", "Список паролей, сохранённых в браузере"], correct: 1 },
  // passwords
  { id: 103, topic: "passwords", question: "Какой из вариантов наиболее надёжен для аккаунта в онлайн-банке?",
    options: ["Almaty2004!", "Длинная фраза из 4–5 случайных слов, уникальная для этого сайта, плюс 2FA", "Тот же пароль, что и от почты, но с цифрой в конце", "Qwerty123456"], correct: 1 },
  { id: 104, topic: "passwords", question: "Сервис сообщил, что его база паролей утекла. Ты используешь этот же пароль ещё на трёх сайтах. Что делать в первую очередь?",
    options: ["Ничего, пароли в базе обычно зашифрованы", "Сменить пароль только на этом сервисе", "Сменить пароль на всех сайтах, где он использовался, и сделать их разными", "Удалить аккаунт на этом сервисе"], correct: 2 },
  // phishing
  { id: 105, topic: "phishing", question: "Пришло SMS: «Kaspi: на ваше имя оформлен кредит. Если это не вы, перейдите: kaspi-otmena.com». Как поступить?",
    options: ["Перейти по ссылке и отменить кредит", "Ответить на SMS «это не я»", "Не переходить, открыть официальное приложение банка или позвонить по номеру с карты", "Переслать SMS друзьям, чтобы предупредить"], correct: 2 },
  { id: 106, topic: "phishing", question: "Какой адрес, скорее всего, принадлежит настоящему сайту egov.kz?",
    options: ["https://egov.kz.login-portal.com", "https://egov-kz.net", "https://egov.kz/cms/ru", "http://egov.kz-services.ru"], correct: 2 },
  // socials
  { id: 107, topic: "socials", question: "Друг пишет в Instagram: «Проголосуй за меня в конкурсе, нужно войти через WhatsApp и ввести код из SMS». Что это, скорее всего?",
    options: ["Обычный конкурс", "Попытка угнать твой аккаунт WhatsApp — аккаунт друга, вероятно, уже взломан", "Новая функция Instagram", "Безопасно, раз пишет знакомый"], correct: 1 },
  { id: 108, topic: "socials", question: "Какая публикация несёт наибольший риск?",
    options: ["Фото заката без подписи", "Фото нового паспорта или ID-карты «наконец получил!»", "Репост новости от официального СМИ", "Фото еды в кафе спустя неделю после визита"], correct: 1 },
  // malware
  { id: 109, topic: "malware", question: "На сайте с фильмами всплывает окно: «Ваш телефон заражён! Установите очиститель». Что делать?",
    options: ["Установить приложение, чтобы удалить вирус", "Закрыть вкладку и ничего не устанавливать", "Позвонить по номеру из окна", "Перезагрузить телефон и установить приложение"], correct: 1 },
  { id: 110, topic: "malware", question: "Что из этого — наиболее типичный путь заражения Android-смартфона?",
    options: ["Установка APK-файла из Telegram-канала или с сайта", "Зарядка от собственной розетки", "Просмотр видео в официальном YouTube", "Обновление системы через настройки"], correct: 0 },
  // wifi
  { id: 111, topic: "wifi", question: "В аэропорту доступны сети «Airport_Free» и «Airport Free WiFi». Какая из них безопасна для входа в банк?",
    options: ["Та, у которой сигнал сильнее", "Любая, если есть HTTPS", "Ни одна не гарантирует безопасность — для банка лучше мобильный интернет", "Та, у которой нет пароля"], correct: 2 },
  { id: 112, topic: "wifi", question: "Зачем менять стандартный пароль администратора на домашнем роутере?",
    options: ["Чтобы ускорить интернет", "Стандартные пароли известны и позволяют чужому человеку управлять сетью", "Это требуется провайдером раз в месяц", "Чтобы не нужно было обновлять прошивку"], correct: 1 },
  // updates
  { id: 113, topic: "updates", question: "Телефон предлагает установить обновление безопасности. Как правильно?",
    options: ["Отложить на несколько месяцев — обновления часто ломают телефон", "Установить в ближайшее время: они закрывают известные уязвимости", "Никогда не обновлять, чтобы не потерять данные", "Устанавливать только обновления с новыми функциями"], correct: 1 },
  { id: 114, topic: "updates", question: "Почему опасно пользоваться программой, поддержка которой прекращена (например, старая версия Windows)?",
    options: ["Она медленнее работает", "Новые уязвимости в ней больше не исправляются", "Она перестаёт открывать файлы", "Это незаконно"], correct: 1 },
  // privacy
  { id: 115, topic: "privacy", question: "Приложение «Фонарик» при установке просит доступ к контактам, SMS и геолокации. Что это означает?",
    options: ["Так работают все фонарики", "Приложение запрашивает лишние разрешения — повод отказаться от установки", "Это нужно для яркости", "Ничего страшного, если приложение бесплатное"], correct: 1 },
  { id: 116, topic: "privacy", question: "Какой способ лучше всего снижает отслеживание тебя рекламными сетями в браузере?",
    options: ["Режим инкогнито", "Блокировщик трекеров и отказ от необязательных cookie", "Очистка истории раз в год", "Использование только мобильного интернета"], correct: 1 },
  // recovery
  { id: 117, topic: "recovery", question: "Ты заметил, что с твоей почты ушли письма, которые ты не отправлял. Что сделать первым?",
    options: ["Удалить отправленные письма", "Сменить пароль, завершить все сеансы и включить 2FA", "Создать новую почту и забыть про старую", "Подождать — может, это сбой"], correct: 1 },
  { id: 118, topic: "recovery", question: "Зачем нужны резервные копии важных файлов по правилу «3-2-1»?",
    options: ["Чтобы файлы быстрее открывались", "Чтобы восстановить данные после поломки, кражи или шифровальщика", "Это нужно только компаниям", "Чтобы освободить место на диске"], correct: 1 },
  // summary
  { id: 119, topic: "summary", question: "Звонит «сотрудник банка», знает твоё ФИО и номер карты, просит назвать код из SMS «для отмены подозрительной операции». Что делать?",
    options: ["Назвать код — он же знает твои данные", "Положить трубку и самому позвонить в банк по номеру с карты", "Назвать только половину кода", "Попросить перезвонить позже"], correct: 1 },
  { id: 120, topic: "summary", question: "Какая комбинация мер даёт наилучшую защиту личных аккаунтов?",
    options: ["Антивирус и сложный пароль, одинаковый везде", "Уникальные пароли (менеджер паролей) + 2FA + своевременные обновления", "Режим инкогнито и VPN", "Частая смена одного и того же пароля"], correct: 1 },
];

const EN = [
  { id: 101, topic: "basics", question: "A message appears in your class group chat: \"Urgent! Classes are cancelled from Monday, rector's order.\" No source link. What is the most sensible thing to do?",
    options: ["Forward it to other chats so everyone knows", "Check the university's official website or ask your advisor", "Believe it since it was posted in the group chat", "Ignore any news about classes"], correct: 1 },
  { id: 102, topic: "basics", question: "Which best describes a \"digital footprint\"?",
    options: ["Only the browser history on your computer", "All the data a person leaves online: posts, likes, purchases, geotags", "A virus that tracks your actions", "A list of passwords saved in the browser"], correct: 1 },
  { id: 103, topic: "passwords", question: "Which option is the most secure for an online banking account?",
    options: ["Almaty2004!", "A long phrase of 4–5 random words, unique to this site, plus 2FA", "The same password as your email, with a digit at the end", "Qwerty123456"], correct: 1 },
  { id: 104, topic: "passwords", question: "A service reports that its password database leaked. You use the same password on three other sites. What should you do first?",
    options: ["Nothing, passwords in databases are usually encrypted", "Change the password only on this service", "Change the password on every site where it was used and make them all different", "Delete your account on this service"], correct: 2 },
  { id: 105, topic: "phishing", question: "You get an SMS: \"Kaspi: a loan was issued in your name. If it wasn't you, go to: kaspi-otmena.com\". What do you do?",
    options: ["Follow the link and cancel the loan", "Reply to the SMS saying \"it wasn't me\"", "Don't click; open the official bank app or call the number on your card", "Forward the SMS to friends as a warning"], correct: 2 },
  { id: 106, topic: "phishing", question: "Which address most likely belongs to the real egov.kz website?",
    options: ["https://egov.kz.login-portal.com", "https://egov-kz.net", "https://egov.kz/cms/ru", "http://egov.kz-services.ru"], correct: 2 },
  { id: 107, topic: "socials", question: "A friend writes on Instagram: \"Vote for me in a contest, you need to log in via WhatsApp and enter the SMS code.\" What is this most likely?",
    options: ["A regular contest", "An attempt to hijack your WhatsApp account — your friend's account is probably already hacked", "A new Instagram feature", "Safe, since it's someone you know"], correct: 1 },
  { id: 108, topic: "socials", question: "Which post carries the greatest risk?",
    options: ["A sunset photo without a caption", "A photo of your new passport or ID card: \"finally got it!\"", "A repost of news from an official outlet", "A photo of food at a café a week after the visit"], correct: 1 },
  { id: 109, topic: "malware", question: "A pop-up on a movie website says: \"Your phone is infected! Install this cleaner.\" What should you do?",
    options: ["Install the app to remove the virus", "Close the tab and install nothing", "Call the number shown in the pop-up", "Restart the phone and install the app"], correct: 1 },
  { id: 110, topic: "malware", question: "Which of these is the most typical way an Android phone gets infected?",
    options: ["Installing an APK file from a Telegram channel or a website", "Charging from your own wall outlet", "Watching videos in the official YouTube app", "Updating the system via Settings"], correct: 0 },
  { id: 111, topic: "wifi", question: "At the airport you see networks \"Airport_Free\" and \"Airport Free WiFi\". Which is safe for logging into your bank?",
    options: ["The one with the stronger signal", "Either one, as long as there is HTTPS", "Neither guarantees safety — mobile data is better for banking", "The one without a password"], correct: 2 },
  { id: 112, topic: "wifi", question: "Why change the default admin password on your home router?",
    options: ["To make the internet faster", "Default passwords are publicly known and let a stranger control your network", "The ISP requires it monthly", "So you don't have to update the firmware"], correct: 1 },
  { id: 113, topic: "updates", question: "Your phone offers a security update. What is the right approach?",
    options: ["Postpone for several months — updates often break phones", "Install it soon: updates fix known vulnerabilities", "Never update, to avoid losing data", "Only install updates that add new features"], correct: 1 },
  { id: 114, topic: "updates", question: "Why is it dangerous to use software that is no longer supported (e.g., an old Windows version)?",
    options: ["It runs slower", "New vulnerabilities in it are no longer fixed", "It stops opening files", "It is illegal"], correct: 1 },
  { id: 115, topic: "privacy", question: "A \"Flashlight\" app asks for access to contacts, SMS and location during installation. What does this mean?",
    options: ["All flashlight apps work this way", "The app requests unnecessary permissions — a reason not to install it", "It is needed for brightness", "Nothing to worry about if the app is free"], correct: 1 },
  { id: 116, topic: "privacy", question: "What best reduces tracking by ad networks in your browser?",
    options: ["Incognito mode", "A tracker blocker and declining non-essential cookies", "Clearing history once a year", "Using only mobile data"], correct: 1 },
  { id: 117, topic: "recovery", question: "You notice emails sent from your account that you didn't send. What do you do first?",
    options: ["Delete the sent emails", "Change the password, sign out all sessions and enable 2FA", "Create a new email and forget the old one", "Wait — maybe it's a glitch"], correct: 1 },
  { id: 118, topic: "recovery", question: "Why keep backups of important files using the \"3-2-1\" rule?",
    options: ["To make files open faster", "To restore data after hardware failure, theft or ransomware", "Only companies need this", "To free up disk space"], correct: 1 },
  { id: 119, topic: "summary", question: "A \"bank employee\" calls, knows your full name and card number, and asks for the SMS code \"to cancel a suspicious transaction\". What do you do?",
    options: ["Tell them the code — they already know your data", "Hang up and call the bank yourself using the number on your card", "Tell them only half of the code", "Ask them to call back later"], correct: 1 },
  { id: 120, topic: "summary", question: "Which combination of measures best protects personal accounts?",
    options: ["Antivirus and a strong password reused everywhere", "Unique passwords (password manager) + 2FA + timely updates", "Incognito mode and a VPN", "Frequently changing the same password"], correct: 1 },
];

export const ASSESSMENT = { ru: RU, en: EN };

// ── Детерминированное перемешивание вариантов ────────────────
// В исходных данных правильный ответ часто стоит на позиции B. Чтобы это не было
// подсказкой, варианты показываются в перемешанном порядке. Порядок зависит только
// от id вопроса, поэтому одинаков для всех участников и в pre, и в post.
function seededOrder(seed, n) {
  // mulberry32 — простой ГПСЧ с хорошим перемешиванием соседних seed
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Вопросы для показа: options уже перемешаны, order[i] — исходный индекс i-го показанного варианта. */
export function getAssessment(lang) {
  return (ASSESSMENT[lang] || ASSESSMENT.ru).map(q => {
    const order = seededOrder(q.id, q.options.length);
    return { ...q, order, shownOptions: order.map(i => q.options[i]) };
  });
}
