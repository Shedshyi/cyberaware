import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

const URL_CASES_RU = [
  {
    id: 1,
    description: "SMS якобы от Kaspi с просьбой подтвердить аккаунт",
    parts: [
      { text: "http://",           suspicious: true,  reason: "HTTP — незашифрованное соединение. Банки и финансовые сайты ВСЕГДА используют HTTPS. Ссылки без 'S' — первый тревожный сигнал." },
      { text: "kaspi-online",      suspicious: true,  reason: "Поддельное имя. Официальный сайт Kaspi — kaspi.kz. 'kaspi-online' — домен мошенников, имитирующий оригинал." },
      { text: ".com.",             suspicious: false, reason: "" },
      { text: "verify-account.ru", suspicious: true,  reason: "Это настоящий домен этой ссылки — .ru вместо .kz. Kaspi никогда не будет использовать российский домен для казахстанских пользователей." },
      { text: "/login",            suspicious: false, reason: "" },
    ],
  },
  {
    id: 2,
    description: "Письмо с просьбой 'подтвердить оплату' PayPal",
    parts: [
      { text: "https://",   suspicious: false, reason: "" },
      { text: "paypa1",     suspicious: true,  reason: "Тайпосквоттинг: цифра '1' вместо буквы 'l'. При беглом прочтении выглядит как PayPal. Это классическая техника визуального обмана." },
      { text: ".com",       suspicious: false, reason: "" },
      { text: "/secure-payment/verify", suspicious: false, reason: "" },
    ],
  },
  {
    id: 3,
    description: "Ссылка из рекламного баннера 'Войдите в Google'",
    parts: [
      { text: "https://",   suspicious: false, reason: "" },
      { text: "google.com", suspicious: false, reason: "" },
      { text: ".",          suspicious: false, reason: "" },
      { text: "login-secure.info", suspicious: true, reason: "Это реальный домен! В URL домен читается справа: login-secure.info — не google.com. Google.com здесь — просто поддомен фишингового сайта. Трюк с 'авторитетным именем перед настоящим доменом'." },
      { text: "/signin",    suspicious: false, reason: "" },
    ],
  },
  {
    id: 4,
    description: "Ссылка от незнакомца в Telegram: 'смотри что нашёл'",
    parts: [
      { text: "https://",   suspicious: false, reason: "" },
      { text: "bit.ly",     suspicious: true,  reason: "Сокращатель URL скрывает настоящий адрес назначения. Прежде чем перейти, проверь реальный URL через bit.ly+ (добавь + в конец) или сервис unshorten.it." },
      { text: "/3xK9mR",    suspicious: true,  reason: "Случайный набор символов после сокращателя — никакой информации о реальной цели ссылки. Невозможно предугадать куда ведёт." },
    ],
  },
  {
    id: 5,
    description: "Страница 'онлайн-банкинга' из письма",
    parts: [
      { text: "https://",         suspicious: false, reason: "" },
      { text: "192.168.50.103",   suspicious: true,  reason: "IP-адрес вместо доменного имени. Настоящие банки всегда используют официальный домен (например, halyk.kz). IP-адреса в ссылках банков — 100% красный флаг." },
      { text: "/halyk-bank/",     suspicious: true,  reason: "Путь имитирует официальный банк, но это просто папка на сервере злоумышленника. Ничего общего с реальным сайтом Halyk Bank." },
      { text: "index.php",        suspicious: false, reason: "" },
    ],
  },
];

