import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import { useLanguage } from "../i18n/LanguageContext";
import { getLessonRead, markLessonOpened } from "../lib/store";
import { record } from "../game/game";
import { useExperience } from "../research/experience";
import { MISSION_BRIEF } from "../game/content";
import "../game/game.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const loadRead = getLessonRead;

export default function LessonPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { features } = useExperience();
  const lessons = lang === "en" ? lessonsEN : lessonsRU;

  const lesson = lessons.find(l => l.id === id);
  const [alreadyRead] = useState(() => !!loadRead()[id]);

  useEffect(() => {
    if (lessons.some(l => l.id === id)) {
      const firstTime = markLessonOpened(id);
      record({ type: "lesson_open", topic: id, firstTime });
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson) return <Navigate to="/lessons" replace />;

  const idx = lessons.findIndex(l => l.id === id);
  const prevLesson = idx > 0 ? lessons[idx - 1] : null;

  return (
    <div className="lp-root">

      {features.gamification && MISSION_BRIEF[lang]?.[id] && (
        <div className="mission-brief">
          <span aria-hidden="true" style={{ fontSize: 22 }}>🛰️</span>
          <div>
            <b>{lang === "en" ? `Mission ${idx + 1}` : `Миссия ${idx + 1}`}</b>
            <p>{MISSION_BRIEF[lang][id]}</p>
          </div>
        </div>
      )}

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
                  <div className="lp-fact-body">
                    <p className="lp-fact-text">{typeof fact === "string" ? fact : fact.text}</p>
                    {fact.source && (
                      <p className="lp-fact-source">
                        {fact.url
                          ? <a href={fact.url} target="_blank" rel="noopener noreferrer">{fact.source} ↗</a>
                          : fact.source}
                      </p>
                    )}
                  </div>
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
              {lesson.cases.kind === "illustrative" ? (
                <div className="lp-case-badge lp-case-badge-example">{lang === "en" ? "Composite example" : "Собирательный пример"}</div>
              ) : (
                <div className="lp-case-badge">{lang === "en" ? "Real incident" : "Реальный инцидент"}</div>
              )}
              <h3 className="lp-case-title">{lesson.cases.title}</h3>
              <p className="lp-case-story">{lesson.cases.story}</p>
              <div className="lp-case-lesson">
                <span className="lp-case-lesson-icon">💡</span>
                <p>{lesson.cases.lesson}</p>
              </div>
              {lesson.cases.kind === "illustrative" ? (
                <p className="lp-case-source">{lang === "en"
                  ? "Names and details are invented; the scheme itself is typical of real cases."
                  : "Имена и детали вымышлены, сама схема типична для реальных случаев."}</p>
              ) : lesson.cases.source && (
                <p className="lp-case-source">
                  {lang === "en" ? "Source: " : "Источник: "}
                  <a href={lesson.cases.source.url} target="_blank" rel="noopener noreferrer">{lesson.cases.source.label} ↗</a>
                </p>
              )}
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
