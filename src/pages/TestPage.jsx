import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import testsDataRU from "../data/testsData";
import testsDataEN from "../data/testsData.en";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import { useLanguage } from "../i18n/LanguageContext";
import { logInteraction, saveTestResult, logEvent, getInteractions, getTestResults } from "../lib/store";
import { TOPIC_BY_TEST } from "../adaptive/items";
import { pickPractice, itemHistory, practiceLevel, attemptNumber, REVEAL_FROM_ATTEMPT } from "../adaptive/practice";
import { useLearner } from "../adaptive/useLearner";
import NextStepCard from "../components/NextStepCard";
import { useExperience } from "../research/experience";
import { logModelSnapshot } from "../adaptive/snapshot";
import { record } from "../game/game";

const TIMER_SEC = 180;

// Отдельный экземпляр на каждый тест: без key состояние (ответы, результат)
// переезжало бы при переходе /test/1 → /test/2.
export default function TestPageRoute() {
  const { id } = useParams();
  return <TestPage key={id} />;
}

function TestPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { t, lang } = useLanguage();

  const testsData = lang === "en" ? testsDataEN : testsDataRU;
  const lessons   = lang === "en" ? lessonsEN   : lessonsRU;

  const { features } = useExperience();
  const { model } = useLearner();

  // Подбор 5 вопросов из банка темы (src/adaptive/practice.js). Выбор делается по русскому
  // банку и хранится как id, поэтому смена языка во время теста не меняет вопросы.
  const makePick = () => {
    const { level, source } = practiceLevel(model, TOPIC_BY_TEST[id]);
    const { items, mix } = pickPractice({
      bank: testsDataRU[id] || [],
      adaptive: features.adaptive,
      level,
      history: itemHistory(getInteractions(), id),
    });
    return {
      ids: items.map(i => i.q.id),
      orders: Object.fromEntries(items.map(i => [i.q.id, i.order])),
      level, source, mix,
      attempt: attemptNumber(getTestResults(), id),
    };
  };
  const [pick, setPick] = useState(makePick);
  const questions = useMemo(
    () => pick.ids.map(qid => (testsData[id] || []).find(q => q.id === qid)).filter(Boolean),
    [pick, testsData, id],
  );
  const reveal = pick.attempt >= REVEAL_FROM_ATTEMPT;

  useEffect(() => {
    if (features.adaptive) {
      logEvent("adaptation", { trainer: "practice", test: id, level: pick.level, source: pick.source, mix: pick.mix, attempt: pick.attempt });
    }
  }, [pick]); // eslint-disable-line react-hooks/exhaustive-deps

  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [score,      setScore]      = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(TIMER_SEC);
  const [timedOut,   setTimedOut]   = useState(false);
  const [eliminated, setEliminated] = useState({});   // questionId -> индекс убранного подсказкой варианта

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const startedAt = useRef(Date.now());
  // Поведенческие данные по вопросу (входы модели): когда вопрос впервые показан,
  // сколько мс прошло до первого выбора, была ли подсказка.
  const shownAt = useRef({});
  const respMs  = useRef({});
  const hintsUsed = useRef({});

  const persist = (a, s, timedOut) => {
    const topic = lessons.find(l => l.testPath === `/test/${id}`)?.id ?? null;
    const rows = questions.map(q => ({
      questionId: q.id,
      selected: a[q.id] ?? null,
      isCorrect: a[q.id] === q.correct,
      responseMs: respMs.current[q.id],
      hintUsed: !!hintsUsed.current[q.id],
      difficulty: q.difficulty ?? 2,
    }));
    saveTestResult({
      testId: id,
      score: s,
      total: questions.length,
      answers: rows,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      timedOut,
      lang,
    });
    for (const r of rows) {
      if (r.selected === null) continue;
      logInteraction({
        source: "practice", topic, itemId: `${id}.${r.questionId}`, correct: r.isCorrect,
        responseMs: r.responseMs, hintUsed: r.hintUsed, difficulty: r.difficulty,
      });
    }
    if (features.adaptive) logModelSnapshot(`practice_test_${id}`);
    record({ type: "practice_test", topic, score: s, total: questions.length, hints: rows.filter(r => r.hintUsed).length });
  };

  useEffect(() => {
    const q = questions[current];
    if (!submitted && q && shownAt.current[q.id] === undefined) shownAt.current[q.id] = Date.now();
  }, [current, submitted, questions]);

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
      persist(a, s, true);
    }
  }, [timeLeft, submitted, id, questions]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Подсказка убирает один неверный вариант (не выбранный сейчас). Выбор детерминирован id вопроса.
  const takeHint = () => {
    if (submitted || eliminated[q.id] !== undefined) return;
    const wrong = q.options.map((_, i) => i).filter(i => i !== q.correct && i !== answers[q.id]);
    if (!wrong.length) return;
    hintsUsed.current[q.id] = true;
    setEliminated(e => ({ ...e, [q.id]: wrong[q.id % wrong.length] }));
  };

  const handleSelect = (optIdx) => {
    if (submitted) return;
    if (respMs.current[q.id] === undefined && shownAt.current[q.id] !== undefined) {
      respMs.current[q.id] = Date.now() - shownAt.current[q.id];
    }
    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    let s = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct) s++; });
    setScore(s);
    setSubmitted(true);
    persist(answers, s, false);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setShowReview(false);
    setScore(0);
    setTimeLeft(TIMER_SEC);
    setTimedOut(false);
    startedAt.current = Date.now();
    shownAt.current = {}; respMs.current = {}; hintsUsed.current = {};
    setEliminated({});
    setPick(makePick());   // новая попытка — новые вопросы из банка, номер попытки +1
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
                {(pick.orders[q.id] || [...q.options.keys()]).map((i, pos) => {
                  const opt = q.options[i];
                  const selected = answers[q.id] === i;
                  const gone = eliminated[q.id] === i;
                  return (
                    <motion.button
                      key={i}
                      className={`tp-option${selected ? " tp-option-selected" : ""}${gone ? " tp-option-gone" : ""}`}
                      onClick={() => !gone && handleSelect(i)}
                      disabled={gone}
                      aria-disabled={gone}
                      whileHover={{ scale: 1.008 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <span className={`tp-option-letter${selected ? " tp-letter-sel" : ""}`}>
                        {String.fromCharCode(65 + pos)}
                      </span>
                      <span className="tp-option-text">{opt}</span>
                      {selected && <span className="tp-option-check">✓</span>}
                    </motion.button>
                  );
                })}
              </div>
              {features.hints && (
                <div className="tp-hint-row">
                  {eliminated[q.id] === undefined ? (
                    <button type="button" className="tp-hint-btn" onClick={takeHint}>
                      💡 {lang === "en" ? "Hint: remove one wrong option" : "Подсказка: убрать один неверный вариант"}
                    </button>
                  ) : (
                    <span className="tp-hint-used">
                      {lang === "en" ? "Hint used — one wrong option removed" : "Подсказка использована — один неверный вариант убран"}
                    </span>
                  )}
                </div>
              )}
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
          <NextStepCard placement="test_result" compact />

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
                {!reveal && (
                  <p className="tp-review-locked">{lang === "en"
                    ? "Correct answers and explanations open from your next attempt. For now, re-read the lesson and try again: you'll get a new set of questions."
                    : "Правильные ответы и объяснения откроются со следующей попытки. Пока перечитай урок и попробуй снова: вопросы будут другие."}</p>
                )}
                {wrongQs.map(qq => (
                  <div key={qq.id} className="tp-review-card">
                    <p className="tp-review-q">{questions.indexOf(qq) + 1}. {qq.question}</p>
                    <div className="tp-review-row tp-review-wrong">
                      <span className="tp-review-icon">❌</span>
                      <div>
                        <span className="tp-review-label">{lang === "en" ? "Your answer" : "Ваш ответ"}</span>
                        <span className="tp-review-val">{qq.options[answers[qq.id]]}</span>
                      </div>
                    </div>
                    {reveal && (
                      <>
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
                      </>
                    )}
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
