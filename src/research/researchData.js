// Загрузка и подготовка данных для страницы исследователя.
import { supabase } from "../lib/supabase";
import { ASSESSMENT, ASSESSMENT_TEST_ID, TOPICS } from "./assessmentData";

const PAGE = 1000;

async function fetchAll(build) {
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < PAGE) return out;
  }
}

// Запрос, который может упасть, если миграция 003 ещё не применена: тогда — запасной вариант
async function fetchAllOr(build, fallback) {
  try { return await fetchAll(build); } catch { return fallback ? fetchAll(fallback) : []; }
}

export async function loadResearchData() {
  const answersQuery = (cols) => () => supabase.from("answers")
    .select(`${cols}, test_attempts!inner(phase, test_id)`)
    .in("test_attempts.phase", ["pre", "post"])
    .order("id");
  const [profiles, attempts, answers, events, interactions] = await Promise.all([
    fetchAll(() => supabase.from("profiles").select("*").order("created_at")),
    fetchAll(() => supabase.from("test_attempts").select("*").order("created_at")),
    fetchAllOr(answersQuery("attempt_id, user_id, question_id, selected, is_correct, response_ms"),
               answersQuery("attempt_id, user_id, question_id, selected, is_correct")),
    fetchAll(() => supabase.from("events").select("user_id, type, payload, created_at").order("created_at")),
    fetchAllOr(() => supabase.from("interactions")
      .select("user_id, source, topic, item_id, correct, response_ms, hint_used, difficulty, created_at")
      .order("created_at")),
  ]);
  return { profiles, attempts, answers, events, interactions };
}

