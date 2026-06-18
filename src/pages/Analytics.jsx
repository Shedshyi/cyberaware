import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import { useLanguage } from "../i18n/LanguageContext";

function loadResults() {
  try { return JSON.parse(localStorage.getItem("testResults")) || {}; } catch { return {}; }
}

function formatDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

function getScoreMeta(pct, lang) {
  if (pct >= 90) return { label: lang === "en" ? "Excellent"      : "Отлично",       color: "#10b981", bg: "#d1fae5", bar: "#10b981" };
  if (pct >= 75) return { label: lang === "en" ? "Good"           : "Хорошо",        color: "#6366f1", bg: "#eef2ff", bar: "#6366f1" };
  if (pct >= 50) return { label: lang === "en" ? "Satisfactory"   : "Удовлетворит.", color: "#f59e0b", bg: "#fef3c7", bar: "#f59e0b" };
  return             { label: lang === "en" ? "Needs work"     : "Нужна работа",   color: "#ef4444", bg: "#fee2e2", bar: "#ef4444" };
}

export default function Analytics() {
  const { t, lang } = useLanguage();
  const lessons = lang === "en" ? lessonsEN : lessonsRU;
  const TEST_LESSONS = Object.fromEntries(
    lessons.map(l => [l.testPath?.replace("/test/", ""), l])
  );

  const [results, setResults] = useState({});

  useEffect(() => {
    const load = () => {
      try {
        setResults(JSON.parse(localStorage.getItem("testResults")) || {});
      } catch {
        localStorage.removeItem("testResults");
        setResults({});
      }
    };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  const entries   = Object.entries(results);
  const doneCount = entries.length;

  if (doneCount === 0) {
    return (
      <div className="an-root">
        <motion.div
          className="an-empty"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="an-empty-icon">📊</div>
          <h2 className="an-empty-title">{lang === "en" ? "No data yet" : "Ещё нет данных"}</h2>
          <p className="an-empty-desc">{t("analytics.noData")}</p>
          <Link to="/tests" className="an-start-btn">
            {lang === "en" ? "Go to tests →" : "Перейти к тестам →"}
          </Link>
        </motion.div>
      </div>
    );
  }

  const allScores = Object.values(results);
  const avgPct    = Math.round(allScores.reduce((s, r) => s + (r.score / r.total) * 100, 0) / doneCount);
  const bestEntry = allScores.reduce((best, r) => (r.score / r.total > best.score / best.total ? r : best));
  const bestPct   = Math.round((bestEntry.score / bestEntry.total) * 100);
  const passCount = allScores.filter(r => r.score / r.total >= 0.75).length;
  const passedAll = doneCount >= 10 && passCount >= 10;

  const weakEntries = entries
    .filter(([, r]) => r.score / r.total < 0.75)
    .sort(([, a], [, b]) => (a.score / a.total) - (b.score / b.total))
    .slice(0, 3);

  const sorted = [...entries].sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  return (
    <div className="an-root">

      {/* ── Hero ── */}
      <motion.div
        className="an-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="an-eyebrow">{t("analytics.eyebrow")}</p>
        <h1 className="an-hero-title">{t("analytics.title")}</h1>
        <p className="an-hero-sub">
          {lang === "en"
            ? "A detailed view of your results across all course tests."
            : "Детальная картина твоих результатов по всем тестам курса."}
        </p>
      </motion.div>

      {/* ── Summary cards ── */}
      <motion.div
        className="an-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        {[
          { icon: "✅", value: `${doneCount}/10`, label: lang === "en" ? "tests completed" : "тестов пройдено" },
          { icon: "📈", value: `${avgPct}%`,       label: lang === "en" ? "avg score"       : "средний балл"   },
          { icon: "🏅", value: `${bestPct}%`,       label: lang === "en" ? "best result"     : "лучший результат" },
          { icon: "🛡️", value: `${passCount}/10`,  label: lang === "en" ? "tests ≥ 75%"     : "тестов ≥ 75%"   },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="an-summary-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            whileHover={{ y: -3 }}
          >
            <span className="an-summary-icon">{s.icon}</span>
            <span className="an-summary-num">{s.value}</span>
            <span className="an-summary-label">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Certificate banner ── */}
      {passedAll && (
        <motion.div
          className="an-cert-banner"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="an-cert-icon">🏆</span>
          <div>
            <p className="an-cert-title">
              {lang === "en"
                ? "Congratulations! You completed the course with ≥ 75%"
                : "Поздравляем! Ты прошёл весь курс с результатом ≥ 75%"}
            </p>
            <p className="an-cert-sub">
              {lang === "en" ? "Your certificate is ready" : "Твой сертификат готов к получению"}
            </p>
          </div>
          <Link to="/certificate" className="an-cert-btn">
            {lang === "en" ? "Get certificate →" : "Получить сертификат →"}
          </Link>
        </motion.div>
      )}

      {/* ── Results list ── */}
      <motion.div
        className="an-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="an-section-title">
          {lang === "en" ? "Results by test" : "Результаты по тестам"}
        </h2>
        <div className="an-results-list">
          {sorted.map(([id, res], idx) => {
            const pct    = Math.round((res.score / res.total) * 100);
            const meta   = getScoreMeta(pct, lang);
            const lesson = TEST_LESSONS[id];

            return (
              <motion.div
                key={id}
                className="an-result-row"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.42 }}
              >
                <div className="an-result-left">
                  <div className="an-result-num">{id}</div>
                  <div className="an-result-info">
                    <div className="an-result-title">
                      {lesson ? lesson.title.replace(/^\S+\s/, "") : `${lang === "en" ? "Test" : "Тест"} ${id}`}
                    </div>
                    <div className="an-result-date">{formatDate(res.date, lang)}</div>
                  </div>
                </div>

                <div className="an-result-bar-wrap">
                  <div className="an-result-bar-bg">
                    <motion.div
                      className="an-result-bar-fill"
                      style={{ background: meta.bar }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <div className="an-bar-threshold" />
                  </div>
                </div>

                <div className="an-result-right">
                  <span className="an-score-num" style={{ color: meta.color }}>
                    {res.score}/{res.total}
                  </span>
                  <span className="an-score-badge" style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Weak areas ── */}
      {weakEntries.length > 0 && (
        <motion.div
          className="an-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="an-section-title">
            ⚠️ {lang === "en" ? "Need review" : "Требуют повторения"}
          </h2>
          <div className="an-weak-grid">
            {weakEntries.map(([id, res]) => {
              const pct    = Math.round((res.score / res.total) * 100);
              const lesson = TEST_LESSONS[id];
              return (
                <div key={id} className="an-weak-card">
                  <div className="an-weak-top">
                    <span className="an-weak-pct">{pct}%</span>
                    <span className="an-weak-label">{lang === "en" ? "score" : "результат"}</span>
                  </div>
                  <p className="an-weak-title">
                    {lesson ? lesson.title.replace(/^\S+\s/, "") : `${lang === "en" ? "Test" : "Тест"} ${id}`}
                  </p>
                  <Link to={lesson?.testPath || `/test/${id}`} className="an-weak-btn">
                    {lang === "en" ? "Retake →" : "Пересдать →"}
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Recommendations ── */}
      <motion.div
        className="an-section an-recs"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="an-section-title">
          💡 {lang === "en" ? "Recommendations" : "Рекомендации"}
        </h2>
        <div className="an-recs-grid">
          {doneCount < 10 && (
            <div className="an-rec-card">
              <span className="an-rec-icon">📚</span>
              <p className="an-rec-text">
                {lang === "en"
                  ? <>Complete the remaining <strong>{10 - doneCount}</strong> tests for a full picture.</>
                  : <>Пройди оставшиеся <strong>{10 - doneCount}</strong> тестов для полной картины знаний.</>}
              </p>
              <Link to="/lessons" className="an-rec-link">
                {lang === "en" ? "Lessons →" : "К урокам →"}
              </Link>
            </div>
          )}
          {weakEntries.length > 0 && (
            <div className="an-rec-card">
              <span className="an-rec-icon">🔁</span>
              <p className="an-rec-text">
                {lang === "en"
                  ? "Review lessons for topics below 75% and retake the tests."
                  : "Повтори уроки по темам с результатом ниже 75% и пересдай тесты."}
              </p>
              <Link to="/tests" className="an-rec-link">
                {lang === "en" ? "Tests →" : "К тестам →"}
              </Link>
            </div>
          )}
          {avgPct < 80 && (
            <div className="an-rec-card">
              <span className="an-rec-icon">🎮</span>
              <p className="an-rec-text">
                {lang === "en"
                  ? "Practice your skills with the interactive trainers."
                  : "Потренируй практические навыки в интерактивных тренажёрах."}
              </p>
              <Link to="/fun" className="an-rec-link">
                {lang === "en" ? "Trainers →" : "Тренажёры →"}
              </Link>
            </div>
          )}
          {passedAll && (
            <div className="an-rec-card an-rec-card-gold">
              <span className="an-rec-icon">🏆</span>
              <p className="an-rec-text">
                {lang === "en"
                  ? "Course complete! Get your official completion certificate."
                  : "Курс пройден! Получи официальный сертификат об окончании."}
              </p>
              <Link to="/certificate" className="an-rec-link">
                {lang === "en" ? "Certificate →" : "Сертификат →"}
              </Link>
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
