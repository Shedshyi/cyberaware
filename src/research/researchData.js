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

export async function loadResearchData() {
  const [profiles, attempts, answers, events] = await Promise.all([
    fetchAll(() => supabase.from("profiles").select("*").order("created_at")),
    fetchAll(() => supabase.from("test_attempts").select("*").order("created_at")),
    fetchAll(() => supabase.from("answers")
      .select("attempt_id, user_id, question_id, selected, is_correct, test_attempts!inner(phase, test_id)")
      .in("test_attempts.phase", ["pre", "post"])
      .order("id")),
    fetchAll(() => supabase.from("events").select("user_id, type, payload, created_at").order("created_at")),
  ]);
  return { profiles, attempts, answers, events };
}

const pct = (a) => (a ? Math.round((a.score / a.total) * 1000) / 10 : null);

/** Одна строка на участника — «широкий» формат, удобный для SPSS/Excel. */
export function buildParticipants({ profiles, attempts, events }) {
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
    }));
}

/** Все события (уроки, игры) с кодами участников. */
export function buildEventsLong(events, participants) {
  const codeOf = Object.fromEntries(participants.map(p => [p.id, p.code]));
  return events
    .filter(e => codeOf[e.user_id])
    .map(e => ({ participant: codeOf[e.user_id], type: e.type, created_at: e.created_at, payload: e.payload }));
}
