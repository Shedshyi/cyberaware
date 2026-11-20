// Единый слой данных.
// localStorage остаётся быстрым локальным кэшем (страницы читают его синхронно),
// а если пользователь вошёл в аккаунт, всё дополнительно пишется в Supabase.

import { supabase } from "./supabase";

const KEYS = {
  results: "testResults",
  lessons: "lessonRead",
  profile: "userProfile",
  interactions: "interactions",   // журнал обучающих ответов — вход нечёткой модели
  preTopics: "preTopics",         // входной тест по темам: { topic: {correct, total} }
};

const MAX_LOCAL_INTERACTIONS = 1000;

// Ключи, относящиеся к конкретному человеку: чистятся при выходе из аккаунта,
// чтобы на общем компьютере (например, в компьютерном классе) следующий участник
// не видел чужой прогресс.
const PERSONAL_KEYS = [KEYS.results, KEYS.lessons, KEYS.profile, KEYS.interactions, KEYS.preTopics, "gameState", "hgHiScore", "phishingRounds", "snCorrect"];

let currentUserId = null;
export function setCurrentUser(id) { currentUserId = id; }
export function getCurrentUserId() { return currentUserId; }

// ── localStorage helpers ─────────────────────────────────────
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватный режим */ }
}

function warn(where, error) {
  if (error) console.warn(`[store] ${where}:`, error.message || error);
}

/** Сообщает интерфейсу, что локальные данные изменились (шапка, карточки обновятся без опроса). */
export const STORE_EVENT = "cyberaware:store";
export function notifyStore(detail = {}) {
  try { window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail })); } catch { /* SSR / тесты */ }
}

// Колонка ещё не создана миграцией → повторяем запрос без новых полей,
// чтобы сайт работал и до применения 003_adaptive.sql.
const isMissingColumn = (e) => e && (e.code === "42703" || e.code === "PGRST204" || /column/i.test(e.message || ""));

// ── Чтение (синхронно, из кэша) ──────────────────────────────
export const getTestResults = () => readJSON(KEYS.results, {});
export const getLessonRead  = () => readJSON(KEYS.lessons, {});
export const getProfile     = () => readJSON(KEYS.profile, null);
export const getInteractions = () => readJSON(KEYS.interactions, []);
export const getPreTopics = () => readJSON(KEYS.preTopics, {});

/** Результат входного теста по темам — стартовая оценка знаний для адаптивности. */
export function savePreTopics(map) {
  writeJSON(KEYS.preTopics, map);
  notifyStore({ type: "preTopics" });
}

// ── События ──────────────────────────────────────────────────
export async function logEvent(type, payload = {}) {
  if (!supabase || !currentUserId) return;
  const { error } = await supabase.from("events").insert({ user_id: currentUserId, type, payload });
  warn(`logEvent(${type})`, error);
}

// ── Тесты ────────────────────────────────────────────────────
/**
 * @param {object} p
 * @param {string|number} p.testId
 * @param {number} p.score
 * @param {number} p.total
 * @param {{questionId:number, selected:number|null, isCorrect:boolean}[]} p.answers
 * @param {number} [p.durationSec]
 * @param {boolean} [p.timedOut]
 * @param {string} [p.lang]
 * @param {"pre"|"post"|"practice"} [p.phase]
 */
export async function saveTestResult({ testId, score, total, answers = [], durationSec, timedOut = false, lang, phase = "practice" }) {
  const date = new Date().toISOString();
  if (phase === "practice") {
    const prev = getTestResults();
    const attempts = (prev[testId] ? (prev[testId].attempts ?? 1) : 0) + 1;
    prev[testId] = { score, total, date, attempts };
    writeJSON(KEYS.results, prev);
  }

  if (!supabase || !currentUserId) return;

  const { data: attempt, error } = await supabase
    .from("test_attempts")
    .insert({
      user_id: currentUserId,
      test_id: String(testId),
      phase, score, total,
      duration_sec: durationSec ?? null,
      timed_out: timedOut,
      lang: lang ?? null,
    })
    .select("id")
    .single();
  if (error) { warn("saveTestResult", error); return { ok: false, error }; }

  if (answers.length) {
    const base = a => ({
      attempt_id: attempt.id,
      user_id: currentUserId,
      question_id: a.questionId,
      selected: a.selected ?? null,
      is_correct: a.isCorrect,
    });
    const rich = a => ({
      ...base(a),
      response_ms: Number.isFinite(a.responseMs) ? Math.round(a.responseMs) : null,
      hint_used: !!a.hintUsed,
      difficulty: a.difficulty ?? null,
    });
    let { error: aErr } = await supabase.from("answers").insert(answers.map(rich));
    if (isMissingColumn(aErr)) ({ error: aErr } = await supabase.from("answers").insert(answers.map(base)));
    warn("saveTestResult/answers", aErr);
  }
  return { ok: true };
}

// ── Обучающие взаимодействия (вход нечёткой модели) ──────────
/**
 * Один ответ в обучении: вопрос практического теста, раунд тренажёра и т.п.
 * Входной и итоговый тест сюда НЕ пишутся — это чистое измерение.
 * @param {{source:string, topic?:string, itemId:string|number, correct:boolean,
 *          responseMs?:number, hintUsed?:boolean, difficulty?:1|2|3}} r
 */
