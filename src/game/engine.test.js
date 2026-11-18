// Геймификация. Запуск: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyEvent, emptyState, streak, medal, rankIndex, XP, DAILY_GOAL_XP } from "./engine.js";

const run = (events, start = emptyState()) => events.reduce((acc, ev) => applyEvent(acc.state, ev), { state: start });

test("первое открытие урока даёт опыт, повторное — нет", () => {
  const r = run([{ type: "lesson_open", topic: "basics", firstTime: true, today: "2026-11-18" },
                 { type: "lesson_open", topic: "basics", firstTime: false, today: "2026-11-18" }]);
  assert.equal(r.state.xp, XP.lesson_first_open);
});

test("тест: опыт за попытку и верные ответы, бонус за первую сдачу, опыт не отнимается", () => {
  const r1 = run([{ type: "practice_test", topic: "phishing", score: 2, total: 5, hints: 0, today: "2026-11-18" }]);
  assert.equal(r1.state.xp, XP.practice_done + 2 * XP.practice_correct);
  const r2 = applyEvent(r1.state, { type: "practice_test", topic: "phishing", score: 4, total: 5, hints: 0, today: "2026-11-18" });
  assert.ok(r2.gains.some(g => g.reason === "topic_passed_first"));
  assert.ok(r2.newBadges.includes("first_mission"));
  assert.ok(r2.newBadges.includes("comeback"), "пересдал тему, которая не получилась");
  const r3 = applyEvent(r2.state, { type: "practice_test", topic: "phishing", score: 0, total: 5, today: "2026-11-18" });
  assert.ok(r3.state.xp >= r2.state.xp, "плохой результат не уменьшает опыт");
  assert.equal(r3.state.best.phishing, 80, "лучший результат сохраняется");
});

test("дневная цель засчитывается один раз в день", () => {
  let s = emptyState();
  let met = 0;
  for (let i = 0; i < 6; i++) {
    const r = applyEvent(s, { type: "practice_test", topic: "wifi", score: 3, total: 5, today: "2026-11-18" });
    s = r.state; if (r.goalMet) met++;
  }
  assert.equal(met, 1);
  assert.ok(s.days["2026-11-18"] >= DAILY_GOAL_XP);
});

test("серия прощает один пропуск в неделю", () => {
  const s = emptyState();
  for (const d of ["2026-11-14", "2026-11-15", "2026-11-17", "2026-11-18"]) s.goalDays[d] = true; // 16-го пропуск
  assert.equal(streak(s, "2026-11-18"), 4);
  const s2 = emptyState();
  for (const d of ["2026-11-14", "2026-11-17", "2026-11-18"]) s2.goalDays[d] = true; // два дня подряд пропущены
  assert.equal(streak(s2, "2026-11-18"), 2);
});

test("медали: бронза за попытку, серебро за 75%, золото за Advanced или 100%", () => {
  const s = emptyState();
  s.best = { basics: 40, phishing: 80, wifi: 100 };
  assert.equal(medal(s, "basics"), "bronze");
  assert.equal(medal(s, "phishing"), "silver");
  assert.equal(medal(s, "phishing", { topicLevel: "Advanced" }), "gold");
  assert.equal(medal(s, "wifi"), "gold");
  assert.equal(medal(s, "updates", { lessonRead: true }), "started");
  assert.equal(medal(s, "updates"), null);
});

test("звание растёт с опытом", () => {
  assert.equal(rankIndex(0), 0);
  assert.equal(rankIndex(130), 1);
  assert.equal(rankIndex(5000), 5);
});
