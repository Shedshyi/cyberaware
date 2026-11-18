// Модель ученика и политика «следующего шага».
//
// Чистые функции без React и без хранилища: на вход — журнал взаимодействий,
// результаты практических тестов, прочитанные уроки и результат входного теста по темам;
// на выход — оценка по каждой теме, общий поведенческий профиль и ОДИН следующий шаг
// с причиной, понятной человеку.

import { assess } from "./fuzzy.js";
import { TOPIC_ORDER, TEST_BY_TOPIC } from "./items.js";

export const MIN_OBS_FOR_TOPIC = 3;     // меньше ответов по теме — модель тему не оценивает
export const PASS_PCT = 75;             // зачёт практического теста (как в курсе)
export const FATIGUE_WINDOW_MIN = 20;   // «устал» имеет смысл, только если занимался недавно

/** Взаимодействие из журнала → наблюдение модели. */
export const toObservation = (r) => ({
  correct: !!r.correct,
  timeSec: Number.isFinite(r.responseMs) ? r.responseMs / 1000 : undefined,
  hint: !!r.hintUsed,
  difficulty: r.difficulty ?? 2,
});

/** Что известно по входному тесту: 2 вопроса на тему → known / partial / weak / unknown. */
export function preStatus(preTopics, topic) {
  const p = preTopics?.[topic];
  if (!p || !p.total) return "unknown";
  if (p.correct === p.total) return "known";
  if (p.correct === 0) return "weak";
  return "partial";
}

/**
 * @param {object} input
 * @param {Array} input.interactions  журнал (store.getInteractions())
 * @param {object} input.testResults  { [testId]: {score,total,date} }
 * @param {object} input.lessonRead   { [lessonId]: isoDate }
 * @param {object} input.preTopics    { [topic]: {correct,total} } — из входного теста
 */
export function buildLearnerModel({ interactions = [], testResults = {}, lessonRead = {}, preTopics = {} }) {
  const topics = {};
  for (const topic of TOPIC_ORDER) {
    const obs = interactions.filter(r => r.topic === topic).map(toObservation);
    const test = testResults[TEST_BY_TOPIC[topic]];
    const testPct = test ? Math.round((test.score / test.total) * 100) : null;
    const assessment = obs.length >= MIN_OBS_FOR_TOPIC ? assess(obs) : null;
    topics[topic] = {
      topic,
      n: obs.length,
      lessonRead: !!lessonRead[topic],
      testPct,
      pre: preStatus(preTopics, topic),
      assessment,                                      // null, пока мало данных
      level: assessment?.level ?? null,
      profile: assessment?.profile ?? null,
      mastery: assessment ? assessment.S_adj / 100 : null,
    };
  }
  const all = interactions.map(toObservation);
  const global = all.length >= MIN_OBS_FOR_TOPIC ? assess(all) : null;
  const lastAt = interactions.length ? Date.parse(interactions[interactions.length - 1].at) : null;
  return { topics, global, lastAt, total: interactions.length };
}

// ── Политика следующего шага ─────────────────────────────────────────
// Возвращает ровно один шаг: { kind, topic?, to, reason: { key, params } }.
// Приоритет: сначала поведение (усталость, угадывание, подсказки), потом знания.
// Слабые по входному тесту темы идут раньше, известные — позже.

const PRE_RANK = { weak: 0, unknown: 1, partial: 2, known: 3 };

