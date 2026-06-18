import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

// ── Threat data (RU) ─────────────────────────────────────────────────────────
const THREATS_RU = [
  {
    id: 1, type: "email", diff: "easy", isPhishing: true,
    from: "support@netflix-billing-update.ru", fromName: "Netflix Support",
    subject: "⚠️ Ваш аккаунт Netflix заблокирован",
    body: "Уважаемый клиент! Ваш аккаунт временно приостановлен из-за проблем с оплатой.\nПожалуйста, перейдите по ссылке и подтвердите данные карты:\n\nhttps://netflix-billing-update.ru/verify\n\nЕсли не предпринять действий в течение 24 часов, аккаунт будет удалён.",
    explanation: "Домен 'netflix-billing-update.ru' — не Netflix.com. Срочность и угроза удаления — давление. Netflix никогда не просит данные карты по email-ссылке.",
  },
  {
    id: 2, type: "email", diff: "easy", isPhishing: false,
    from: "no-reply@accounts.google.com", fromName: "Google",
    subject: "Подтверждение входа в аккаунт Google",
    body: "Ваш аккаунт Google использован для входа на устройстве:\nWindows 10 · Chrome · Алматы, Казахстан\nВремя: сегодня в 14:23\n\nЕсли это были вы — ничего делать не нужно.\nЕсли нет — немедленно смените пароль через accounts.google.com",
    explanation: "Письмо от accounts.google.com (официальный домен). Оно не требует перехода по ссылке и не создаёт срочности — только информирует. Это стандартное уведомление безопасности.",
  },
  {
    id: 3, type: "email", diff: "medium", isPhishing: true,
    from: "ceo@alpha-group.kz.staff-mail.com", fromName: "Директор Алибек Сейткали",
    subject: "Срочно: перевод для партнёра",
    body: "Привет! Я сейчас на встрече и не могу говорить по телефону.\nНам срочно нужно перевести 3 500 000 ₸ нашему партнёру до 18:00 сегодня.\nРеквизиты:\nKaspi: +7 (707) 900-11-22\n\nО деталях переговорим после. Действуй!\nАлибек",
    explanation: "Домен отправителя — 'staff-mail.com', а не корпоративный домен компании. BEC-атака: мошенники изучают LinkedIn, копируют имя директора. Любой денежный запрос по email проверяй звонком напрямую.",
  },
  {
    id: 4, type: "email", diff: "medium", isPhishing: false,
    from: "security@paypal.com", fromName: "PayPal Security",
    subject: "Ваш чек PayPal №PP-1248-7733",
    body: "Добрый день!\n\nВы завершили платёж на сумму 12 990 ₸ в пользу продавца 'TechShop KZ'.\n\nДата: 15 марта 2025, 10:41\nТранзакция: PP-1248-7733\n\nЕсли вы не совершали этот платёж — войдите в аккаунт через paypal.com (не через ссылку в этом письме) и оспорьте транзакцию.",
    explanation: "Письмо от paypal.com (официальный домен). Важно: оно советует НЕ переходить по ссылкам из письма, а заходить напрямую. Это признак легитимного письма.",
  },
  {
    id: 5, type: "email", diff: "hard", isPhishing: true,
    from: "noreply@kaspi-notifications.com", fromName: "Kaspi Bank",
    subject: "Подтверждение операции — ваш код",
    body: "Здравствуйте!\n\nВаша карта VISA *9942 использована для подтверждения операции.\nКод авторизации: уже отправлен на ваш номер.\n\nДля просмотра операции нажмите: https://kaspi.kz.operations-check.com/auth\n\nEсли операция не ваша — позвоните: 8 800 080 3000",
    explanation: "Домен отправителя 'kaspi-notifications.com' — не Kaspi.kz. Ссылка 'kaspi.kz.operations-check.com' — тайпосквоттинг: kaspi.kz стоит перед точкой как поддомен чужого домена.",
  },
  {
    id: 6, type: "sms", diff: "easy", isPhishing: true,
    fromName: "KASPI", phone: "KASPI",
    body: "KASPI: Вам зачислено 50,000 тенге за участие в акции! Перейдите для получения: https://kaspi-reward.info/get?id=7821",
    explanation: "Настоящий Kaspi не раздаёт деньги через SMS-ссылки. Домен 'kaspi-reward.info' — фейк. Ссылки в SMS от банков никогда не ведут на сторонние сайты.",
  },
  {
    id: 7, type: "sms", diff: "easy", isPhishing: false,
    fromName: "Beeline", phone: "Beeline",
    body: "Beeline: Ваш баланс пополнен на 3000 ₸. Новый баланс: 5 843 ₸. Дата: 15.03.2025 11:42. Спасибо за использование наших услуг.",
    explanation: "Стандартное уведомление о пополнении счёта. Не содержит ссылок, не просит данных, не создаёт срочности. Это нормальное SMS от оператора.",
  },
  {
    id: 8, type: "sms", diff: "medium", isPhishing: true,
    fromName: "+7 (700) 900-33-44", phone: "+7 (700) 900-33-44",
    body: "Ваша посылка СДЭК задержана на таможне. Оплатите сбор 590 ₸ для доставки: https://sdek-pay.ru/customs/order/88213",
    explanation: "СДЭК не присылает SMS с обычных номеров — используются буквенные имена. Домен 'sdek-pay.ru' — не cdek.ru. Таможенные сборы не оплачиваются через SMS-ссылки.",
  },
  {
    id: 9, type: "sms", diff: "medium", isPhishing: false,
    fromName: "Halyk", phone: "Halyk",
    body: "Halyk: Покупка 4 990 ₸ в SULPAK, карта *3301, 15.03.25 14:33. Баланс: 82 441 ₸. Не вы? 595.",
    explanation: "Стандартный формат SMS от Halyk Bank: конкретная сумма, магазин, 4 цифры карты, дата, время, баланс. Не содержит ссылок. Номер 595 — официальный контакт банка.",
  },
  {
    id: 10, type: "sms", diff: "hard", isPhishing: true,
    fromName: "Kolesa.kz", phone: "Kolesa.kz",
    body: "Kolesa.kz: Ваше объявление удалено за нарушение правил. Для восстановления подтвердите аккаунт: http://kolesa-kz.account-restore.com/verify Поддержка: support@kolesa-kz-help.com",
    explanation: "Имя отправителя легко подделать (SMS spoofing). Домен ссылки 'kolesa-kz.account-restore.com' — не Kolesa.kz. Email 'kolesa-kz-help.com' тоже поддельный. Оба домена с дефисом — признак фишинга.",
  },
  {
    id: 11, type: "browser", diff: "easy", isPhishing: true,
    url: "http://g00gle.com/accounts/login",
    pageTitle: "Войти — Аккаунт Google",
    body: "Введите адрес электронной почты\n[__________________]\n[  Далее  ]",
    explanation: "URL 'g00gle.com' — тайпосквоттинг: буква 'о' заменена на цифру '0'. Кроме того, HTTP без S — незашифрованное соединение. Настоящий Google всегда на accounts.google.com с HTTPS.",
  },
  {
    id: 12, type: "browser", diff: "medium", isPhishing: true,
    url: "https://kaspi.kz.secure-payment.net/auth/login",
    pageTitle: "Kaspi.kz — Вход в аккаунт",
    body: "Введите номер телефона и пароль для входа\n[__________________]\n[__________________]\n[  Войти  ]",
    explanation: "Хитрый URL: 'kaspi.kz' стоит ПЕРЕД первой точкой — это поддомен чужого домена 'secure-payment.net'. Реальный домен = secure-payment.net. Даже HTTPS не делает сайт легитимным.",
  },
  {
    id: 13, type: "browser", diff: "hard", isPhishing: true,
    url: "https://аpple.com/ru/store",
    pageTitle: "Apple Store — официальный магазин",
    body: "MacBook Pro M3 Max\nОт 799 990 ₸\n[Купить]\n\nАкция до конца недели!",
    explanation: "Кириллическая 'а' в начале URL (IDN-атака). В браузере выглядит как 'apple.com', но на самом деле другой домен. Проверяй URL не только визуально.",
  },
  {
    id: 14, type: "browser", diff: "medium", isPhishing: false,
    url: "https://www.gosuslugi.ru/10168/1",
    pageTitle: "Проверка штрафов ГИБДД — Госуслуги",
    body: "Проверьте наличие штрафов по номеру автомобиля или водительскому удостоверению.\n[Номер ТС ___] [Проверить]\n\nОфициальный портал gosuslugi.ru",
    explanation: "Домен gosuslugi.ru — официальный государственный портал. HTTPS присутствует. Страница запрашивает только публичные данные (номер ТС), не пароли. Это легитимный сервис.",
  },
  {
    id: 15, type: "notif", diff: "easy", isPhishing: false,
    app: "GitHub", icon: "🐙",
    title: "Pull request одобрен",
    body: "aibek_dev одобрил ваш PR #234 'Fix: authentication middleware'. Проверьте изменения.",
    explanation: "Стандартное GitHub-уведомление о действии коллеги. Не содержит внешних ссылок, не запрашивает данных. Такие уведомления — часть нормального рабочего процесса.",
  },
  {
    id: 16, type: "notif", diff: "easy", isPhishing: true,
    app: "Kaspi.kz", icon: "🔴",
    title: "⚠️ Требуется действие",
    body: "Ваша карта заблокирована из-за подозрительной активности. Нажмите здесь для немедленного восстановления доступа.",
    explanation: "Настоящее приложение Kaspi показывает уведомления о конкретных операциях с суммами. Расплывчатое «требуется действие» + кнопка внутри уведомления — признаки push-фишинга.",
  },
  {
    id: 17, type: "notif", diff: "medium", isPhishing: true,
    app: "Chrome", icon: "🌐",
    title: "Обновление Chrome требуется!",
    body: "Ваш браузер устарел и уязвим. Обновите сейчас, чтобы продолжить безопасную работу. [Обновить Chrome]",
    explanation: "Chrome обновляется через встроенный механизм (Справка → О Chrome), а не через push-уведомления. Нажатие может загрузить малварь под видом «установщика».",
  },
  {
    id: 18, type: "notif", diff: "hard", isPhishing: true,
    app: "Apple ID", icon: "🍎",
    title: "Новое устройство подключено",
    body: "iPhone 15 Pro в Шанхае, Китай только что вошёл в ваш Apple ID. Не вы? Заблокируйте через appleid-secure.com",
    explanation: "Уведомление создаёт панику ('Китай!'), но ссылка ведёт на 'appleid-secure.com' — не на apple.com. Настоящие уведомления Apple ссылаются только на appleid.apple.com.",
  },
];

