// Геймификация в работе: хранение состояния, запись в журнал, события для интерфейса.
// Включается только в режиме с геймификацией (экспериментальная группа, гости, офлайн).

import { applyEvent, emptyState, dayKey, streak } from "./engine";
import { buildLearnerModel } from "../adaptive/learner";
import { supabase } from "../lib/supabase";
import { getInteractions, getLessonRead, getPreTopics, getTestResults, logEvent, notifyStore } from "../lib/store";
import { TOPIC_BY_TEST } from "../adaptive/items";

const KEY = "gameState";
export const GAME_EVENT = "cyberaware:game";

let enabled = true;
export const setGameEnabled = (on) => { enabled = !!on; };
export const isGameEnabled = () => enabled;

export function getGameState() {
  try { return { ...emptyState(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return emptyState(); }
}
function saveGameState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function topicLevelFn() {
  const model = buildLearnerModel({
    interactions: getInteractions(), testResults: getTestResults(),
    lessonRead: getLessonRead(), preTopics: getPreTopics(),
  });
  return (t) => model.topics[t]?.level ?? null;
}

/** Событие обучения → опыт, награды, дневная цель. Всё пишется в журнал. */
export function record(ev) {
  if (!enabled) return null;
  const today = dayKey();
  const res = applyEvent(getGameState(), { ...ev, today }, { topicLevel: topicLevelFn() });
  saveGameState(res.state);
  const snap = { total: res.state.xp, day: today, counters: res.state.counters };

  for (const g of res.gains) logEvent("xp_awarded", { reason: g.reason, amount: g.amount, topic: g.topic ?? null, ...snap });
  for (const b of res.newBadges) logEvent("badge_earned", { badge: b, ...snap });
  if (res.levelUp !== null) logEvent("level_up", { rank: res.levelUp, ...snap });
  if (res.goalMet) logEvent("daily_goal_met", { streak: res.streak, ...snap });

  if (res.gains.length || res.newBadges.length) {
    try { window.dispatchEvent(new CustomEvent(GAME_EVENT, { detail: res })); } catch { /* ignore */ }
    notifyStore({ type: "game" });
  }
  return res;
}

export const currentStreak = () => streak(getGameState());

/**
 * Восстановление состояния с сервера после входа: опыт и счётчики — из последнего события
 * опыта, дни и дневные цели — по датам событий, лучшие результаты — по попыткам тестов.
 */
export async function hydrateGame(userId) {
  if (!supabase || !userId) return;
  const [ev, att] = await Promise.all([
    supabase.from("events").select("type, payload, created_at")
      .eq("user_id", userId).in("type", ["xp_awarded", "badge_earned", "daily_goal_met"])
      .order("created_at", { ascending: true }),
    supabase.from("test_attempts").select("test_id, score, total, created_at")
      .eq("user_id", userId).eq("phase", "practice").order("created_at", { ascending: true }),
  ]);
  if (ev.error || !ev.data) return;
  const s = emptyState();
  for (const e of ev.data) {
    const p = e.payload || {};
    if (e.type === "xp_awarded") {
      s.days[p.day] = (s.days[p.day] || 0) + (p.amount || 0);
      if (Number.isFinite(p.total)) s.xp = p.total;
      if (p.counters) s.counters = p.counters;
    }
    if (e.type === "badge_earned" && p.badge) s.badges[p.badge] = p.day;
    if (e.type === "daily_goal_met" && p.day) s.goalDays[p.day] = true;
  }
  for (const a of att.data || []) {
    const topic = TOPIC_BY_TEST[a.test_id];
    if (!topic) continue;
    const pct = Math.round((a.score / a.total) * 100);
    s.best[topic] = Math.max(s.best[topic] ?? 0, pct);
    if (pct >= 75 && !s.passed[topic]) s.passed[topic] = a.created_at.slice(0, 10);
  }
  saveGameState(s);
  notifyStore({ type: "game" });
}

/** Общий прогресс команды экспериментальной группы (только сумма, без имён). */
export async function teamProgress() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("team_progress");
  return error ? null : data;
}
