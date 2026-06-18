import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import { useLanguage } from "../i18n/LanguageContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

function loadRead() {
  try { return JSON.parse(localStorage.getItem("lessonRead") || "{}"); } catch { return {}; }
}

export default function LessonPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const lessons = lang === "en" ? lessonsEN : lessonsRU;

  const lesson = lessons.find(l => l.id === id);
  const [alreadyRead] = useState(() => !!loadRead()[id]);

  useEffect(() => {
    const prev = loadRead();
    if (!prev[id]) {
      prev[id] = new Date().toISOString();
      localStorage.setItem("lessonRead", JSON.stringify(prev));
    }
  }, [id]);

  if (!lesson) return <Navigate to="/lessons" replace />;

  const idx = lessons.findIndex(l => l.id === id);
  const prevLesson = idx > 0 ? lessons[idx - 1] : null;

  return (
    <div className="lp-root">

      {/* ── HERO ── */}
      <motion.div
        className="lp-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="lp-hero-eyebrow-row"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="lp-hero-eyebrow">{t("lessonPage.lessonOf", { idx: idx + 1, total: lessons.length })}</p>
          {alreadyRead && <span className="lp-read-badge">{t("lessonPage.read")}</span>}
        </motion.div>
        <motion.h1
          className="lp-hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {lesson.title}
        </motion.h1>
        <motion.p
          className="lp-hero-intro"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.55 }}
        >
          {lesson.intro || lesson.desc}
        </motion.p>
      </motion.div>

      <div className="lp-body">

        {/* ── KEY FACTS ── */}
        {lesson.keyFacts && (
          <motion.section className="lp-section" {...fadeUp(0)}>
            <h2 className="lp-section-title">📊 {t("lessonPage.facts")}</h2>
            <div className="lp-facts-grid">
              {lesson.keyFacts.map((fact, i) => (
                <motion.div
                  key={i}
                  className="lp-fact-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  whileHover={{ y: -3 }}
                >
                  <span className="lp-fact-num">{String(i + 1).padStart(2, "0")}</span>
                  <p className="lp-fact-text">{fact}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── CONCEPTS ── */}
        {lesson.concepts && (
          <motion.section className="lp-section" {...fadeUp(0.05)}>
            <h2 className="lp-section-title">🔑 {t("lessonPage.concepts")}</h2>
            <div className="lp-concepts-grid">
              {lesson.concepts.map((c, i) => (
                <motion.div
                  key={i}
                  className="lp-concept-card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  whileHover={{ y: -4, boxShadow: "0 12px 36px rgba(99,102,241,.13)" }}
                >
                  <div className="lp-concept-term">{c.term}</div>
                  <p className="lp-concept-def">{c.def}</p>
                  <div className="lp-concept-example">
                    <span className="lp-concept-ex-label">{lang === "en" ? "Example" : "Пример"}</span>
                    {c.example}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── CASE STUDY ── */}
        {lesson.cases && (
          <motion.section className="lp-section" {...fadeUp(0.05)}>
            <h2 className="lp-section-title">📋 {t("lessonPage.caseTitle")}</h2>
            <motion.div
              className="lp-case-card"
              whileHover={{ y: -3 }}
            >
              <div className="lp-case-badge">{lang === "en" ? "Real incident" : "Реальный инцидент"}</div>
              <h3 className="lp-case-title">{lesson.cases.title}</h3>
              <p className="lp-case-story">{lesson.cases.story}</p>
              <div className="lp-case-lesson">
                <span className="lp-case-lesson-icon">💡</span>
                <p>{lesson.cases.lesson}</p>
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* ── DO & DON'T ── */}
        {lesson.doAndDont && (
          <motion.section className="lp-section" {...fadeUp(0.05)}>
            <h2 className="lp-section-title">✅ {lang === "en" ? "Do's and Don'ts" : "Что делать и что нет"}</h2>
            <div className="lp-dd-grid">
              <div className="lp-dd-col lp-dd-do">
                <div className="lp-dd-header">
                  <span className="lp-dd-icon">✓</span>
                  <span>{t("lessonPage.doTitle")}</span>
                </div>
                <ul className="lp-dd-list">
                  {lesson.doAndDont.do.map((item, i) => (
                    <motion.li
                      key={i}
                      className="lp-dd-item"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="lp-dd-col lp-dd-dont">
                <div className="lp-dd-header">
                  <span className="lp-dd-icon">✗</span>
                  <span>{t("lessonPage.dontTitle")}</span>
                </div>
                <ul className="lp-dd-list">
                  {lesson.doAndDont.dont.map((item, i) => (
                    <motion.li
                      key={i}
                      className="lp-dd-item"
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>
        )}

        {/* ── VIDEO ── */}
        {lesson.video && (
          <motion.section className="lp-section" {...fadeUp(0.05)}>
            <h2 className="lp-section-title">🎬 {lang === "en" ? "Video material" : "Видео-материал"}</h2>
            <div className="lp-video-wrap">
              <iframe
                src={lesson.video}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="lp-video"
              />
            </div>
          </motion.section>
        )}

        {/* ── TIPS ── */}
        {lesson.tips && lesson.tips.length > 0 && (
          <motion.section className="lp-section" {...fadeUp(0.05)}>
            <h2 className="lp-section-title">💡 {t("lessonPage.tips")}</h2>
            <div className="lp-tips-list">
              {lesson.tips.map((tip, i) => (
                <motion.div
                  key={i}
                  className="lp-tip-item"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="lp-tip-bullet" />
                  {tip}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── NAV ── */}
        <motion.div className="lp-nav" {...fadeUp(0.1)}>
          {prevLesson ? (
            <Link to={`/lessons/${prevLesson.id}`} className="lp-nav-btn lp-nav-prev">
              ← {prevLesson.title}
            </Link>
          ) : (
            <Link to="/lessons" className="lp-nav-btn lp-nav-prev">
              {t("lessonPage.backToLessons")}
            </Link>
          )}

          {lesson.testPath && (
            <Link to={lesson.testPath} className="lp-nav-btn lp-nav-test">
              {t("lessonPage.takeTest")}
            </Link>
          )}

          {lesson.next ? (
            <Link to={`/lessons/${lesson.next}`} className="lp-nav-btn lp-nav-next">
              {t("lessonPage.nextLesson")}
            </Link>
          ) : (
            <Link to="/tests" className="lp-nav-btn lp-nav-next">
              {lang === "en" ? "All Tests →" : "Все тесты →"}
            </Link>
          )}
        </motion.div>

      </div>
    </div>
  );
}
