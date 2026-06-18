import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const LEVELS_RU = [
  { label: "Очень слабый", color: "#ef4444", width: "15%" },
  { label: "Слабый",       color: "#f97316", width: "35%" },
  { label: "Средний",      color: "#f59e0b", width: "60%" },
  { label: "Хороший",      color: "#10b981", width: "80%" },
  { label: "Отличный",     color: "#6366f1", width: "100%" },
];
const LEVELS_EN = [
  { label: "Very weak",  color: "#ef4444", width: "15%" },
  { label: "Weak",       color: "#f97316", width: "35%" },
  { label: "Medium",     color: "#f59e0b", width: "60%" },
  { label: "Good",       color: "#10b981", width: "80%" },
  { label: "Excellent",  color: "#6366f1", width: "100%" },
];

function getScore(pass) {
  if (!pass) return -1;
  let s = 0;
  if (pass.length >= 8)  s++;
  if (pass.length >= 12) s++;
  if (/[A-Z]/.test(pass)) s++;
  if (/[0-9]/.test(pass)) s++;
  if (/[^A-Za-z0-9]/.test(pass)) s++;
  return Math.min(s, 4);
}

const CRITERIA_RU = [
  { label: "Минимум 8 символов",   test: (p) => p.length >= 8 },
  { label: "Заглавные буквы (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Цифры (0-9)",          test: (p) => /[0-9]/.test(p) },
  { label: "Спецсимволы (!@#$…)",  test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: "Длина 12+ символов",   test: (p) => p.length >= 12 },
];
const CRITERIA_EN = [
  { label: "At least 8 characters",      test: (p) => p.length >= 8 },
  { label: "Uppercase letters (A-Z)",    test: (p) => /[A-Z]/.test(p) },
  { label: "Numbers (0-9)",             test: (p) => /[0-9]/.test(p) },
  { label: "Special characters (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: "12+ characters",            test: (p) => p.length >= 12 },
];

const TIPS_RU = [
  "Используй фразу-пароль: 4 случайных слова, например «Огонь.Луна.Ключ.7»",
  "Никогда не используй имя, дату рождения или слово 'password'",
  "Уникальный пароль для каждого сайта — используй менеджер паролей",
  "Пароль из 16+ символов с цифрами и символами почти невзламываем перебором",
];
const TIPS_EN = [
  "Use a passphrase: 4 random words, e.g. «Fire.Moon.Key.7»",
  "Never use your name, birthday, or the word 'password'",
  "Use a unique password for each site — use a password manager",
  "A 16+ character password with numbers and symbols is virtually uncrackable by brute force",
];

export default function PasswordChecker() {
  const { lang } = useLanguage();
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);

  const LEVELS   = lang === "en" ? LEVELS_EN   : LEVELS_RU;
  const criteria = lang === "en" ? CRITERIA_EN : CRITERIA_RU;
  const tips     = lang === "en" ? TIPS_EN     : TIPS_RU;

  const score = getScore(password);
  const level = score >= 0 ? LEVELS[score] : null;

  return (
    <div className="trainer-page">
      <div className="trainer-header">
        <p className="trainer-eyebrow">{lang === "en" ? "Trainer" : "Тренажёр"}</p>
        <h1 className="trainer-title">{lang === "en" ? "Password Checker" : "Проверка пароля"}</h1>
        <p className="trainer-subtitle">
          {lang === "en"
            ? "Enter a password below — we'll evaluate its strength and suggest improvements."
            : "Введи пароль ниже — мы оценим его надёжность и подскажем, как улучшить."}
        </p>
      </div>

      <div className="trainer-card">
        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
          {lang === "en" ? "Your password" : "Твой пароль"}
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type={show ? "text" : "password"}
            placeholder={lang === "en" ? "Enter a password to check" : "Введи пароль для проверки"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              flex: 1, padding: "13px 16px",
              borderRadius: 12, border: "1.5px solid #e5e7eb",
              fontSize: 16, outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
              color: "#0f0f14",
            }}
            onFocus={e => e.target.style.borderColor = "#6366f1"}
            onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
          />
          <button
            onClick={() => setShow(!show)}
            style={{
              padding: "0 16px", borderRadius: 12,
              border: "1.5px solid #e5e7eb", background: "#f9fafb",
              cursor: "pointer", fontSize: 18, color: "#6b7280",
              transition: "all 0.2s",
            }}
            title={show ? (lang === "en" ? "Hide" : "Скрыть") : (lang === "en" ? "Show" : "Показать")}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
              {lang === "en" ? "Strength" : "Надёжность"}
            </span>
            {level && (
              <span style={{ fontSize: 13, fontWeight: 700, color: level.color }}>{level.label}</span>
            )}
          </div>
          <div style={{ height: 8, background: "#f3f4f6", borderRadius: 100, overflow: "hidden" }}>
            <motion.div
              animate={{ width: level ? level.width : "0%", backgroundColor: level ? level.color : "#e5e7eb" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 100 }}
            />
          </div>
        </div>

        {password && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}
          >
            {criteria.map((c) => {
              const ok = c.test(password);
              return (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: ok ? "#d1fae5" : "#fee2e2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, flexShrink: 0,
                  }}>
                    {ok ? "✓" : "✗"}
                  </div>
                  <span style={{ fontSize: 14, color: ok ? "#065f46" : "#991b1b", fontWeight: 500 }}>
                    {c.label}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      <div className="trainer-card" style={{ marginTop: 20, background: "#fafafa" }}>
        <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#374151", letterSpacing: "-0.01em" }}>
          💡 {lang === "en" ? "Tips for strong passwords" : "Советы по созданию надёжных паролей"}
        </p>
        <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {tips.map((tip) => (
            <li key={tip} style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.55 }}>{tip}</li>
          ))}
        </ul>
      </div>

      <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
    </div>
  );
}