export async function logInteraction(r) {
  const row = {
    source: r.source,
    topic: r.topic ?? null,
    itemId: String(r.itemId),
    correct: !!r.correct,
    responseMs: Number.isFinite(r.responseMs) ? Math.round(r.responseMs) : null,
    hintUsed: !!r.hintUsed,
    difficulty: r.difficulty ?? null,
    at: new Date().toISOString(),
  };
  const log = getInteractions();
  log.push(row);
  writeJSON(KEYS.interactions, log.slice(-MAX_LOCAL_INTERACTIONS));
  notifyStore({ type: "interaction", row });

  if (!supabase || !currentUserId) return row;
  const { error } = await supabase.from("interactions").insert({
    user_id: currentUserId,
    source: row.source,
    topic: row.topic,
    item_id: row.itemId,
    correct: row.correct,
    response_ms: row.responseMs,
    hint_used: row.hintUsed,
    difficulty: row.difficulty,
  });
  warn("logInteraction", error);
  return row;
}

/** Назначает группу (экспериментальная / контрольная) при согласии — строго поровну, на стороне БД. */
export async function assignCohort() {
  if (!supabase || !currentUserId) return null;
  const { data, error } = await supabase.rpc("assign_cohort");
  warn("assignCohort", error);
  return error ? null : data;
}

/** Сохраняет ответы анкеты участника. */
export async function saveOnboarding(fields) {
  if (!supabase || !currentUserId) return { ok: false };
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ ...fields, consent: true, consent_at: now, onboarded_at: now })
    .eq("id", currentUserId);
  warn("saveOnboarding", error);
  return { ok: !error, error };
}

// ── Уроки ────────────────────────────────────────────────────
export function markLessonOpened(lessonId) {
  const prev = getLessonRead();
  const firstTime = !prev[lessonId];
  if (firstTime) {
    prev[lessonId] = new Date().toISOString();
    writeJSON(KEYS.lessons, prev);
  }
  logEvent("lesson_open", { lessonId, firstTime });
  return firstTime;
}

// ── Профиль ──────────────────────────────────────────────────
export async function saveProfile(profile) {
  writeJSON(KEYS.profile, profile);
  if (!supabase || !currentUserId) return;
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: profile.name, avatar_color: profile.color })
    .eq("id", currentUserId);
  warn("saveProfile", error);
}

// ── Синхронизация при входе / выходе ─────────────────────────
/** Подтягивает данные пользователя с сервера в локальный кэш. */
export async function hydrateFromServer(userId) {
  if (!supabase) return null;

  const [profileRes, attemptsRes, lessonsRes, interRes, preRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("test_attempts")
      .select("test_id, phase, score, total, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase.from("events")
      .select("payload, created_at")
      .eq("user_id", userId).eq("type", "lesson_open")
      .order("created_at", { ascending: true }),
    supabase.from("interactions")
      .select("source, topic, item_id, correct, response_ms, hint_used, difficulty, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(MAX_LOCAL_INTERACTIONS),
    supabase.from("answers")
      .select("question_id, is_correct, test_attempts!inner(phase)")
      .eq("user_id", userId).eq("test_attempts.phase", "pre"),
  ]);
  warn("hydrate/profile", profileRes.error);
  warn("hydrate/attempts", attemptsRes.error);
  warn("hydrate/lessons", lessonsRes.error);

  const remote = profileRes.data;

  if (preRes.data?.length) {
    const { ASSESSMENT } = await import("../research/assessmentData.js");
    const topicOf = Object.fromEntries(ASSESSMENT.ru.map(q => [q.id, q.topic]));
    const map = {};
    for (const a of preRes.data) {
      const t = topicOf[a.question_id];
      if (!t) continue;
      map[t] ??= { correct: 0, total: 0 };
      map[t].total += 1;
      map[t].correct += a.is_correct ? 1 : 0;
    }
    writeJSON(KEYS.preTopics, map);
  }

  if (interRes.data) {
    writeJSON(KEYS.interactions, interRes.data.map(r => ({
      source: r.source, topic: r.topic, itemId: r.item_id, correct: r.correct,
      responseMs: r.response_ms, hintUsed: r.hint_used, difficulty: r.difficulty, at: r.created_at,
    })));
  }

  // Последняя попытка по каждому тесту — так же, как работал локальный режим
  const research = { pre: null, post: null };
  if (attemptsRes.data) {
    const results = {};
    for (const a of attemptsRes.data) {
      if (a.phase === "practice") {
        const attempts = (results[a.test_id]?.attempts ?? 0) + 1;
        results[a.test_id] = { score: a.score, total: a.total, date: a.created_at, attempts };
      }
      else research[a.phase] = { score: a.score, total: a.total, date: a.created_at };
    }
    writeJSON(KEYS.results, results);
  }

  if (lessonsRes.data) {
    const read = {};
    for (const e of lessonsRes.data) {
      const id = e.payload?.lessonId;
      if (id && !read[id]) read[id] = e.created_at;
    }
    writeJSON(KEYS.lessons, read);
  }

  if (remote) {
    if (remote.display_name) {
      writeJSON(KEYS.profile, {
        name: remote.display_name,
        color: remote.avatar_color || "#6366f1",
        joined: remote.created_at,
      });
    } else {
      // Новый аккаунт: переносим имя/цвет, заданные до входа, если есть
      const local = getProfile();
      if (local?.name) await saveProfile(local);
      else localStorage.removeItem(KEYS.profile);
    }
  }
  notifyStore({ type: "hydrate" });
  return { profile: remote, research };
}

export function clearPersonalData() {
  for (const k of PERSONAL_KEYS) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
  notifyStore({ type: "clear" });
}