const URL_CASES_EN = [
  {
    id: 1,
    description: "SMS claiming to be from your bank asking you to confirm your account",
    parts: [
      { text: "http://",             suspicious: true,  reason: "HTTP = unencrypted connection. Banks and financial sites ALWAYS use HTTPS. A link without the 'S' is the first red flag." },
      { text: "chase-secure-login",  suspicious: true,  reason: "Spoofed name. Chase's real domain is chase.com. 'chase-secure-login' is a fraudster's domain imitating the original." },
      { text: ".net.",               suspicious: false, reason: "" },
      { text: "verify-now.com",      suspicious: true,  reason: "This is the real domain of this URL. Chase would never use a third-party .com to host account verification for US customers." },
      { text: "/login",              suspicious: false, reason: "" },
    ],
  },
  {
    id: 2,
    description: "Email asking you to 'confirm payment' on PayPal",
    parts: [
      { text: "https://", suspicious: false, reason: "" },
      { text: "paypa1",   suspicious: true,  reason: "Typosquatting: digit '1' instead of the letter 'l'. At a glance it looks like 'PayPal'. This is a classic visual deception technique." },
      { text: ".com",     suspicious: false, reason: "" },
      { text: "/secure-payment/verify", suspicious: false, reason: "" },
    ],
  },
  {
    id: 3,
    description: "Link in an ad banner saying 'Sign in to Google'",
    parts: [
      { text: "https://",           suspicious: false, reason: "" },
      { text: "google.com",         suspicious: false, reason: "" },
      { text: ".",                  suspicious: false, reason: "" },
      { text: "login-secure.info",  suspicious: true,  reason: "This is the real domain! In a URL, the domain is read right-to-left from the first slash: login-secure.info — NOT google.com. Google.com here is just a subdomain of a phishing site. Classic 'trusted name as subdomain' trick." },
      { text: "/signin",            suspicious: false, reason: "" },
    ],
  },
  {
    id: 4,
    description: "Link from a stranger on Telegram: 'check out what I found'",
    parts: [
      { text: "https://", suspicious: false, reason: "" },
      { text: "bit.ly",   suspicious: true,  reason: "URL shorteners hide the real destination. Before clicking, check the real URL by adding '+' at the end (bit.ly/3xK9mR+) or using unshorten.it." },
      { text: "/3xK9mR",  suspicious: true,  reason: "A random string after the shortener reveals nothing about where the link actually goes. There is no way to know the destination without checking." },
    ],
  },
  {
    id: 5,
    description: "'Online banking' page linked in an email",
    parts: [
      { text: "https://",       suspicious: false, reason: "" },
      { text: "192.168.50.103", suspicious: true,  reason: "Raw IP address instead of a domain name. Real banks always use their official domain (e.g., bankofamerica.com). An IP address in a bank link is a 100% red flag." },
      { text: "/bank-of-america/", suspicious: true, reason: "The path mimics an official bank but this is just a folder on an attacker's server. It has no connection to the real Bank of America website." },
      { text: "index.php",      suspicious: false, reason: "" },
    ],
  },
];