const median = (xs) => {
  const v = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

const pct = (a) => (a ? Math.round((a.score / a.total) * 1000) / 10 : null);

/** Одна строка на участника — «широкий» формат, удобный для SPSS/Excel. */
export function buildParticipants({ profiles, attempts, events, interactions = [] }) {
  const participants = profiles.filter(p => p.role === "participant" && p.consent);
  return participants.map((p, i) => {
    const mine = attempts.filter(a => a.user_id === p.id);
    const pre  = mine.find(a => a.phase === "pre" && a.test_id === ASSESSMENT_TEST_ID);
    const post = mine.find(a => a.phase === "post" && a.test_id === ASSESSMENT_TEST_ID);
    const practice = mine.filter(a => a.phase === "practice");
    const practiceTests = new Set(practice.map(a => a.test_id));
    const myEvents = events.filter(e => e.user_id === p.id);
    const lessons = new Set(myEvents.filter(e => e.type === "lesson_open").map(e => e.payload?.lessonId));
    const games = myEvents.filter(e => e.type === "game_finish").length;
    const prePct = pct(pre), postPct = pct(post);
    const inter = interactions.filter(r => r.user_id === p.id);
    const ofType = (t) => myEvents.filter(e => e.type === t);
    const xpEvents = ofType("xp_awarded");
    const lastModel = ofType("model_assessment").filter(e => e.payload?.global).at(-1)?.payload?.global;
    const days = new Set([...myEvents, ...inter].map(e => e.created_at.slice(0, 10)));
    return {
      code: `P${String(i + 1).padStart(3, "0")}`,
      id: p.id,
      name: p.display_name || "",
      cohort: p.cohort,
      age: p.age,
      occupation: p.occupation,
      study_group: p.study_group || "",
      prior_training: p.prior_training,
      self_rating: p.self_rating,
      pre_score: pre?.score ?? null,
      pre_pct: prePct,
      pre_duration_sec: pre?.duration_sec ?? null,
      post_score: post?.score ?? null,
      post_pct: postPct,
      post_duration_sec: post?.duration_sec ?? null,
      gain_pct: prePct != null && postPct != null ? Math.round((postPct - prePct) * 10) / 10 : null,
      practice_tests_done: practiceTests.size,
      practice_attempts: practice.length,
      practice_avg_pct: practice.length ? Math.round(practice.reduce((s, a) => s + a.score / a.total, 0) / practice.length * 1000) / 10 : null,
      lessons_opened: lessons.size,
      games_played: games,
      // Обучающее поведение (обе группы)
      active_days: days.size,
      interactions_n: inter.length,
      interactions_correct_pct: inter.length ? Math.round(inter.filter(r => r.correct).length / inter.length * 1000) / 10 : null,
      hints_used: inter.filter(r => r.hint_used).length,
      median_response_sec: inter.length ? Math.round((median(inter.map(r => r.response_ms)) ?? 0) / 100) / 10 : null,
      // Адаптивность (только экспериментальная группа)
      recs_shown: ofType("rec_shown").length,
      recs_clicked: ofType("rec_clicked").length,
      adaptations: ofType("adaptation").length,
      model_level_last: lastModel?.level ?? null,
      model_profile_last: lastModel?.profile ?? null,
      model_S_adj_last: lastModel?.S_adj ?? null,
      // Геймификация (только экспериментальная группа)
      xp_total: xpEvents.length ? xpEvents.at(-1).payload?.total ?? null : 0,
      badges: ofType("badge_earned").length,
      rank_ups: ofType("level_up").length,
      daily_goals_met: ofType("daily_goal_met").length,
      max_streak: Math.max(0, ...ofType("daily_goal_met").map(e => e.payload?.streak || 0)),
      cohort_assigned_at: p.cohort_assigned_at ?? null,
      days_pre_to_post: pre && post ? Math.round((new Date(post.created_at) - new Date(pre.created_at)) / 864e5 * 10) / 10 : null,
      registered_at: p.created_at,
    };
  });
}

/** % верных ответов по темам до и после (только участники с обоими тестами). */
export function buildTopicStats(answers, completerIds) {
  const topicOf = Object.fromEntries(ASSESSMENT.ru.map(q => [q.id, q.topic]));
  const acc = {};
  for (const a of answers) {
    if (!completerIds.has(a.user_id)) continue;
    const topic = topicOf[a.question_id];
    if (!topic) continue;
    const phase = a.test_attempts.phase;
    acc[topic] ??= { pre: [0, 0], post: [0, 0] };
    acc[topic][phase][0] += a.is_correct ? 1 : 0;
    acc[topic][phase][1] += 1;
  }
  return Object.keys(TOPICS).map(t => ({
    topic: t,
    pre:  acc[t]?.pre[1]  ? (acc[t].pre[0]  / acc[t].pre[1])  * 100 : null,
    post: acc[t]?.post[1] ? (acc[t].post[0] / acc[t].post[1]) * 100 : null,
  }));
}

// ── CSV ──────────────────────────────────────────────────────
// Разделитель «;» и BOM — чтобы Excel с русской локалью открывал файл сразу по колонкам.
function toCSV(rows, columns) {
  const esc = (v) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const cols = columns || Object.keys(rows[0] || {});
  return "﻿" + [cols.join(";"), ...rows.map(r => cols.map(c => esc(r[c])).join(";"))].join("\r\n");
}

export function downloadCSV(filename, rows, columns) {
  const blob = new Blob([toCSV(rows, columns)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Ответы pre/post в «длинном» формате: строка = участник × фаза × вопрос. */
export function buildAnswersLong(answers, participants) {
  const codeOf = Object.fromEntries(participants.map(p => [p.id, p]));
  const topicOf = Object.fromEntries(ASSESSMENT.ru.map(q => [q.id, q.topic]));
  return answers
    .filter(a => codeOf[a.user_id])
    .map(a => ({
      participant: codeOf[a.user_id].code,
      cohort: codeOf[a.user_id].cohort,
      phase: a.test_attempts.phase,
      question_id: a.question_id,
      topic: topicOf[a.question_id] || "",
      selected: a.selected,
      correct: a.is_correct ? 1 : 0,
      response_ms: a.response_ms ?? null,
    }));
}

/** Обучающие взаимодействия: строка = один ответ в практике или тренажёре (вход модели). */
export function buildInteractionsLong(interactions, participants) {
  const byId = Object.fromEntries(participants.map(p => [p.id, p]));
  return interactions
    .filter(r => byId[r.user_id])
    .map(r => ({
      participant: byId[r.user_id].code, cohort: byId[r.user_id].cohort,
      source: r.source, topic: r.topic ?? "", item_id: r.item_id,
      correct: r.correct ? 1 : 0, response_ms: r.response_ms ?? null,
      hint_used: r.hint_used ? 1 : 0, difficulty: r.difficulty ?? null, created_at: r.created_at,
    }));
}

/** Все события (уроки, игры) с кодами участников. */
export function buildEventsLong(events, participants) {
  const codeOf = Object.fromEntries(participants.map(p => [p.id, p.code]));
  return events
    .filter(e => codeOf[e.user_id])
    .map(e => ({ participant: codeOf[e.user_id], type: e.type, created_at: e.created_at, payload: e.payload }));
}
