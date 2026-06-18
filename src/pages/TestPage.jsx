import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import testsDataRU from "../data/testsData";
import testsDataEN from "../data/testsData.en";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import { useLanguage } from "../i18n/LanguageContext";

const TIMER_SEC = 180;

export default function TestPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { t, lang } = useLanguage();

  const testsData = lang === "en" ? testsDataEN : testsDataRU;
  const lessons   = lang === "en" ? lessonsEN   : lessonsRU;

  const questions = testsData[id] || [];

  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [score,      setScore]      = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(TIMER_SEC);
  const [timedOut,   setTimedOut]   = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (submitted) return;
    const iv = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(iv);
  }, [submitted]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      const a = answersRef.current;
      let s = 0;
      questions.forEach(q => { if (a[q.id] === q.correct) s++; });
      setScore(s);
      setSubmitted(true);
      setTimedOut(true);
      const prev = JSON.parse(localStorage.getItem("testResults")) || {};
      prev[id] = { score: s, total: questions.length, date: new Date().toISOString() };
      localStorage.setItem("testResults", JSON.stringify(prev));
    }
  }, [timeLeft, submitted, id, questions]);

  const lessonIdx  = lessons.findIndex(l => l.testPath === `/test/${id}`);
  const thisLesson = lessonIdx >= 0 ? lessons[lessonIdx] : null;
  const nextLesson = lessonIdx >= 0 && lessonIdx < lessons.length - 1
    ? lessons[lessonIdx + 1] : null;

  const q             = questions[current];
  const answeredCount = Object.keys(answers).length;
  const allAnswered   = questions.length > 0 && answeredCount === questions.length;
  const isLast        = current === questions.length - 1;

  function getGrade(pct) {
    if (pct >= 90) return { label: lang === "en" ? "Excellent!" : "Отлично!",            emoji: "🏆", color: "#10b981", bg: "#d1fae5" };
    if (pct >= 75) return { label: lang === "en" ? "Good"       : "Хорошо",              emoji: "✅", color: "#6366f1", bg: "#eef2ff" };
    if (pct >= 50) return { label: lang === "en" ? "Satisfactory" : "Удовлетворительно", emoji: "📈", color: "#f59e0b", bg: "#fef3c7" };
    return              { label: lang === "en" ? "Needs work"  : "Нужна работа",         emoji: "📚", color: "#ef4444", bg: "#fee2e2" };
  }

  const handleSelect = (optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    let s = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct) s++; });
    setScore(s);
    setSubmitted(true);
    const prev = JSON.parse(localStorage.getItem("testResults")) || {};
    prev[id] = { score: s, total: questions.length, date: new Date().toISOString() };
    localStorage.setItem("testResults", JSON.stringify(prev));
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setShowReview(false);
    setScore(0);
    setTimeLeft(TIMER_SEC);
    setTimedOut(false);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const timerClass = `tp-timer${timeLeft <= 30 ? " tp-timer-urgent" : timeLeft <= 60 ? " tp-timer-warn" : ""}`;

  const pct     = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const grade   = getGrade(pct);
  const passed  = pct >= 75;
  const wrongQs = questions.filter(q => answers[q.id] !== q.correct);

  if (!questions.length) {
    return (
      <div className="tp-root">
        <div className="tp-empty">
          <p>{lang === "en" ? "Test not found." : "Тест не найден."}</p>
          <Link to="/tests" className="tp-btn-primary">← {lang === "en" ? "Tests" : "К тестам"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-root">
      {!submitted ? (
        <>
          {/* ── Progress header ── */}
          <div className="tp-header">
            <div className="tp-header-top">
              <Link to="/tests" className="tp-back-link">← {lang === "en" ? "Tests" : "К тестам"}</Link>
              <span className="tp-counter">
                {lang === "en" ? "Question" : "Вопрос"} {current + 1} / {questions.length}
              </span>
              <div className="tp-header-right">
                <span className="tp-answered">
                  {t("testPage.answered", { answered: answeredCount, total: questions.length })}
                </span>
                <span className={timerClass}>
                  {timeLeft <= 30
                    ? t("testPage.timerUrgent", { time: timerStr })
                    : t("testPage.timer", { time: timerStr })}
                </span>
              </div>
            </div>
            <div className="tp-progress-bg">
              <motion.div
                className="tp-progress-fill"
                animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          {/* ── Question card ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              className="tp-question-card"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{   opacity: 0, x: -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="tp-q-eyebrow">{lang === "en" ? "Question" : "Вопрос"} {current + 1}</p>
              <h2 className="tp-q-text">{q.question}</h2>

              <div className="tp-options">
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === i;
                  return (
                    <motion.button
                      key={i}
                      className={`tp-option${selected ? " tp-option-selected" : ""}`}
                      onClick={() => handleSelect(i)}
                      whileHover={{ scale: 1.008 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <span className={`tp-option-letter${selected ? " tp-letter-sel" : ""}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="tp-option-text">{opt}</span>
                      {selected && <span className="tp-option-check">✓</span>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="tp-nav">
            <button
              className="tp-btn-ghost"
              onClick={() => setCurrent(c => c - 1)}
              disabled={current === 0}
            >
              ← {lang === "en" ? "Back" : "Назад"}
            </button>

            <div className="tp-dots">
              {questions.map((qq, i) => (
                <button
                  key={i}
                  className={[
                    "tp-dot",
                    i === current ? "tp-dot-current" : "",
                    answers[qq.id] !== undefined ? "tp-dot-done" : "",
                  ].join(" ")}
                  onClick={() => setCurrent(i)}
                />
              ))}
            </div>

            {isLast ? (
              <button
                className={`tp-btn-submit${!allAnswered ? " tp-btn-disabled" : ""}`}
                onClick={handleSubmit}
                disabled={!allAnswered}
                title={!allAnswered ? `${lang === "en" ? "Answer all questions" : "Ответьте на все вопросы"} (${answeredCount}/${questions.length})` : ""}
              >
                {t("testPage.submit")} →
              </button>
            ) : (
              <button
                className="tp-btn-next"
                onClick={() => setCurrent(c => c + 1)}
              >
                {lang === "en" ? "Next" : "Далее"} →
              </button>
            )}
          </div>

          {isLast && !allAnswered && (
            <p className="tp-submit-hint">
              {lang === "en" ? "Answer all questions:" : "Ответьте на все вопросы:"} {answeredCount} / {questions.length}
            </p>
          )}
        </>
      ) : (
        /* ── Result screen ── */
        <motion.div
          className="tp-result"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Score card */}
          <div className="tp-result-card">
            <motion.div
              className="tp-score-circle"
              style={{ borderColor: grade.color }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 220 }}
            >
              <span className="tp-score-num" style={{ color: grade.color }}>{pct}%</span>
              <span className="tp-score-sub">{score}/{questions.length}</span>
            </motion.div>

            <div className="tp-result-info">
              {timedOut && <p className="tp-timed-out">{t("testPage.timedOut")}</p>}
              <span className="tp-grade-badge" style={{ background: grade.bg, color: grade.color }}>
                {grade.emoji} {grade.label}
              </span>
              <p className="tp-result-msg">
                {passed
                  ? (lang === "en" ? "Passed. This topic counts toward your progress." : "Зачёт получен. Тема засчитана в прогресс курса.")
                  : (lang === "en" ? "Below 75%. Review the lesson and try again." : "Результат ниже 75%. Повтори урок и попробуй снова.")}
              </p>
              <div className="tp-result-bar-bg">
                <motion.div
                  className="tp-result-bar-fill"
                  style={{ background: grade.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
                <div className="tp-result-bar-mark" />
              </div>
              <p className="tp-result-mark-label">75% — {lang === "en" ? "passing threshold" : "порог зачёта"}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="tp-result-actions">
            {wrongQs.length > 0 && (
              <button
                className={`tp-btn-review${showReview ? " active" : ""}`}
                onClick={() => setShowReview(v => !v)}
              >
                {showReview
                  ? (lang === "en" ? "Hide review" : "Скрыть разбор")
                  : `${lang === "en" ? "Review errors" : "Разбор ошибок"} (${wrongQs.length})`}
              </button>
            )}
            {!passed && thisLesson && (
              <Link to={`/lessons/${thisLesson.id}`} className="tp-btn-lesson">
                {lang === "en" ? "Review lesson" : "Повторить урок"}
              </Link>
            )}
            {passed && nextLesson && (
              <Link to={`/lessons/${nextLesson.id}`} className="tp-btn-primary">
                {lang === "en" ? "Next lesson →" : "Следующий урок →"}
              </Link>
            )}
            <button className="tp-btn-retry" onClick={handleRetry}>
              {lang === "en" ? "Retake" : "Пересдать"}
            </button>
            <button className="tp-btn-analytics" onClick={() => navigate("/analytics")}>
              {lang === "en" ? "Analytics →" : "Аналитика →"}
            </button>
          </div>

          {wrongQs.length === 0 && (
            <motion.p
              className="tp-perfect"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              🎉 {lang === "en" ? "All answers correct!" : "Все ответы верные!"}
            </motion.p>
          )}

          {/* Review section */}
          <AnimatePresence>
            {showReview && wrongQs.length > 0 && (
              <motion.div
                className="tp-review"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1,  y: 0 }}
                exit={{   opacity: 0,  y: -12 }}
                transition={{ duration: 0.28 }}
              >
                <h3 className="tp-review-title">{lang === "en" ? "Error review" : "Разбор ошибок"}</h3>
                {wrongQs.map(qq => (
                  <div key={qq.id} className="tp-review-card">
                    <p className="tp-review-q">{qq.id}. {qq.question}</p>
                    <div className="tp-review-row tp-review-wrong">
                      <span className="tp-review-icon">❌</span>
                      <div>
                        <span className="tp-review-label">{lang === "en" ? "Your answer" : "Ваш ответ"}</span>
                        <span className="tp-review-val">{qq.options[answers[qq.id]]}</span>
                      </div>
                    </div>
                    <div className="tp-review-row tp-review-right">
                      <span className="tp-review-icon">✅</span>
                      <div>
                        <span className="tp-review-label">{lang === "en" ? "Correct answer" : "Правильный ответ"}</span>
                        <span className="tp-review-val">{qq.options[qq.correct]}</span>
                      </div>
                    </div>
                    <div className="tp-review-explanation">
                      <span className="tp-review-exp-label">💡 {lang === "en" ? "Explanation" : "Объяснение"}</span>
                      <p className="tp-review-exp-text">{qq.explanation}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