// ── Threat data (EN) ─────────────────────────────────────────────────────────
const THREATS_EN = [
  {
    id: 1, type: "email", diff: "easy", isPhishing: true,
    from: "support@netflix-billing-update.com", fromName: "Netflix Support",
    subject: "⚠️ Your Netflix account has been suspended",
    body: "Dear Customer, your account has been temporarily suspended due to a payment issue.\nPlease click the link below to verify your card details:\n\nhttps://netflix-billing-update.com/verify\n\nIf no action is taken within 24 hours, your account will be permanently deleted.",
    explanation: "'netflix-billing-update.com' is not netflix.com. The urgency and deletion threat are pressure tactics. Netflix never asks for card details via an email link.",
  },
  {
    id: 2, type: "email", diff: "easy", isPhishing: false,
    from: "no-reply@accounts.google.com", fromName: "Google",
    subject: "New sign-in to your Google Account",
    body: "Your Google Account was just used to sign in on a new device:\nWindows 10 · Chrome · New York, USA\nTime: today at 2:23 PM\n\nIf this was you, no action is needed.\nIf not — change your password immediately at accounts.google.com",
    explanation: "The email is from accounts.google.com (official domain). It doesn't ask you to click any link and doesn't create urgency — it just informs. This is a standard security notification.",
  },
  {
    id: 3, type: "email", diff: "medium", isPhishing: true,
    from: "ceo@acmecorp.com.staff-portal.net", fromName: "CEO James Wilson",
    subject: "Urgent: wire transfer needed",
    body: "Hi, I'm in a meeting and can't talk right now.\nWe urgently need to wire $47,000 to our partner by 5 PM today.\nDetails:\nAccount: 4532-7821-0011\n\nI'll explain everything later. Please act now!\nJames",
    explanation: "The sender domain is 'staff-portal.net', not the company's real domain. This is a Business Email Compromise (BEC) attack — scammers study LinkedIn and impersonate executives. Always verify wire transfers by phone.",
  },
  {
    id: 4, type: "email", diff: "medium", isPhishing: false,
    from: "security@paypal.com", fromName: "PayPal Security",
    subject: "Your PayPal receipt #PP-1248-7733",
    body: "Hello,\n\nYou sent a payment of $89.99 to TechShop.\n\nDate: March 15, 2025 at 10:41 AM\nTransaction ID: PP-1248-7733\n\nIf you didn't make this payment — log in to paypal.com directly (not from a link in this email) and dispute the transaction.",
    explanation: "The email is from paypal.com (official domain). It explicitly tells you NOT to click links and to go directly to the site — a sign of a legitimate, security-conscious message.",
  },
  {
    id: 5, type: "email", diff: "hard", isPhishing: true,
    from: "noreply@chase-notifications.com", fromName: "Chase Bank",
    subject: "Transaction confirmation — your code",
    body: "Hello,\n\nYour Visa card ending in 9942 was used to authorize a transaction.\nYour code has been sent to your registered number.\n\nTo review the transaction click: https://chase.com.operations-verify.net/auth\n\nIf this wasn't you — call: 1-800-935-9935",
    explanation: "'chase-notifications.com' is not chase.com. The link 'chase.com.operations-verify.net' is typosquatting — 'chase.com' appears before the first dot as a subdomain of a fake domain. The phone number may also be spoofed.",
  },
  {
    id: 6, type: "sms", diff: "easy", isPhishing: true,
    fromName: "CHASE", phone: "CHASE",
    body: "CHASE: You've been credited $500 for joining our loyalty program! Claim your reward: https://chase-rewards.info/get?id=4421",
    explanation: "Legitimate banks don't give away money via SMS links. 'chase-rewards.info' is a fake domain. Bank SMS messages never link to third-party sites.",
  },
  {
    id: 7, type: "sms", diff: "easy", isPhishing: false,
    fromName: "T-Mobile", phone: "T-Mobile",
    body: "T-Mobile: Your account was topped up with $30.00. New balance: $58.43. Date: 03/15/2025 11:42 AM. Thank you for using our services.",
    explanation: "Standard balance top-up notification. No links, no data requests, no urgency. The text matches the official T-Mobile notification format.",
  },
  {
    id: 8, type: "sms", diff: "medium", isPhishing: true,
    fromName: "+1 (646) 900-3344", phone: "+1 (646) 900-3344",
    body: "Your UPS package is held at customs. Pay a $4.99 fee to release it: https://ups-customs-pay.net/order/88213",
    explanation: "UPS doesn't send SMS from regular phone numbers — they use branded sender names. 'ups-customs-pay.net' is not ups.com. Customs fees are never paid through SMS links.",
  },
  {
    id: 9, type: "sms", diff: "medium", isPhishing: false,
    fromName: "BankOfAmerica", phone: "BankOfAmerica",
    body: "BofA: Purchase $49.90 at BestBuy, card ending 3301, 03/15/25 2:33 PM. Balance: $824.41. Not you? Call 800-432-1000.",
    explanation: "Standard Bank of America transaction alert: specific amount, merchant, last 4 digits of card, date, time, and balance. No links. The phone number is the official BofA number.",
  },
  {
    id: 10, type: "sms", diff: "hard", isPhishing: true,
    fromName: "eBay", phone: "eBay",
    body: "eBay: Your listing was removed for policy violation. To restore it, verify your account: http://ebay-us.account-restore.com/verify Support: support@ebay-helpdesk.com",
    explanation: "Sender names are easy to spoof (SMS spoofing). 'ebay-us.account-restore.com' is not ebay.com. 'ebay-helpdesk.com' is also fake. Both hyphenated domains are phishing red flags.",
  },
  {
    id: 11, type: "browser", diff: "easy", isPhishing: true,
    url: "http://g00gle.com/accounts/login",
    pageTitle: "Sign in — Google Account",
    body: "Enter your email address\n[__________________]\n[  Next  ]",
    explanation: "'g00gle.com' is typosquatting — the letter 'o' is replaced by the digit '0'. Also, HTTP without S means the connection is unencrypted. The real Google is always at accounts.google.com with HTTPS.",
  },
  {
    id: 12, type: "browser", diff: "medium", isPhishing: true,
    url: "https://paypal.com.secure-payment.net/auth/login",
    pageTitle: "PayPal — Log in to your account",
    body: "Enter your email and password\n[__________________]\n[__________________]\n[  Log In  ]",
    explanation: "Clever URL: 'paypal.com' appears BEFORE the first dot — it's actually a subdomain of 'secure-payment.net'. The real domain is secure-payment.net. Even HTTPS doesn't make a site legitimate.",
  },
  {
    id: 13, type: "browser", diff: "hard", isPhishing: true,
    url: "https://аpple.com/us/store",
    pageTitle: "Apple Store — Official Store",
    body: "MacBook Pro M3 Max\nFrom $3,499\n[Buy]\n\nLimited time offer!",
    explanation: "The 'а' at the start is a Cyrillic character (IDN homograph attack). It looks identical to 'apple.com' but it's a different domain. Your browser would show the punycode version: 'xn--pple-43d.com'.",
  },
  {
    id: 14, type: "browser", diff: "medium", isPhishing: false,
    url: "https://www.irs.gov/refunds",
    pageTitle: "Where's My Refund? — IRS",
    body: "Check your federal tax refund status.\n\n[Social Security Number ___]\n[Filing Status ___]\n[Refund Amount ___]\n[Submit]\n\nOfficial IRS website — irs.gov",
    explanation: "The domain irs.gov is an official US government website (.gov domains can only be registered by government entities). HTTPS is present. This is a legitimate service.",
  },
  {
    id: 15, type: "notif", diff: "easy", isPhishing: false,
    app: "GitHub", icon: "🐙",
    title: "Pull request approved",
    body: "john_dev approved your PR #234 'Fix: authentication middleware'. Review the changes.",
    explanation: "Standard GitHub notification about a colleague's action. No external links, no data requests. These notifications are a normal part of the development workflow.",
  },
  {
    id: 16, type: "notif", diff: "easy", isPhishing: true,
    app: "Chase Bank", icon: "🔴",
    title: "⚠️ Action required",
    body: "Your card has been blocked due to suspicious activity. Tap here to immediately restore access to your account.",
    explanation: "A real bank app shows specific transaction notifications with amounts and dates. A vague 'action required' with a tap-to-restore button inside the notification is a push-phishing red flag. Open the app directly.",
  },
  {
    id: 17, type: "notif", diff: "medium", isPhishing: true,
    app: "Chrome", icon: "🌐",
    title: "Chrome update required!",
    body: "Your browser is outdated and vulnerable. Update now to continue browsing safely. [Update Chrome]",
    explanation: "Chrome updates through its built-in mechanism (Help → About Chrome), not via push notifications. This is malicious ad-push from a compromised site. Tapping can download malware disguised as an installer.",
  },
  {
    id: 18, type: "notif", diff: "hard", isPhishing: true,
    app: "Apple ID", icon: "🍎",
    title: "New device signed in",
    body: "iPhone 15 Pro in Shanghai, China just signed in to your Apple ID. Not you? Block it at appleid-secure.com",
    explanation: "The notification creates panic ('China!'), but the link goes to 'appleid-secure.com' — not apple.com. Legitimate Apple notifications only link to appleid.apple.com. Go there directly.",
  },
];