export function nextStep(model, { now = Date.now(), postUnlocked = false, postDone = false } = {}) {
  const { topics, global, lastAt } = model;
  const list = TOPIC_ORDER.map(t => topics[t]);
  const recent = lastAt && now - lastAt < FATIGUE_WINDOW_MIN * 60 * 1000;

  // 1. Поведение по последним ответам
  if (global && recent && global.profile === "Fatigued") {
    return { kind: "break", to: "/profile", reason: { key: "fatigued" } };
  }
  if (global && global.profile === "Guessing") {
    const t = pickBy(list, x => x.profile === "Guessing") || pickBy(list, x => x.assessment);
    if (t) return { kind: "slow", topic: t.topic, to: `/test/${TEST_BY_TOPIC[t.topic]}`, reason: { key: "guessing", params: { topic: t.topic } } };
  }
  if (global && global.profile === "Hint-Dependent") {
    const t = pickBy(list, x => x.profile === "Hint-Dependent") || pickBy(list, x => x.assessment);
    if (t) return { kind: "no_hints", topic: t.topic, to: `/test/${TEST_BY_TOPIC[t.topic]}`, reason: { key: "hints", params: { topic: t.topic } } };
  }

  // 2. Тема, где модель видит слабое место (Beginner) или тест не сдан
  const weak = list
    .filter(x => x.level === "Beginner" || (x.testPct !== null && x.testPct < PASS_PCT))
    .sort((a, b) => (a.mastery ?? a.testPct / 100) - (b.mastery ?? b.testPct / 100))[0];
  if (weak) {
    const key = weak.level === "Beginner" ? `weak_${(weak.profile || "consistent").toLowerCase()}` : "weak_score";
    return weak.lessonRead && weak.testPct !== null && weak.level !== "Beginner"
      ? { kind: "retest", topic: weak.topic, to: `/test/${TEST_BY_TOPIC[weak.topic]}`, reason: { key, params: { topic: weak.topic, pct: weak.testPct } } }
      : { kind: "review", topic: weak.topic, to: `/lessons/${weak.topic}`, reason: { key, params: { topic: weak.topic, pct: weak.testPct } } };
  }

  // 3. Урок прочитан, а тест ещё не пройден
  const untested = list.find(x => x.lessonRead && x.testPct === null);
  if (untested) {
    return { kind: "test", topic: untested.topic, to: `/test/${TEST_BY_TOPIC[untested.topic]}`, reason: { key: "lesson_done", params: { topic: untested.topic } } };
  }

  // 4. Следующий урок: сначала слабые по входному тесту
  const unread = list.filter(x => !x.lessonRead)
    .sort((a, b) => PRE_RANK[a.pre] - PRE_RANK[b.pre] || TOPIC_ORDER.indexOf(a.topic) - TOPIC_ORDER.indexOf(b.topic))[0];
  if (unread) {
    return { kind: "lesson", topic: unread.topic, to: `/lessons/${unread.topic}`, reason: { key: `pre_${unread.pre}`, params: { topic: unread.topic } } };
  }

  // 5. Всё пройдено
  if (postUnlocked && !postDone) return { kind: "post", to: "/research/post", reason: { key: "post_ready" } };
  if (global && global.profile === "Stagnating") return { kind: "challenge", to: "/hacker-game", reason: { key: "stagnating" } };
  return { kind: "challenge", to: "/hacker-game", reason: { key: "all_done" } };
}

function pickBy(list, pred) {
  return list.filter(pred).sort((a, b) => (a.mastery ?? 1) - (b.mastery ?? 1))[0] || null;
}

// ── Подбор сложности тренажёра ───────────────────────────────────────
/**
 * Параметры раунда Hacker Game под ученика.
 * Beginner — больше лёгких, Advanced — больше сложных; Guessing — дольше таймер
 * («не спеши»), Fatigued — короче сессия.
 */
export function trainerParams(model, topic = "phishing") {
  const t = model.topics[topic];
  const level = t?.level ?? model.global?.level ?? "Intermediate";
  const profile = model.global?.profile ?? "Consistent";
  const mix = {
    Beginner:     { 1: 0.5,  2: 0.35, 3: 0.15 },
    Intermediate: { 1: 0.3,  2: 0.4,  3: 0.3 },
    Advanced:     { 1: 0.15, 2: 0.35, 3: 0.5 },
  }[level];
  return {
    level,
    profile,
    mix,
    timerSec: profile === "Guessing" ? 20 : 12,
    rounds: profile === "Fatigued" ? 5 : 8,     // обычная игра — 8 раундов
  };
}
