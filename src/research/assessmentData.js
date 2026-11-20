// Инструмент оценки киберграмотности для входного (pre) и итогового (post) тестирования.
// Версия 2 (20.11.2026): 20 вопросов-ситуаций, по 2 на тему курса, id 201–220.
// Версия 1 (id 101–120) заменена до начала набора: в пилоте человек без обучения набирал 85–100%,
// а правильный ответ был самым длинным в 18 из 20 вопросов (эффект потолка и подсказка длиной).
//
// Требования к вопросам (проверяет src/data/items.lint.test.js):
//   • варианты одинаковой длины и правдоподобны, правильный не выделяется длиной;
//   • правильные ответы распределены по позициям поровну;
//   • вопросы НЕ пересекаются с практическими тестами, чтобы прирост отражал навык,
//     а не запоминание конкретных вопросов.
// Один и тот же набор используется до и после обучения; порядок вариантов перемешан
// детерминированно по id вопроса (одинаков для всех и в pre, и в post).
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
  { id: 201, topic: "basics", question: "Знакомый прислал видео, где известный политик призывает вкладываться в «государственную криптоплатформу». Лицо и голос очень похожи. Что разумнее всего?",
    options: ["Проверить, сообщали ли об этом официальные источники и СМИ", "Вложить небольшую сумму, чтобы проверить, платят ли там", "Поверить: так точно подделать лицо и голос невозможно", "Переслать знакомым, чтобы они тоже успели вложиться"], correct: 0 },
  { id: 202, topic: "basics", question: "Две статьи по-разному описывают одно и то же событие. Что лучше всего помогает понять, какой из них верить?",
    options: ["Выбрать ту, у которой больше просмотров и комментариев", "Выбрать ту, что совпадает с мнением моих друзей", "Выбрать ту, у которой более эмоциональный заголовок", "Сравнить, на какие первоисточники и факты они ссылаются"], correct: 3 },
  // passwords
  { id: 203, topic: "passwords", question: "Сайт требует пароль «минимум 8 символов, буква и цифра». Какой вариант подходит лучше всего?",
    options: ["Имя и год рождения — такой пароль точно не забудешь", "Фраза из случайных слов, не используемая больше нигде", "Пароль от Instagram с добавленной в конце цифрой 1", "Password1: он подходит под все требования сайта"], correct: 1 },
  { id: 204, topic: "passwords", question: "Тебе пришёл код для входа в Telegram, хотя ты ничего не запрашивал. Что это значит и что делать?",
    options: ["Это сбой Telegram, код можно спокойно проигнорировать", "Переслать код в поддержку Telegram, чтобы сообщить о сбое", "Кто-то входит в аккаунт: код никому, включить облачный пароль", "Выйти из Telegram и войти заново, используя этот код"], correct: 2 },
  // phishing
  { id: 205, topic: "phishing", question: "В письме «службы доставки» ссылка выглядит как https://kazpost.kz/track, но при наведении внизу браузера виден адрес kaz-post-track.top. Куда ты попадёшь, если нажмёшь?",
    options: ["На kazpost.kz, потому что так написано в тексте ссылки", "На kazpost.kz, но через защищённый сервер доставки", "Никуда: почтовые сервисы сами блокируют такие ссылки", "На kaz-post-track.top: важен реальный адрес ссылки"], correct: 3 },
  { id: 206, topic: "phishing", question: "Коллега пишет в рабочем чате: «Глянь документ, нужна твоя подпись», ссылка ведёт на страницу входа Microsoft. Аккаунт коллеги настоящий. Что делать?",
    options: ["Спросить коллегу по другому каналу, отправлял ли он ссылку", "Войти: аккаунт коллеги настоящий, значит, ссылка безопасна", "Войти, но после этого сразу сменить пароль от аккаунта", "Проверить, что на странице есть логотип и замок HTTPS"], correct: 0 },
  // socials
  { id: 207, topic: "socials", question: "Ты каждый вечер публикуешь сторис из дома, а днём — из университета. Чем это может быть опасно?",
    options: ["Соцсеть может ограничить показ слишком частых сторис", "По сторис можно понять распорядок и когда дома никого нет", "Опасности нет: сторис сами исчезают через 24 часа", "Это опасно, только если в сторис виден номер квартиры"], correct: 1 },
  { id: 208, topic: "socials", question: "Незнакомый аккаунт пишет, что вы учитесь в одном вузе, а через пару дней просит проголосовать в конкурсе по ссылке, войдя через Instagram. Что это, скорее всего?",
    options: ["Обычный конкурс: вход через Instagram защищает от накруток", "Реклама вуза, которая так собирает голоса студентов", "Попытка угнать аккаунт через поддельную страницу входа", "Ничего опасного, если в профиле много фото и подписчиков"], correct: 2 },
  // malware
  { id: 209, topic: "malware", question: "Антивирус нашёл угрозу в программе, скачанной с торрента, а на форуме пишут: «Это ложное срабатывание, отключи антивирус». Как поступить?",
    options: ["Отключить антивирус ненадолго, установить и включить снова", "Запустить файл, если у раздачи много положительных отзывов", "Добавить файл в исключения антивируса, раз все так делают", "Не запускать файл и найти программу в официальном источнике"], correct: 3 },
  { id: 210, topic: "malware", question: "Какой признак сильнее всего указывает, что на телефоне может быть рекламное или шпионское ПО?",
    options: ["Появились незнакомые приложения и реклама поверх экрана", "Телефон нагревается во время долгой зарядки ночью", "Батарея садится быстрее, когда долго играешь в игры", "Приложения просят обновиться через Google Play"], correct: 0 },
  // wifi
  { id: 211, topic: "wifi", question: "В аэропорту две открытые сети: «Airport_Free_WiFi» и «Airport Free WiFi». Что разумнее?",
    options: ["Подключиться к той, у которой сильнее сигнал и выше скорость", "Подключиться к той, где в названии нет нижних подчёркиваний", "Узнать точное имя у аэропорта или взять мобильный интернет", "Подключиться к любой: в аэропорту сети проверяет охрана"], correct: 2 },
  { id: 212, topic: "wifi", question: "Ты вошёл в соцсеть с компьютера в библиотеке. Что важнее всего сделать, когда уходишь?",
    options: ["Закрыть вкладку — сессия завершится сама собой", "Выйти из аккаунта и не сохранять пароль в браузере", "Выключить монитор, чтобы никто не видел экран", "Очистить корзину на рабочем столе компьютера"], correct: 1 },
  // updates
  { id: 213, topic: "updates", question: "Приложение банка перестало открываться и просит обновиться, но обновление большое, а трафик ограничен. Что разумнее?",
    options: ["Скачать APK старой версии с форума, чтобы сэкономить трафик", "Отключить в настройках телефона проверку версий приложений", "Пользоваться банком по ссылке из SMS вместо приложения", "Обновить через официальный магазин, когда будет Wi-Fi"], correct: 3 },
  { id: 214, topic: "updates", question: "Компания выпустила срочный патч, потому что уязвимость «активно эксплуатируется». Что это значит?",
    options: ["Уязвимость нашли, но атак с её использованием пока нет", "Атакующие уже используют её против реальных людей", "Патч сначала проверяют пользователи, а потом выпускают", "Уязвимость опасна только для компаний, а не для людей"], correct: 1 },
  // privacy
  { id: 215, topic: "privacy", question: "Сервис просит фото удостоверения личности, чтобы «участвовать в розыгрыше». Почему это рискованно?",
    options: ["Фото документа могут использовать для кредитов и аккаунтов", "Розыгрыши с фото документов запрещены правилами соцсетей", "Это рискованно, только если на фото видно лицо владельца", "Риска нет: на фото документа нет секретных данных"], correct: 0 },
  { id: 216, topic: "privacy", question: "Ты хочешь, чтобы рекламные сети меньше следили за тобой в браузере. Что поможет лучше всего?",
    options: ["Режим инкогнито при каждом открытии браузера", "Каждый день вручную очищать историю просмотров", "Блокировщик трекеров и запрет сторонних cookie", "Заходить в интернет только с мобильного телефона"], correct: 2 },
  // recovery
  { id: 217, topic: "recovery", question: "На экране компьютера требование выкупа, файлы не открываются. Что сделать первым?",
    options: ["Сразу заплатить выкуп, пока сумма и сроки не изменились", "Несколько раз перезагрузить компьютер, пока окно не исчезнет", "Удалить все зашифрованные файлы, чтобы освободить место", "Отключить компьютер от сети, чтобы заражение не пошло дальше"], correct: 3 },
  { id: 218, topic: "recovery", question: "Ты потерял телефон, на котором вход в банк, почту и мессенджеры. Что сделать в первую очередь?",
    options: ["Заблокировать SIM и удалённо выйти или стереть данные", "Подождать пару дней — вдруг телефон найдётся сам", "Купить новый телефон и восстановить всё из облака", "Написать в соцсетях, что телефон потерян, и ждать"], correct: 0 },
  // summary
  { id: 219, topic: "summary", question: "Какое действие даёт обычному студенту больше всего защиты при наименьших усилиях?",
    options: ["Установить несколько разных антивирусов одновременно", "Каждую неделю менять пароли от всех своих аккаунтов", "Заклеить веб-камеру и отключить микрофон в ноутбуке", "Включить 2FA на почте, ведь через неё сбрасывают пароли"], correct: 3 },
  { id: 220, topic: "summary", question: "Друг говорит: «Мне нечего скрывать, поэтому кибербезопасность меня не касается». Какой ответ точнее?",
    options: ["Он прав: атакуют только известных людей и компании", "Он прав, если пользуется только iPhone, а не Android", "Мошенникам нужны его аккаунты и деньги, а не секреты", "Он прав, если не хранит фото в облачных сервисах"], correct: 2 },
];