// ── Timer hook ───────────────────────────────────────────────────────────────
function useTimer(seconds, running, onExpire) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onExpire);
  cb.current = onExpire;
  useEffect(() => { setLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (!running) return;
    if (left <= 0) { cb.current(); return; }
    const id = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, running]);
  return left;
}

// ── Media mockups ────────────────────────────────────────────────────────────
function EmailMockup({ t, lang }) {
  return (
    <div className="hg-mockup hg-email">
      <div className="hg-email-bar">
        <span className="hg-email-icon">✉</span>
        <span className="hg-email-client">{lang === "en" ? "Mail" : "Почта"}</span>
      </div>
      <div className="hg-email-meta">
        <div className="hg-email-avatar">{t.fromName[0]}</div>
        <div className="hg-email-info">
          <span className="hg-email-name">{t.fromName}</span>
          <span className="hg-email-addr">&lt;{t.from}&gt;</span>
        </div>
        <span className="hg-email-time">14:23</span>
      </div>
      <div className="hg-email-subject">{t.subject}</div>
      <div className="hg-email-body">{t.body}</div>
    </div>
  );
}

function SMSMockup({ t, lang }) {
  return (
    <div className="hg-mockup hg-sms">
      <div className="hg-sms-phone-bar">
        <span className="hg-sms-time">14:35</span>
        <span className="hg-sms-icons">▶ 📶 🔋</span>
      </div>
      <div className="hg-sms-header">
        <div className="hg-sms-avatar">{t.fromName[0]}</div>
        <div>
          <div className="hg-sms-name">{t.fromName}</div>
          <div className="hg-sms-phone">{t.phone !== t.fromName ? t.phone : (lang === "en" ? "Message" : "Сообщение")}</div>
        </div>
      </div>
      <div className="hg-sms-body">
        <div className="hg-sms-bubble">{t.body}</div>
        <div className="hg-sms-ts">{lang === "en" ? "Today, 2:35 PM" : "Сегодня, 14:35"}</div>
      </div>
    </div>
  );
}

