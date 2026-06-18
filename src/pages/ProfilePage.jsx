import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import { useLanguage } from "../i18n/LanguageContext";

const AVATAR_COLORS = [
  { id: "indigo", value: "#6366f1" },
  { id: "rose",   value: "#f43f5e" },
  { id: "teal",   value: "#14b8a6" },
  { id: "amber",  value: "#f59e0b" },
  { id: "violet", value: "#8b5cf6" },
  { id: "sky",    value: "#0ea5e9" },
  { id: "green",  value: "#10b981" },
  { id: "orange", value: "#f97316" },
];

function getBadges(lang) {
  return [
    { id: "first_test",     icon: "🏁", title: lang === "en" ? "First Step"       : "Первый шаг",     desc: lang === "en" ? "Complete your first test"         : "Пройди первый тест",        check: (r) => Object.keys(r).length >= 1 },
    { id: "five_tests",     icon: "⭐", title: lang === "en" ? "Halfway There"    : "На полпути",     desc: lang === "en" ? "Complete 5 tests"                 : "Пройди 5 тестов",           check: (r) => Object.keys(r).length >= 5 },
    { id: "all_tests",      icon: "🏆", title: lang === "en" ? "Full Course"      : "Полный курс",    desc: lang === "en" ? "All 10 tests completed"           : "Все 10 тестов пройдены",    check: (r) => Object.keys(r).length >= 10 },
    { id: "perfect_score",  icon: "💯", title: lang === "en" ? "Perfectionist"   : "Перфекционист",  desc: lang === "en" ? "100% on any test"                 : "100% в любом тесте",        check: (r) => Object.values(r).some((t) => t.score === t.total) },
    { id: "avg_90",         icon: "💎", title: lang === "en" ? "Expert"          : "Эксперт",        desc: lang === "en" ? "Average score above 90%"          : "Средний балл выше 90%",     check: (r) => { const v = Object.values(r); return v.length > 0 && v.reduce((s, t) => s + t.score / t.total, 0) / v.length >= 0.9; } },
    { id: "all_green",      icon: "🛡️", title: lang === "en" ? "Cyber Defender"  : "Киберзащитник",  desc: lang === "en" ? "All tests ≥ 75%"                  : "Все тесты ≥ 75%",           check: (r) => { const v = Object.values(r); return v.length >= 10 && v.every((t) => t.score / t.total >= 0.75); } },
    { id: "password_master",icon: "🔐", title: lang === "en" ? "Password Master" : "Мастер паролей", desc: lang === "en" ? "Passwords test at 100%"           : "Тест «Пароли» на 100%",     check: (r) => r["2"] && r["2"].score === r["2"].total },
    { id: "anti_phishing",  icon: "🎣", title: lang === "en" ? "Anti-Phisher"    : "Антифишер",      desc: lang === "en" ? "Phishing test at 100%"            : "Тест «Фишинг» на 100%",     check: (r) => r["3"] && r["3"].score === r["3"].total },
  ];
}

function loadProfile()  { try { return JSON.parse(localStorage.getItem("userProfile")); } catch { return null; } }
function saveProfile(p) { localStorage.setItem("userProfile", JSON.stringify(p)); }
function loadResults()  { try { return JSON.parse(localStorage.getItem("testResults")) || {}; } catch { return {}; } }

function getScoreColor(pct) {
  if (pct >= 80) return "#10b981";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

function formatDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "short" });
  } catch { return dateStr; }
}