const EN = [
  // basics
  { id: 201, topic: "basics", question: "A friend sent a video of a well-known politician urging people to invest in a 'state crypto platform'. The face and voice look very real. What is most sensible?",
    options: ["Check whether official sources and the media reported it", "Invest a small amount to see whether it actually pays out", "Believe it: a face and voice can't be faked this precisely", "Forward it to friends so they can invest in time too"], correct: 0 },
  { id: 202, topic: "basics", question: "Two articles describe the same event differently. What best helps you decide which one to trust?",
    options: ["Pick the one with more views and comments", "Pick the one that matches my friends' opinion", "Pick the one with the more emotional headline", "Compare which primary sources and facts they cite"], correct: 3 },
  // passwords
  { id: 203, topic: "passwords", question: "A site requires a password of 'at least 8 characters, a letter and a digit'. Which option fits best?",
    options: ["Your name and birth year — you'll never forget it", "A phrase of random words not used anywhere else", "Your Instagram password with a 1 added at the end", "Password1: it meets all of the site's requirements"], correct: 1 },
  { id: 204, topic: "passwords", question: "You received a Telegram login code although you didn't request one. What does it mean and what should you do?",
    options: ["It's just a Telegram glitch, so the code can be safely ignored", "Forward the code to Telegram support so they know about the glitch", "Someone is signing in: don't share it, set a cloud password", "Log out of Telegram and then log back in using this same code"], correct: 2 },
  // phishing
  { id: 205, topic: "phishing", question: "In a 'delivery service' email the link reads https://kazpost.kz/track, but hovering shows kaz-post-track.top at the bottom of the browser. Where will you go if you click?",
    options: ["To kazpost.kz, because that's what the link text says", "To kazpost.kz, but through a secure delivery server", "Nowhere: email services block such links automatically", "To kaz-post-track.top: the real link address is what counts"], correct: 3 },
  { id: 206, topic: "phishing", question: "A colleague writes in the work chat: 'Look at this document, I need your signature', and the link opens a Microsoft sign-in page. The colleague's account is real. What do you do?",
    options: ["Ask the colleague through another channel whether they sent it", "Sign in: the colleague's account is real, so the link is safe", "Sign in, then change your account password right away", "Check that the page has the logo and an HTTPS padlock"], correct: 0 },
  // socials
  { id: 207, topic: "socials", question: "Every evening you post stories from home, and during the day from university. How can this be dangerous?",
    options: ["The network may limit how often your stories are shown", "Stories reveal your routine and when no one is home", "No danger: stories disappear by themselves after 24 hours", "It's only dangerous if your flat number is visible"], correct: 1 },
  { id: 208, topic: "socials", question: "An unknown account says you study at the same university, and a couple of days later asks you to vote in a contest via a link, signing in with Instagram. What is this most likely?",
    options: ["A normal contest: Instagram sign-in prevents vote cheating", "A university ad that collects student votes this way", "An attempt to steal your account via a fake sign-in page", "Nothing dangerous if the profile has many photos and followers"], correct: 2 },
  // malware
  { id: 209, topic: "malware", question: "Antivirus flagged a program downloaded from a torrent, but a forum says: 'It's a false positive, turn off your antivirus'. What should you do?",
    options: ["Turn off antivirus briefly, install it, then turn it back on", "Run the file if the torrent has many positive comments", "Add the file to antivirus exclusions, since everyone does", "Don't run it, and get the program from an official source"], correct: 3 },
  { id: 210, topic: "malware", question: "Which sign most strongly suggests adware or spyware on your phone?",
    options: ["Unknown apps appeared and ads pop up over the screen", "The phone gets warm during a long overnight charge", "The battery drains faster during long gaming sessions", "Apps ask you to update them through Google Play"], correct: 0 },
  // wifi
  { id: 211, topic: "wifi", question: "At the airport there are two open networks: 'Airport_Free_WiFi' and 'Airport Free WiFi'. What is sensible?",
    options: ["Join the one with the stronger signal and higher speed", "Join the one without underscores in its name", "Ask the airport for the exact name or use mobile data", "Join either: airport security checks the networks"], correct: 2 },
  { id: 212, topic: "wifi", question: "You signed in to social media on a library computer. What matters most when you leave?",
    options: ["Close the tab — the session will end by itself", "Sign out and don't let the browser save the password", "Turn off the monitor so nobody can see the screen", "Empty the recycle bin on the computer's desktop"], correct: 1 },
  // updates
  { id: 213, topic: "updates", question: "Your banking app stopped opening and asks for an update, but the update is large and your data plan is limited. What is sensible?",
    options: ["Download an older APK from a forum to save data", "Turn off app version checks in your phone settings", "Use the bank through a link from an SMS instead", "Update via the official store once you're on Wi-Fi"], correct: 3 },
  { id: 214, topic: "updates", question: "A company released an urgent patch because a vulnerability is 'actively exploited'. What does that mean?",
    options: ["The flaw was found, but no attacks use it yet", "Attackers are already using it against real people", "Users test the patch first, and then it's released", "The flaw only threatens companies, not individuals"], correct: 1 },
  // privacy
  { id: 215, topic: "privacy", question: "A service asks for a photo of your ID card to 'enter a giveaway'. Why is this risky?",
    options: ["An ID photo can be used to open loans and accounts", "Giveaways with ID photos are against social media rules", "It's risky only if the owner's face is visible", "No risk: an ID photo has no secret information"], correct: 0 },
  { id: 216, topic: "privacy", question: "You want ad networks to track you less in your browser. What helps most?",
    options: ["Incognito mode every time you open the browser", "Clearing your browsing history by hand every day", "A tracker blocker and blocking third-party cookies", "Going online only from your mobile phone"], correct: 2 },
  // recovery
  { id: 217, topic: "recovery", question: "Your computer screen shows a ransom demand and files won't open. What do you do first?",
    options: ["Pay the ransom right away before the amount goes up", "Restart the computer several times until the window goes", "Delete all encrypted files to free up disk space", "Disconnect the computer from the network to stop the spread"], correct: 3 },
  { id: 218, topic: "recovery", question: "You lost a phone that is signed in to your bank, email and messengers. What do you do first?",
    options: ["Block the SIM and remotely sign out or wipe the phone", "Wait a couple of days — maybe the phone will turn up", "Buy a new phone and restore everything from the cloud", "Post on social media that it's lost, and wait"], correct: 0 },
  // summary
  { id: 219, topic: "summary", question: "Which action gives an ordinary student the most protection for the least effort?",
    options: ["Install several different antivirus programs at the same time", "Change the passwords of all your accounts every week", "Cover the webcam and disable the laptop microphone", "Turn on 2FA for email: other passwords are reset through it"], correct: 3 },
  { id: 220, topic: "summary", question: "A friend says: 'I have nothing to hide, so cybersecurity isn't my concern.' Which reply is most accurate?",
    options: ["He's right: only famous people and companies get attacked", "He's right if he uses only an iPhone, not Android", "Scammers want his accounts and money, not his secrets", "He's right if he doesn't keep photos in cloud services"], correct: 2 },
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
