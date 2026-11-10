import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { getTestResults, saveTestResult } from "../../lib/store";
import { ASSESSMENT_TEST_ID, getAssessment } from "../../research/assessmentData";
import { RESEARCH } from "../../research/config";
import "../../research/research.css";

const pct = (r) => Math.round((r.score / r.total) * 100);

export default function AssessmentPage() {
  const { phase } = useParams(); // "pre" | "post"
  const { enabled, loading, user, profile, research, markAssessmentDone } = useAuth();
  const { lang } = useLanguage();
  const en = lang === "en";

  const questions = useMemo(() => getAssessment(lang), [lang]);
  const [started, setStarted]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});   // questionId -> индекс показанного варианта
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const startedAt = useRef(0);
  // Только время ответа — для описательной статистики. Ни подсказок, ни обратной связи.
  const shownAt = useRef({});
  const respMs  = useRef({});

  useEffect(() => {
    const qq = questions[current];
    if (started && qq && shownAt.current[qq.id] === undefined) shownAt.current[qq.id] = Date.now();
  }, [started, current, questions]);

  if (phase !== "pre" && phase !== "post") return <Navigate to="/" replace />;
  if (!enabled) return <Navigate to="/" replace />;
  if (loading || (user && !profile)) return <div className="rs-page" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile.consent) return <Navigate to="/research/start" replace />;

  const done = research?.[phase];
  const practiceDone = Object.keys(getTestResults()).length;
  const need = RESEARCH.postTestMinPracticeTests;

  // ── Уже сдан ──
  if (done) {
    const gain = phase === "post" && research.pre ? pct(done) - pct(research.pre) : null;
    return (
      <div className="rs-page">
        <motion.div className="rs-card rs-result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="rs-eyebrow">{phase === "pre" ? (en ? "Entry test" : "Входной тест") : (en ? "Final test" : "Итоговый тест")}</span>
          <div className="rs-big-score">{pct(done)}%</div>
          <p className="rs-lead" style={{ marginBottom: 6 }}>{done.score} / {done.total} {en ? "correct" : "верно"}</p>
          {gain !== null && (
            <span className={`rs-gain ${gain > 0 ? "rs-gain-up" : gain < 0 ? "rs-gain-down" : "rs-gain-flat"}`}>
              {gain > 0 ? "▲ +" : gain < 0 ? "▼ " : ""}{gain} {en ? "pp vs. entry test" : "п.п. к входному тесту"} ({pct(research.pre)}%)
            </span>
          )}
          <p className="rs-note" style={{ marginBottom: 20 }}>
            {phase === "pre"
              ? (en ? `The course is now open. The final test unlocks after ${need} practice tests.` : `Курс открыт. Итоговый тест откроется после ${need} практических тестов.`)
              : (en ? "Thank you for taking part in the study!" : "Спасибо за участие в исследовании!")}
          </p>
          <div className="rs-actions" style={{ justifyContent: "center" }}>
            <Link className="rs-btn rs-btn-primary" to={phase === "pre" ? "/lessons" : "/profile"}>
              {phase === "pre" ? (en ? "Start learning →" : "Начать обучение →") : (en ? "To profile →" : "В профиль →")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Итоговый тест ещё закрыт ──
  if (phase === "post" && (!research?.pre || practiceDone < need)) {
    return (
      <div className="rs-page">
        <div className="rs-card">
          <span className="rs-eyebrow">{en ? "Final test" : "Итоговый тест"}</span>
          <h1 className="rs-title">{en ? "Not available yet" : "Пока недоступен"}</h1>
          {!research?.pre ? (
            <p className="rs-lead">{en ? "Take the entry test first." : "Сначала пройди входной тест."}</p>
          ) : (
            <>
              <p className="rs-lead" style={{ marginBottom: 0 }}>{en
                ? `Complete at least ${need} practice tests after the lessons. Done: ${practiceDone} / ${need}.`
                : `Пройди хотя бы ${need} практических тестов после уроков. Пройдено: ${practiceDone} / ${need}.`}</p>
              <div className="rs-progress"><div style={{ width: `${Math.min(100, (practiceDone / need) * 100)}%` }} /></div>
            </>
          )}
          <div className="rs-actions" style={{ marginTop: 20 }}>
            <Link className="rs-btn rs-btn-primary" to={research?.pre ? "/lessons" : "/research/pre"}>
              {research?.pre ? (en ? "To lessons →" : "К урокам →") : (en ? "Entry test →" : "Входной тест →")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Вступительный экран ──
  if (!started) {
    return (
      <div className="rs-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="rs-eyebrow">{phase === "pre" ? (en ? "Step 2 of 3 · Entry test" : "Шаг 2 из 3 · Входной тест") : (en ? "Step 3 of 3 · Final test" : "Шаг 3 из 3 · Итоговый тест")}</span>
          <h1 className="rs-title">{phase === "pre" ? (en ? "Let's check your starting level" : "Проверим стартовый уровень") : (en ? "Let's see your progress" : "Посмотрим на прогресс")}</h1>
          <div className="rs-card">
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              <li>{en ? `${questions.length} questions, one attempt` : `${questions.length} вопросов, одна попытка`}</li>
              <li>{en ? "Answer honestly — if you don't know, pick the option that seems best" : "Отвечай честно: если не знаешь, выбери вариант, который кажется лучшим"}</li>
              <li>{en ? "Don't search the internet — this is not an exam, it measures the course" : "Не ищи ответы в интернете: это не экзамен, тест оценивает сам курс"}</li>
              <li>{en ? "Correct answers are not shown, so the final test stays fair" : "Правильные ответы не показываются, чтобы итоговый тест остался честным"}</li>
            </ul>
          </div>
          <button className="rs-btn rs-btn-primary" onClick={() => { startedAt.current = Date.now(); setStarted(true); }}>
            {en ? "Start →" : "Начать →"}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Прохождение ──
  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const isLast = current === questions.length - 1;

  const submit = async () => {
    if (!allAnswered || busy) return;
    setBusy(true); setError("");
    const rows = questions.map(qq => {
      const original = qq.order[answers[qq.id]];
      return { questionId: qq.id, selected: original, isCorrect: original === qq.correct, responseMs: respMs.current[qq.id] };
    });
    const score = rows.filter(r => r.isCorrect).length;
    const res = await saveTestResult({
      testId: ASSESSMENT_TEST_ID,
      phase,
      score,
      total: questions.length,
      answers: rows,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      lang,
    });
    if (!res?.ok) {
      setBusy(false);
      setError(en ? "Could not save the result. Check your connection and press again." : "Не удалось сохранить результат. Проверь интернет и нажми ещё раз.");
      return;
    }
    markAssessmentDone(phase, { score, total: questions.length, date: new Date().toISOString() });
  };

  return (
    <div className="tp-root">
      <div className="tp-header">
        <div className="tp-header-top">
          <span className="tp-back-link">{phase === "pre" ? (en ? "Entry test" : "Входной тест") : (en ? "Final test" : "Итоговый тест")}</span>
          <span className="tp-counter">{en ? "Question" : "Вопрос"} {current + 1} / {questions.length}</span>
          <div className="tp-header-right">
            <span className="tp-answered">{answeredCount} / {questions.length} {en ? "answered" : "отвечено"}</span>
          </div>
        </div>
        <div className="tp-progress-bg">
          <motion.div className="tp-progress-fill" animate={{ width: `${((current + 1) / questions.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="tp-question-card"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          <p className="tp-q-eyebrow">{en ? "Question" : "Вопрос"} {current + 1}</p>
          <h2 className="tp-q-text">{q.question}</h2>
          <div className="tp-options">
            {q.shownOptions.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button
                  key={i}
                  className={`tp-option${selected ? " tp-option-selected" : ""}`}
                  onClick={() => {
                    if (respMs.current[q.id] === undefined && shownAt.current[q.id] !== undefined) {
                      respMs.current[q.id] = Date.now() - shownAt.current[q.id];
                    }
                    setAnswers(a => ({ ...a, [q.id]: i }));
                    // Автопереход, только если участник за это время сам не ушёл на другой вопрос
                    const from = current;
                    if (!isLast) setTimeout(() => setCurrent(c => (c === from ? from + 1 : c)), 250);
                  }}
                >
                  <span className={`tp-option-letter${selected ? " tp-letter-sel" : ""}`}>{String.fromCharCode(65 + i)}</span>
                  <span className="tp-option-text">{opt}</span>
                  {selected && <span className="tp-option-check">✓</span>}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="tp-nav">
        <button className="tp-btn-ghost" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
          ← {en ? "Back" : "Назад"}
        </button>
        <div className="tp-dots">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              className={["tp-dot", i === current ? "tp-dot-current" : "", answers[qq.id] !== undefined ? "tp-dot-done" : ""].join(" ")}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
        {isLast ? (
          <button className={`tp-btn-submit${!allAnswered ? " tp-btn-disabled" : ""}`} onClick={submit} disabled={!allAnswered || busy}>
            {busy ? "…" : en ? "Finish →" : "Завершить →"}
          </button>
        ) : (
          <button className="tp-btn-next" onClick={() => setCurrent(c => c + 1)}>{en ? "Next" : "Далее"} →</button>
        )}
      </div>
      {isLast && !allAnswered && (
        <p className="tp-submit-hint">{en ? "Answer all questions:" : "Ответь на все вопросы:"} {answeredCount} / {questions.length}</p>
      )}
      {error && <p className="rs-error" style={{ textAlign: "center", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
