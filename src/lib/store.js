// Единый слой данных.
// localStorage остаётся быстрым локальным кэшем (страницы читают его синхронно),
// а если пользователь вошёл в аккаунт, всё дополнительно пишется в Supabase.

import { supabase } from "./supabase";

const KEYS = {
  results: "testResults",
  lessons: "lessonRead",
  profile: "userProfile",
};

// Ключи, относящиеся к конкретному человеку: чистятся при выходе из аккаунта,
// чтобы на общем компьютере (например, в компьютерном классе) следующий участник
// не видел чужой прогресс.
const PERSONAL_KEYS = [KEYS.results, KEYS.lessons, KEYS.profile, "hgHiScore", "phishingRounds", "snCorrect"];

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

// ── Чтение (синхронно, из кэша) ──────────────────────────────
export const getTestResults = () => readJSON(KEYS.results, {});
export const getLessonRead  = () => readJSON(KEYS.lessons, {});
export const getProfile     = () => readJSON(KEYS.profile, null);

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
    prev[testId] = { score, total, date };
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
    const rows = answers.map(a => ({
      attempt_id: attempt.id,
      user_id: currentUserId,
      question_id: a.questionId,
      selected: a.selected ?? null,
      is_correct: a.isCorrect,
    }));
    const { error: aErr } = await supabase.from("answers").insert(rows);
    warn("saveTestResult/answers", aErr);
  }
  return { ok: true };
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

  const [profileRes, attemptsRes, lessonsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("test_attempts")
      .select("test_id, phase, score, total, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase.from("events")
      .select("payload, created_at")
      .eq("user_id", userId).eq("type", "lesson_open")
      .order("created_at", { ascending: true }),
  ]);
  warn("hydrate/profile", profileRes.error);
  warn("hydrate/attempts", attemptsRes.error);
  warn("hydrate/lessons", lessonsRes.error);

  const remote = profileRes.data;

  // Последняя попытка по каждому тесту — так же, как работал локальный режим
  const research = { pre: null, post: null };
  if (attemptsRes.data) {
    const results = {};
    for (const a of attemptsRes.data) {
      if (a.phase === "practice") results[a.test_id] = { score: a.score, total: a.total, date: a.created_at };
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
  return { profile: remote, research };
}

export function clearPersonalData() {
  for (const k of PERSONAL_KEYS) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
}
