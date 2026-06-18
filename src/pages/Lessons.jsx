import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import { useLanguage } from "../i18n/LanguageContext";

function loadResults() {
  try { return JSON.parse(localStorage.getItem("testResults")) || {}; } catch { return {}; }
}
function loadRead() {
  try { return JSON.parse(localStorage.getItem("lessonRead") || "{}"); } catch { return {}; }
}

const ICONS = ["🧭","🔐","🎣","📱","🦠","📡","🔄","🕵️","🚨","🏁"];

export default function Lessons() {
  const { t, lang } = useLanguage();
  const lessons = lang === "en" ? lessonsEN : lessonsRU;

  const [results] = useState(() => loadResults());
  const [read]    = useState(() => loadRead());

  const readCount = Object.keys(read).length;
  const total     = lessons.length;
  const donePct   = Math.round((readCount / total) * 100);

  return (
    <div className="ls-root">

      {/* ── Hero ── */}
      <motion.div
        className="ls-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="ls-eyebrow">{t("lessons.eyebrow")}</p>
        <h1 className="ls-hero-title">{t("lessons.title")}</h1>
        <p className="ls-hero-sub">{t("lessons.subtitle")}</p>

        {/* Progress bar */}
        <div className="ls-progress-wrap">
          <div className="ls-progress-top">
            <span className="ls-progress-label">{t("lessons.progress.label")}</span>
            <span className="ls-progress-label"><strong>{readCount}</strong> / {total}</span>
          </div>
          <div className="ls-progress-bg">
            <motion.div
              className="ls-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${donePct}%` }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Grid ── */}
      <div className="ls-grid">
        {lessons.map((lesson, idx) => {
          const testId   = lesson.testPath?.replace("/test/", "");
          const result   = results[testId];
          const isRead   = !!read[lesson.id];
          const pct      = result ? Math.round((result.score / result.total) * 100) : null;
          const passed   = pct !== null && pct >= 75;
          const failed   = pct !== null && pct < 75;

          return (
            <motion.div
              key={lesson.id}
              className={`ls-card ${result ? (passed ? "ls-card-passed" : "ls-card-failed") : isRead ? "ls-card-read" : ""}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.45 }}
              whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(99,102,241,.13)" }}
            >
              {/* Card top row */}
              <div className="ls-card-top">
                <span className="ls-card-num">{idx + 1}</span>
                <span className="ls-card-icon">{ICONS[idx]}</span>
                {result ? (
                  <span className={`ls-card-badge ${passed ? "ls-badge-pass" : "ls-badge-fail"}`}>
                    {pct}% {passed ? "✓" : "↺"}
                  </span>
                ) : isRead ? (
                  <span className="ls-card-badge ls-badge-read">{t("lessons.badgeRead")}</span>
                ) : null}
              </div>

              <h3 className="ls-card-title">{lesson.title.replace(/^\S+\s/, "")}</h3>
              <p className="ls-card-desc">{lesson.desc}</p>

              {/* Meta pills */}
              <div className="ls-card-meta">
                {lesson.concepts && (
                  <span className="ls-meta-pill">{lesson.concepts.length} {lang === "en" ? "concepts" : "понятия"}</span>
                )}
                {lesson.keyFacts && (
                  <span className="ls-meta-pill">{lesson.keyFacts.length} {lang === "en" ? "facts" : "факта"}</span>
                )}
                {lesson.cases && (
                  <span className="ls-meta-pill">1 {lang === "en" ? "case" : "кейс"}</span>
                )}
              </div>

              {/* Score bar if attempted */}
              {pct !== null && (
                <div className="ls-score-bar-wrap">
                  <div className="ls-score-bar-bg">
                    <motion.div
                      className={`ls-score-bar-fill ${passed ? "ls-bar-green" : "ls-bar-red"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              )}

              <div className="ls-card-actions">
                <Link to={`/lessons/${lesson.id}`} className="ls-btn-primary">
                  {result ? t("lessons.retry") : isRead ? t("lessons.reread") : t("lessons.start")} →
                </Link>
                {lesson.testPath && (
                  <Link to={lesson.testPath} className="ls-btn-ghost">
                    {failed ? (lang === "en" ? "Retake test" : "Пересдать тест") : (lang === "en" ? "Test" : "Тест")}
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