function SetupModal({ onSave, lang }) {
  const [name,  setName]  = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0].value);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const profile = { name: trimmed, color, joined: new Date().toISOString() };
    saveProfile(profile);
    onSave(profile);
  };

  return (
    <div className="profile-overlay">
      <motion.div
        className="profile-setup-card"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
        <h2>{lang === "en" ? "Create your profile" : "Создай профиль"}</h2>
        <p>{lang === "en" ? "Enter a name and pick an avatar color — everything is stored in your browser only." : "Введи имя и выбери цвет аватара — всё хранится только в твоём браузере."}</p>

        <input
          className="profile-name-input"
          placeholder={lang === "en" ? "Your name or nickname" : "Твоё имя или никнейм"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          maxLength={32}
          autoFocus
        />

        <span className="profile-color-label">{lang === "en" ? "Avatar color" : "Цвет аватара"}</span>
        <div className="profile-colors">
          {AVATAR_COLORS.map((c) => (
            <div
              key={c.id}
              className={`profile-color-dot${color === c.value ? " selected" : ""}`}
              style={{ background: c.value }}
              onClick={() => setColor(c.value)}
            />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, padding: "14px 16px", background: "#f9fafb", borderRadius: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff" }}>
            {name.trim() ? name.trim()[0].toUpperCase() : "?"}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f0f14" }}>
              {name.trim() || (lang === "en" ? "Username" : "Имя пользователя")}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>CyberAware · {lang === "en" ? "new member" : "новый участник"}</p>
          </div>
        </div>

        <button className="t-btn t-btn-primary t-btn-lg t-btn-block" onClick={handleSave} disabled={!name.trim()}>
          {lang === "en" ? "Create profile" : "Создать профиль"}
        </button>
      </motion.div>
    </div>
  );
}

function EditModal({ profile, onSave, onClose, lang }) {
  const [name,  setName]  = useState(profile.name);
  const [color, setColor] = useState(profile.color);

  const handleSave = () => {
    if (!name.trim()) return;
    const updated = { ...profile, name: name.trim(), color };
    saveProfile(updated);
    onSave(updated);
  };

  return (
    <div className="profile-overlay">
      <motion.div
        className="profile-setup-card"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 style={{ marginBottom: 20 }}>{lang === "en" ? "Edit profile" : "Редактировать профиль"}</h2>
        <input
          className="profile-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          maxLength={32}
          autoFocus
        />
        <span className="profile-color-label">{lang === "en" ? "Avatar color" : "Цвет аватара"}</span>
        <div className="profile-colors" style={{ marginBottom: 28 }}>
          {AVATAR_COLORS.map((c) => (
            <div
              key={c.id}
              className={`profile-color-dot${color === c.value ? " selected" : ""}`}
              style={{ background: c.value }}
              onClick={() => setColor(c.value)}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="t-btn t-btn-outline" style={{ flex: 1 }} onClick={onClose}>{lang === "en" ? "Cancel" : "Отмена"}</button>
          <button className="t-btn t-btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={!name.trim()}>{lang === "en" ? "Save" : "Сохранить"}</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  const { lang } = useLanguage();
  const lessons = lang === "en" ? lessonsEN : lessonsRU;
  const BADGES = getBadges(lang);

  const TEST_NAMES = Object.fromEntries(
    lessons.map((l, idx) => [String(idx + 1), l.title.replace(/^\S+\s/, "")])
  );

  const [profile,  setProfile]  = useState(() => loadProfile());
  const [results,  setResults]  = useState(() => loadResults());
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const refresh = () => setResults(loadResults());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const passed      = Object.keys(results).length;
  const allScores   = Object.values(results);
  const avgPct      = allScores.length ? Math.round(allScores.reduce((s, t) => s + (t.score / t.total) * 100, 0) / allScores.length) : 0;
  const bestPct     = allScores.length ? Math.round(Math.max(...allScores.map((t) => (t.score / t.total) * 100))) : 0;
  const earnedBadges = BADGES.filter((b) => b.check(results));
  const allPassed   = passed >= 10 && allScores.every(t => t.score / t.total >= 0.75);

  const activity = Object.entries(results)
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const weakTests = Object.entries(results)
    .filter(([, r]) => r.score / r.total < 0.75)
    .map(([id]) => id);

  if (!profile) return <SetupModal onSave={setProfile} lang={lang} />;

  const initial = profile.name[0].toUpperCase();
  const joinedStr = (() => {
    try {
      return new Date(profile.joined).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "long", year: "numeric" });
    } catch { return ""; }
  })();

  return (
    <>
      {showEdit && (
        <EditModal
          profile={profile}
          onSave={(p) => { setProfile(p); setShowEdit(false); }}
          onClose={() => setShowEdit(false)}
          lang={lang}
        />
      )}

      <div className="profile-page">
        <motion.div className="profile-hero" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="profile-hero-top">
            <div className="profile-avatar" style={{ background: profile.color }}>{initial}</div>
            <div className="profile-hero-info">
              <p className="profile-hero-name">{profile.name}</p>
              {joinedStr && (
                <p className="profile-hero-meta">{lang === "en" ? "Registered:" : "Зарегистрирован:"} {joinedStr}</p>
              )}
            </div>
            <button className="profile-edit-btn" onClick={() => setShowEdit(true)}>
              ✏️ {lang === "en" ? "Edit" : "Изменить"}
            </button>
          </div>

          <div className="profile-hero-stats">
            {[
              { value: passed,                               label: lang === "en" ? "tests completed" : "тестов пройдено" },
              { value: passed ? `${avgPct}%` : "—",         label: lang === "en" ? "avg score"       : "средний балл" },
              { value: passed ? `${bestPct}%` : "—",        label: lang === "en" ? "best result"     : "лучший результат" },
              { value: earnedBadges.length,                  label: lang === "en" ? "badges"          : "бейджей" },
            ].map((s) => (
              <div className="profile-hero-stat" key={s.label}>
                <span className="profile-hero-stat-value">{s.value}</span>
                <span className="profile-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {allPassed && (
          <motion.div className="profile-cert-banner" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}>
            <div className="profile-cert-left">
              <span className="profile-cert-icon">🏆</span>
              <div>
                <p className="profile-cert-title">
                  {lang === "en" ? "Course complete! Your certificate is ready" : "Курс завершён! Твой сертификат готов"}
                </p>
                <p className="profile-cert-sub">
                  {lang === "en" ? `Average score: ${avgPct}% · All 10 tests passed` : `Средний балл: ${avgPct}% · Все 10 тестов пройдены`}
                </p>
              </div>
            </div>
            <Link to="/certificate" className="profile-cert-btn">
              {lang === "en" ? "Get certificate →" : "Получить сертификат →"}
            </Link>
          </motion.div>
        )}

        <motion.div className="profile-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }}>
          <p className="profile-section-title">
            🏅 {lang === "en" ? "Achievements" : "Достижения"} · {earnedBadges.length}/{BADGES.length}
          </p>
          <div className="profile-badges">
            {BADGES.map((b) => {
              const earned = b.check(results);
              return (
                <div key={b.id} className={`profile-badge ${earned ? "earned" : "locked"}`}>
                  <span className="profile-badge-icon">{b.icon}</span>
                  <p className="profile-badge-title">{b.title}</p>
                  <p className="profile-badge-desc">{b.desc}</p>
                  {earned && (
                    <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700, marginTop: 4, display: "block" }}>
                      {lang === "en" ? "EARNED" : "ПОЛУЧЕНО"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div className="profile-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45 }}>
          <p className="profile-section-title">📊 {lang === "en" ? "Progress by test" : "Прогресс по тестам"}</p>
          {Object.entries(TEST_NAMES).map(([id, name]) => {
            const r     = results[id];
            const pct   = r ? Math.round((r.score / r.total) * 100) : null;
            const color = pct !== null ? getScoreColor(pct) : "#e5e7eb";
            const isWeak = weakTests.includes(id);
            return (
              <div className="profile-test-row" key={id}>
                <div className="profile-test-num" style={{ background: pct !== null ? color + "22" : "#f3f4f6", color: pct !== null ? color : "#9ca3af" }}>
                  {id}
                </div>
                <div className="profile-test-name">
                  {name}
                  {isWeak && (
                    <Link to={`/test/${id}`} style={{ marginLeft: 8, fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>
                      {lang === "en" ? "Retry →" : "Повторить →"}
                    </Link>
                  )}
                </div>
                <div className="profile-test-bar-wrap">
                  <motion.div className="profile-test-bar"
                    initial={{ width: 0 }}
                    animate={{ width: pct !== null ? `${pct}%` : "0%" }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ background: color }}
                  />
                </div>
                <span className="profile-test-score" style={{ color: pct !== null ? color : "#9ca3af" }}>
                  {pct !== null ? `${pct}%` : "—"}
                </span>
              </div>
            );
          })}
        </motion.div>

        <motion.div className="profile-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.45 }}>
          <p className="profile-section-title">🕐 {lang === "en" ? "Recent activity" : "Последняя активность"}</p>
          {activity.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", fontStyle: "italic" }}>
              {lang === "en" ? "No activity yet. Take a test to see your history." : "Пока нет активности. Пройди тест, чтобы увидеть историю."}
            </p>
          ) : (
            activity.map((r) => {
              const pct   = Math.round((r.score / r.total) * 100);
              const color = getScoreColor(pct);
              return (
                <div className="profile-activity-row" key={r.id + r.date}>
                  <div className="profile-activity-dot" style={{ background: color }} />
                  <span className="profile-activity-text">
                    {lang === "en" ? "Test" : "Тест"} {r.id} · {TEST_NAMES[r.id] || `${lang === "en" ? "Test" : "Тест"} ${r.id}`}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, marginRight: 8 }}>{pct}%</span>
                  <span className="profile-activity-date">{formatDate(r.date, lang)}</span>
                </div>
              );
            })
          )}
        </motion.div>

        {passed === 0 && (
          <motion.div className="profile-card" style={{ background: "#fafafa", textAlign: "center" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
            <p style={{ margin: "0 0 16px", fontSize: 15, color: "#6b7280" }}>
              {lang === "en" ? "You haven't taken any tests yet. Start with the first lesson!" : "Ты ещё не проходил тесты. Начни с первого урока!"}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/lessons" className="t-btn t-btn-primary">{lang === "en" ? "Go to lessons" : "Перейти к урокам"}</Link>
              <Link to="/fun" className="t-btn t-btn-outline">{lang === "en" ? "Open trainers" : "Открыть тренажёры"}</Link>
            </div>
          </motion.div>
        )}

        {weakTests.length > 0 && (
          <motion.div className="profile-card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#92400e" }}>
              ⚠️ {lang === "en" ? "Weak spots — worth reviewing" : "Слабые места — стоит повторить"}
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#a16207" }}>
              {lang === "en"
                ? `Score below 75% in ${weakTests.length} ${weakTests.length === 1 ? "test" : "tests"}`
                : `Результат ниже 75% в ${weakTests.length} ${weakTests.length === 1 ? "тесте" : "тестах"}`}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {weakTests.map((id) => (
                <Link key={id} to={`/test/${id}`} className="t-btn t-btn-amber t-btn-sm">
                  {lang === "en" ? "Test" : "Тест"} {id}: {TEST_NAMES[id]}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