function BrowserMockup({ t }) {
  const isHTTPS = t.url.startsWith("https://");
  return (
    <div className="hg-mockup hg-browser">
      <div className="hg-browser-chrome">
        <div className="hg-browser-tabs">
          <div className="hg-browser-tab active">{t.pageTitle}</div>
          <div className="hg-browser-tab muted">+</div>
        </div>
        <div className="hg-browser-omni">
          <span className={`hg-browser-lock ${isHTTPS ? "hg-lock-green" : "hg-lock-red"}`}>
            {isHTTPS ? "🔒" : "⚠️"}
          </span>
          <span className="hg-browser-url">{t.url}</span>
        </div>
      </div>
      <div className="hg-browser-body">
        <div className="hg-browser-title">{t.pageTitle}</div>
        <pre className="hg-browser-content">{t.body}</pre>
      </div>
    </div>
  );
}

function NotifMockup({ t, lang }) {
  return (
    <div className="hg-mockup hg-notif">
      <div className="hg-notif-phone">
        <div className="hg-notif-bar">
          <span>15:02</span>
          <span>📶🔋</span>
        </div>
        <div className="hg-notif-lockscreen">
          <div className="hg-notif-time-big">15:02</div>
          <div className="hg-notif-date">{lang === "en" ? "March 15 · Friday" : "15 марта · Пятница"}</div>
          <div className="hg-notif-card">
            <div className="hg-notif-card-header">
              <span className="hg-notif-app-icon">{t.icon}</span>
              <span className="hg-notif-app-name">{t.app}</span>
              <span className="hg-notif-card-ago">{lang === "en" ? "now" : "сейчас"}</span>
            </div>
            <div className="hg-notif-card-title">{t.title}</div>
            <div className="hg-notif-card-body">{t.body}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreatMockup({ t, lang }) {
  if (t.type === "email")   return <EmailMockup t={t} lang={lang} />;
  if (t.type === "sms")     return <SMSMockup t={t} lang={lang} />;
  if (t.type === "browser") return <BrowserMockup t={t} />;
  if (t.type === "notif")   return <NotifMockup t={t} lang={lang} />;
  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const DIFF_COLOR = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444" };
const DIFF_BG    = { easy: "#d1fae5", medium: "#fef3c7", hard: "#fee2e2" };
const GAME_SIZE  = 8;
const TIMER_SEC  = 12;
const MAX_LIVES  = 3;

function pickThreats(pool, n) {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}
function loadHiScore() {
  try { return parseInt(localStorage.getItem("hgHiScore") || "0", 10); } catch { return 0; }
}
function saveHiScore(s) {
  try { if (s > loadHiScore()) localStorage.setItem("hgHiScore", String(s)); } catch {}
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HackerGame() {
  const { lang } = useLanguage();

  const THREATS     = lang === "en" ? THREATS_EN : THREATS_RU;
  const DIFF_LABEL  = { easy: lang === "en" ? "Easy" : "Лёгкий", medium: lang === "en" ? "Medium" : "Средний", hard: lang === "en" ? "Hard" : "Сложный" };
  const TYPE_LABEL  = {
    email:   lang === "en" ? "✉ Email"        : "✉ Email",
    sms:     lang === "en" ? "💬 SMS"          : "💬 SMS",
    browser: lang === "en" ? "🌐 Browser"      : "🌐 Браузер",
    notif:   lang === "en" ? "🔔 Notification" : "🔔 Уведомление",
  };

  const [threats,    setThreats]    = useState(() => pickThreats(THREATS, GAME_SIZE));
  const [idx,        setIdx]        = useState(0);
  const [lives,      setLives]      = useState(MAX_LIVES);
  const [points,     setPoints]     = useState(0);
  const [combo,      setCombo]      = useState(0);
  const [maxCombo,   setMaxCombo]   = useState(0);
  const [correct,    setCorrect]    = useState(0);
  const [phase,      setPhase]      = useState("play");
  const [feedback,   setFeedback]   = useState(null);
  const [shake,      setShake]      = useState(false);
  const [hiScore,    setHiScore]    = useState(() => loadHiScore());
  const [timerKey,   setTimerKey]   = useState(0);

  useEffect(() => {
    setThreats(pickThreats(lang === "en" ? THREATS_EN : THREATS_RU, GAME_SIZE));
    setIdx(0); setLives(MAX_LIVES); setPoints(0);
    setCombo(0); setMaxCombo(0); setCorrect(0);
    setFeedback(null); setShake(false);
    setTimerKey(k => k + 1); setPhase("play");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const current = threats[idx];
  const isTimerRunning = phase === "play";
  const timeLeft = useTimer(TIMER_SEC, isTimerRunning, () => {
    if (phase !== "play") return;
    handleResult(false, true);
  });

  const handleResult = useCallback((blocked, timedOut = false) => {
    if (phase !== "play") return;
    const isCorrect  = !timedOut && (blocked === current.isPhishing);
    const newCombo   = isCorrect ? combo + 1 : 0;
    const multi      = isCorrect ? Math.min(1 + (newCombo - 1) * 0.5, 4) : 0;
    const speedBonus = isCorrect ? Math.round((timeLeft / TIMER_SEC) * 50) : 0;
    const gained     = isCorrect ? Math.round(100 * multi) + speedBonus : 0;

    setCombo(newCombo);
    setMaxCombo(m => Math.max(m, newCombo));
    setPoints(p => p + gained);
    if (isCorrect) setCorrect(c => c + 1);

    const newLives = isCorrect ? lives : lives - 1;
    setLives(newLives);

    if (!isCorrect) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    setFeedback({ isCorrect, timedOut, gained, multi, newCombo, explanation: current.explanation });
    setPhase("feedback");

    const delay = isCorrect ? 2000 : 2800;
    setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx >= GAME_SIZE || newLives <= 0) {
        const finalPts = points + gained;
        saveHiScore(finalPts);
        setHiScore(loadHiScore());
        setPhase("finished");
      } else {
        setIdx(nextIdx);
        setFeedback(null);
        setTimerKey(k => k + 1);
        setPhase("play");
      }
    }, delay);
  }, [phase, current, combo, lives, idx, points, timeLeft]);

  const restart = () => {
    setThreats(pickThreats(lang === "en" ? THREATS_EN : THREATS_RU, GAME_SIZE));
    setIdx(0); setLives(MAX_LIVES); setPoints(0);
    setCombo(0); setMaxCombo(0); setCorrect(0);
    setFeedback(null); setShake(false);
    setTimerKey(k => k + 1); setPhase("play");
  };

  // ── Result screen ──
  if (phase === "finished") {
    const acc   = Math.round((correct / GAME_SIZE) * 100);
    const isNew = points > 0 && points >= hiScore;
    const color = acc >= 75 ? "#10b981" : acc >= 50 ? "#f59e0b" : "#ef4444";
    const msg   = lang === "en"
      ? acc >= 75 ? "Great defense! 🛡️" : acc >= 50 ? "Not bad, but some threats slipped through" : "Account compromised 🚨"
      : acc >= 75 ? "Отличная защита! 🛡️" : acc >= 50 ? "Неплохо, но угрозы проскользнули" : "Аккаунт скомпрометирован 🚨";
    return (
      <div className="hg-page">
        <div className="hg-header">
          <p className="hg-eyebrow">{lang === "en" ? "Game Result" : "Результат игры"}</p>
          <h1 className="hg-title">Hacker Game</h1>
        </div>
        <motion.div className="hg-result-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          {isNew && (
            <motion.div className="hg-new-record" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              🏆 {lang === "en" ? "New record!" : "Новый рекорд!"}
            </motion.div>
          )}
          <div className="hg-result-score" style={{ color }}>{points}</div>
          <div className="hg-result-label">{lang === "en" ? "points" : "очков"}</div>
          <p className="hg-result-msg">{msg}</p>
          <div className="hg-result-stats">
            <div className="hg-stat-box">
              <div className="hg-stat-val" style={{ color }}>{acc}%</div>
              <div className="hg-stat-lbl">{lang === "en" ? "Accuracy" : "Точность"}</div>
            </div>
            <div className="hg-stat-box">
              <div className="hg-stat-val">{correct}/{GAME_SIZE}</div>
              <div className="hg-stat-lbl">{lang === "en" ? "Correct" : "Верно"}</div>
            </div>
            <div className="hg-stat-box">
              <div className="hg-stat-val">×{maxCombo}</div>
              <div className="hg-stat-lbl">{lang === "en" ? "Max combo" : "Макс. комбо"}</div>
            </div>
            <div className="hg-stat-box">
              <div className="hg-stat-val">{hiScore}</div>
              <div className="hg-stat-lbl">{lang === "en" ? "Record" : "Рекорд"}</div>
            </div>
          </div>
          <div className="hg-result-actions">
            <button className="t-btn t-btn-primary t-btn-lg" onClick={restart}>
              {lang === "en" ? "Play again" : "Играть снова"}
            </button>
            <Link to="/fun" className="t-btn t-btn-outline t-btn-lg">
              {lang === "en" ? "All Trainers" : "Все тренажёры"}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Play screen ──
  const timerPct  = (timeLeft / TIMER_SEC) * 100;
  const timerColor = timeLeft > 6 ? "#10b981" : timeLeft > 3 ? "#f59e0b" : "#ef4444";
  const comboMulti = Math.min(1 + combo * 0.5, 4);

  return (
    <div className={`hg-page${shake ? " hg-shake" : ""}`}>
      <div className="hg-header">
        <p className="hg-eyebrow">
          {lang === "en" ? `Round ${idx + 1} / ${GAME_SIZE}` : `Раунд ${idx + 1} / ${GAME_SIZE}`}
        </p>
        <h1 className="hg-title">Hacker Game</h1>
        <p className="hg-subtitle">
          {lang === "en" ? "Is this phishing or safe?" : "Определи — это фишинг или нет?"}
        </p>
      </div>

      <div className="hg-hud">
        <div className="hg-hud-left">
          <div className="hg-hud-lives">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <motion.span key={i} animate={{ scale: i < lives ? 1 : 0.6, opacity: i < lives ? 1 : 0.25 }}>❤️</motion.span>
            ))}
          </div>
          <div className="hg-hud-points">
            <span className="hg-pts-num">{points}</span>
            <span className="hg-pts-lbl">{lang === "en" ? "pts" : "очков"}</span>
          </div>
        </div>
        <div className="hg-hud-right">
          {combo >= 2 && (
            <motion.div className="hg-combo-badge" key={combo}
              initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              🔥 ×{comboMulti.toFixed(1)} {lang === "en" ? "combo" : "комбо"}
            </motion.div>
          )}
          <div className="hg-timer-wrap">
            <div className="hg-timer-num" style={{ color: timerColor }}>{timeLeft}</div>
            <div className="hg-timer-bar-bg">
              <motion.div className="hg-timer-bar-fill"
                animate={{ width: `${timerPct}%`, backgroundColor: timerColor }}
                transition={{ duration: 0.5 }} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} className="hg-threat-wrap"
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          <div className="hg-threat-meta">
            <span className="hg-type-badge">{TYPE_LABEL[current.type]}</span>
            <span className="hg-diff-badge" style={{ background: DIFF_BG[current.diff], color: DIFF_COLOR[current.diff] }}>
              {DIFF_LABEL[current.diff]}
            </span>
          </div>
          <ThreatMockup t={current} lang={lang} />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div className={`hg-feedback ${feedback.isCorrect ? "hg-fb-ok" : "hg-fb-no"}`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="hg-fb-header">
              {feedback.timedOut
                ? (lang === "en" ? "⏰ Time's up! −❤️" : "⏰ Время вышло! −❤️")
                : feedback.isCorrect
                  ? `✅ ${lang === "en" ? "Correct!" : "Верно!"} +${feedback.gained} ${lang === "en" ? "pts" : "очков"}${feedback.multi > 1 ? ` (×${feedback.multi.toFixed(1)})` : ""}`
                  : (lang === "en" ? "❌ Wrong! −❤️" : "❌ Ошибка! −❤️")}
            </div>
            <p className="hg-fb-text">{feedback.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hg-actions">
        <motion.button className="hg-btn hg-btn-block" onClick={() => handleResult(true)}
          disabled={phase !== "play"}
          whileHover={phase === "play" ? { scale: 1.03 } : {}}
          whileTap={phase === "play" ? { scale: 0.97 } : {}}>
          🚫 {lang === "en" ? "It's phishing" : "Это фишинг"}
        </motion.button>
        <motion.button className="hg-btn hg-btn-safe" onClick={() => handleResult(false)}
          disabled={phase !== "play"}
          whileHover={phase === "play" ? { scale: 1.03 } : {}}
          whileTap={phase === "play" ? { scale: 0.97 } : {}}>
          ✅ {lang === "en" ? "It's safe" : "Безопасно"}
        </motion.button>
      </div>

      <Link to="/fun" className="hg-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
    </div>
  );
}