export default function URLScannerPage() {
  const { lang } = useLanguage();
  const urlCases = lang === "en" ? URL_CASES_EN : URL_CASES_RU;

  const [caseIdx, setCaseIdx]   = useState(0);
  const [clicked, setClicked]   = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore]       = useState(0);
  const [finished, setFinished] = useState(false);

  const current  = urlCases[caseIdx];
  const traps    = current.parts.filter((p) => p.suspicious);
  const foundAll = traps.every((p) => clicked.includes(p.text));

  const handlePartClick = (part) => {
    if (!part.suspicious || clicked.includes(part.text) || revealed) return;
    setClicked((prev) => [...prev, part.text]);
  };

  const handleReveal = () => {
    const found   = traps.filter((t) => clicked.includes(t.text)).length;
    const trapLen = traps.length;
    setScore((s) => s + Math.round((found / trapLen) * 2));
    setRevealed(true);
  };

  const handleNext = () => {
    if (caseIdx + 1 >= urlCases.length) setFinished(true);
    else { setCaseIdx((i) => i + 1); setClicked([]); setRevealed(false); }
  };

  const handleRestart = () => {
    setCaseIdx(0); setClicked([]); setRevealed(false); setScore(0); setFinished(false);
  };

  const maxScore = urlCases.length * 2;
  const pct = Math.round((score / maxScore) * 100);

  if (finished) {
    const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
    const msg = lang === "en"
      ? pct >= 70 ? "Sharp eye! You spot phishing signs in URLs."
        : pct >= 40 ? "Not bad. Keep training your attention to detail."
        : "Pay attention to every part of a URL — small details are everything."
      : pct >= 70 ? "Отличный глаз! Ты замечаешь признаки фишинга в URL."
        : pct >= 40 ? "Неплохо. Продолжай тренировать внимательность к деталям."
        : "Обращай внимание на каждую часть URL — мелкие детали решают всё.";
    return (
      <div className="trainer-page">
        <div className="trainer-header">
          <p className="trainer-eyebrow">{lang === "en" ? "Result" : "Результат"}</p>
          <h1 className="trainer-title">{lang === "en" ? "URL Inspector" : "URL-инспектор"}</h1>
        </div>
        <motion.div className="trainer-card" style={{ textAlign: "center" }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{pct}%</div>
          <p style={{ margin: "10px 0 6px", fontSize: 16, color: "#374151" }}>{msg}</p>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#9ca3af" }}>
            {lang === "en" ? `Points: ${score} of ${maxScore}` : `Баллов: ${score} из ${maxScore}`}
          </p>
          <div style={{ height: 10, background: "#f3f4f6", borderRadius: 100, marginBottom: 28, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
              style={{ height: "100%", background: color, borderRadius: 100 }} />
          </div>
          <button className="t-btn t-btn-primary t-btn-lg" onClick={handleRestart}>
            {lang === "en" ? "Play again" : "Пройти снова"}
          </button>
        </motion.div>
        <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
      </div>
    );
  }

  return (
    <div className="trainer-page">
      <div className="trainer-header">
        <p className="trainer-eyebrow">{lang === "en" ? "Trainer" : "Тренажёр"} · {caseIdx + 1} / {urlCases.length}</p>
        <h1 className="trainer-title">{lang === "en" ? "URL Inspector" : "URL-инспектор"}</h1>
        <p className="trainer-subtitle">
          {lang === "en"
            ? "Click the suspicious parts of the link. Find all red flags before you 'click'."
            : "Нажимай на подозрительные части ссылки. Найди все красные флаги перед тем, как «кликнуть»."}
        </p>
      </div>

      <div style={{ height: 4, background: "#f3f4f6", borderRadius: 100, marginBottom: 28, overflow: "hidden" }}>
        <motion.div animate={{ width: `${(caseIdx / urlCases.length) * 100}%` }} transition={{ duration: 0.4 }}
          style={{ height: "100%", background: "#6366f1", borderRadius: 100 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={caseIdx}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>

          <div className="trainer-card" style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>
              📧 {lang === "en" ? "Context" : "Контекст"}
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 15, color: "#374151", fontWeight: 600 }}>
              {current.description}
            </p>

            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {lang === "en" ? "Link from the message" : "Ссылка из сообщения"}
            </p>
            <div style={{
              background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12,
              padding: "16px 18px", fontFamily: "monospace", fontSize: 15,
              lineHeight: 1.8, wordBreak: "break-all", marginBottom: 8,
            }}>
              {current.parts.map((part, i) => {
                const isClicked = clicked.includes(part.text);
                const isRevealedTrap = revealed && part.suspicious;
                let bg = "transparent", color = "#374151", border = "none", cursor = "default";
                if (part.suspicious && !revealed) {
                  cursor = isClicked ? "default" : "pointer";
                  bg = isClicked ? "#dcfce7" : "transparent";
                  color = isClicked ? "#166534" : "#374151";
                  border = isClicked ? "1px solid #86efac" : "1px dashed #d1d5db";
                }
                if (isRevealedTrap) {
                  bg = isClicked ? "#dcfce7" : "#fef2f2";
                  border = `1px solid ${isClicked ? "#86efac" : "#fca5a5"}`;
                  color = isClicked ? "#166534" : "#991b1b";
                }
                return (
                  <span
                    key={i}
                    onClick={() => handlePartClick(part)}
                    title={part.suspicious && !revealed ? (isClicked ? (lang === "en" ? "Found!" : "Найдено!") : (lang === "en" ? "Click if suspicious" : "Нажми, если подозрительно")) : ""}
                    style={{ borderRadius: 6, padding: "2px 4px", background: bg, color, border, cursor, transition: "all 0.2s" }}
                  >
                    {part.text}
                  </span>
                );
              })}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
              {lang === "en" ? "Found:" : "Найдено:"} <strong style={{ color: "#6366f1" }}>{clicked.length}</strong> {lang === "en" ? "of" : "из"} <strong>{traps.length}</strong> {lang === "en" ? "suspicious elements" : "подозрительных элементов"}
            </p>
          </div>

          {clicked.length > 0 && (
            <div className="trainer-card" style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#374151" }}>
                🔍 {lang === "en" ? "Issues found" : "Найденные проблемы"}
              </p>
              {current.parts.filter((p) => p.suspicious && clicked.includes(p.text)).map((p) => (
                <div key={p.text} style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <code style={{ fontSize: 13, background: "#f3f4f6", padding: "2px 8px", borderRadius: 6, color: "#7c3aed" }}>
                    {p.text}
                  </code>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.55 }}>{p.reason}</p>
                </div>
              ))}
            </div>
          )}

          {!revealed ? (
            <div style={{ display: "flex", gap: 12 }}>
              <button className="t-btn t-btn-primary t-btn-lg" style={{ flex: 1 }} onClick={handleReveal}>
                {lang === "en" ? "Reveal all threats" : "Показать все опасности"}
              </button>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {traps.filter((t) => !clicked.includes(t.text)).length > 0 && (
                  <div className="trainer-card" style={{ marginBottom: 16, background: "#fef2f2", border: "1px solid #fecaca" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#991b1b" }}>
                      ❌ {lang === "en" ? "Missed threats" : "Пропущенные угрозы"}
                    </p>
                    {traps.filter((t) => !clicked.includes(t.text)).map((p) => (
                      <div key={p.text} style={{ padding: "10px 0", borderBottom: "1px solid #fecaca" }}>
                        <code style={{ fontSize: 13, background: "#fff", padding: "2px 8px", borderRadius: 6, color: "#991b1b" }}>
                          {p.text}
                        </code>
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#7f1d1d", lineHeight: 1.55 }}>{p.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button className="t-btn t-btn-primary t-btn-lg t-btn-block" onClick={handleNext}>
                  {caseIdx + 1 < urlCases.length
                    ? (lang === "en" ? "Next link →" : "Следующая ссылка →")
                    : (lang === "en" ? "Results" : "Результаты")}
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>

      <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
    </div>
  );
}
