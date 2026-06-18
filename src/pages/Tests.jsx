import React, { useState } from "react";
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
    return new Date(dateStr).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "short" });
  } catch { return dateStr; }
}

const ICONS = ["🧭","🔐","🎣","📱","🦠","📡","🔄","🕵️","🚨","🏁"];

export default function Tests() {
  const { t, lang } = useLanguage();
  const lessons = lang === "en" ? lessonsEN : lessonsRU;
  const [results] = useState(() => loadResults());

  const allScores  = Object.values(results);
  const doneCount  = allScores.length;
  const avgPct     = doneCount
    ? Math.round(allScores.reduce((s, r) => s + (r.score / r.total) * 100, 0) / doneCount)
    : 0;
  const passedAll  = doneCount >= 10 && allScores.every(r => r.score / r.total >= 0.75);

  return (
    <div className="ts-root">

      {/* ── Hero ── */}
      <motion.div
        className="ts-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="ts-eyebrow">{t("tests.eyebrow")}</p>
        <h1 className="ts-hero-title">{t("tests.title")}</h1>
        <p className="ts-hero-sub">{t("tests.subtitle")}</p>

        {doneCount > 0 && (
          <motion.div
            className="ts-summary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="ts-summary-stat">
              <span className="ts-summary-num">{doneCount}<span className="ts-summary-denom">/10</span></span>
              <span className="ts-summary-label">{lang === "en" ? "completed" : "пройдено"}</span>
            </div>
            <div className="ts-summary-sep" />
            <div className="ts-summary-stat">
              <span className="ts-summary-num">{avgPct}%</span>
              <span className="ts-summary-label">{lang === "en" ? "avg score" : "средний балл"}</span>
            </div>
            <div className="ts-summary-sep" />
            <div className="ts-summary-stat">
              <span className="ts-summary-num">
                {allScores.filter(r => r.score / r.total >= 0.75).length}
              </span>
              <span className="ts-summary-label">{lang === "en" ? "tests ≥ 75%" : "тестов ≥ 75%"}</span>
            </div>
            {passedAll && (
              <>
                <div className="ts-summary-sep" />
                <Link to="/certificate" className="ts-cert-chip">
                  🏆 {lang === "en" ? "Get Certificate" : "Получить сертификат"}
                </Link>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Test cards ── */}
      <div className="ts-grid">
        {lessons.map((lesson, idx) => {
          const testId = lesson.testPath?.replace("/test/", "");
          const result = results[testId];
          const pct    = result ? Math.round((result.score / result.total) * 100) : null;
          const passed = pct !== null && pct >= 75;
          const failed = pct !== null && pct < 75;

          return (
            <motion.div
              key={lesson.id}
              className={`ts-card ${passed ? "ts-card-passed" : failed ? "ts-card-failed" : ""}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.04, duration: 0.42 }}
              whileHover={{ y: -4, boxShadow: "0 14px 36px rgba(99,102,241,.11)" }}
            >
              <div className="ts-card-left">
                <div className="ts-card-icon-wrap">
                  <span className="ts-card-icon">{ICONS[idx]}</span>
                </div>
                <div className="ts-card-info">
                  <div className="ts-card-num">{lang === "en" ? "Test" : "Тест"} {idx + 1}</div>
                  <div className="ts-card-title">{lesson.title.replace(/^\S+\s/, "")}</div>
                  {result && (
                    <div className="ts-card-date">
                      {lang === "en" ? "Taken:" : "Пройден:"} {formatDate(result.date, lang)}
                    </div>
                  )}
                </div>
              </div>

              <div className="ts-card-right">
                {pct !== null ? (
                  <div className="ts-card-score-block">
                    <div className={`ts-score-circle ${passed ? "ts-score-green" : "ts-score-red"}`}>
                      {pct}%
                    </div>
                    <div className="ts-score-detail">
                      {result.score}/{result.total} {lang === "en" ? "correct" : "правильно"}
                    </div>
                    <Link
                      to={lesson.testPath}
                      className={`ts-action-btn ${failed ? "ts-btn-retry" : "ts-btn-redo"}`}
                    >
                      {failed
                        ? (lang === "en" ? "Retake" : "Пересдать")
                        : (lang === "en" ? "Redo" : "Повторить")}
                    </Link>
                  </div>
                ) : (
                  <Link to={lesson.testPath} className="ts-action-btn ts-btn-start">
                    {t("tests.start")}
                  </Link>
                )}
              </div>

              {pct !== null && (
                <div className="ts-card-bar-wrap">
                  <div className="ts-card-bar-bg">
                    <motion.div
                      className={`ts-card-bar-fill ${passed ? "ts-bar-green" : "ts-bar-red"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <div className="ts-card-bar-mark" />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
