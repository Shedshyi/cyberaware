import test from "node:test";
import assert from "node:assert/strict";
import { buildAdminRows, buildFunnel, cohortBalance, buildTimeline, relativeTime } from "./admin.js";

const prof = (id, extra = {}) => ({ id, role: "participant", consent: true, cohort: "control", cohort_assigned_at: "2026-11-20T10:00:00Z", created_at: "2026-11-20T09:00:00Z", is_test: false, ...extra });
const att = (user_id, phase, test_id, created_at = "2026-11-20T11:00:00Z") => ({ user_id, phase, test_id, score: 4, total: 5, created_at });

const data = {
  profiles: [
    prof("a", { cohort: "experimental" }),
    prof("b"),
    prof("c", { consent: false, cohort: null, cohort_assigned_at: null }),
    prof("d", { cohort: "experimental" }),
    prof("t", { is_test: true, cohort: "experimental" }),
    { id: "r", role: "researcher", consent: true, created_at: "2026-11-20T09:00:00Z" },
  ],
  attempts: [
    att("a", "pre", "assessment"), ...[1, 2, 3, 4, 5].map(i => att("a", "practice", String(i))), att("a", "post", "assessment", "2026-11-22T11:00:00Z"),
    att("b", "pre", "assessment"), att("b", "practice", "1"), att("b", "practice", "1"),
    att("d", "pre", "assessment"), ...[1, 2, 3, 4, 5].map(i => att("d", "practice", String(i))),
  ],
  events: [
    { user_id: "a", type: "lesson_open", payload: { lessonId: "phishing", firstTime: true }, created_at: "2026-11-21T08:00:00Z" },
    { user_id: "a", type: "xp_awarded", payload: { amount: 20 }, created_at: "2026-11-21T08:00:01Z" },
    { user_id: "a", type: "rec_shown", payload: {}, created_at: "2026-11-21T08:00:02Z" },
  ],
  interactions: [
    { user_id: "a", source: "trainer:hacker_game", correct: true, hint_used: false, created_at: "2026-11-21T09:00:00Z" },
    { user_id: "a", source: "trainer:hacker_game", correct: false, hint_used: false, created_at: "2026-11-21T09:01:00Z" },
  ],
};
const built = [{ id: "a", code: "P001" }, { id: "b", code: "P002" }, { id: "d", code: "P003" }];

test("шаги участников и разделение пулов", () => {
  const rows = buildAdminRows(data, built);
  const step = Object.fromEntries(rows.map(r => [r.id, r.step]));
  assert.deepEqual(step, { a: "done", b: "learning", c: "registered", d: "ready" });
  assert.equal(rows.find(r => r.id === "b").practiceDone, 1);
  assert.equal(rows.find(r => r.id === "c").cohort, null);
  assert.equal(rows.find(r => r.id === "a").lastSeen, "2026-11-22T11:00:00Z");
  const test = buildAdminRows(data, [], "test");
  assert.deepEqual(test.map(r => r.id), ["t"]);
});

test("воронка и баланс групп", () => {
  const rows = buildAdminRows(data, built);
  const f = Object.fromEntries(buildFunnel(rows).map(r => [r.step, r]));
  assert.equal(f.registered.total, 4);
  assert.equal(f.pre.total, 3);
  assert.equal(f.ready.total, 2);
  assert.equal(f.done.experimental, 1);
  assert.equal(f.registered.none, 1);
  assert.deepEqual(cohortBalance(rows), { experimental: 2, control: 1, diff: 1 });
});

test("хронология: дни, события, сводка ответов и опыта", () => {
  const tl = buildTimeline("a", data, "ru");
  assert.deepEqual(tl.map(d => d.date), ["2026-11-22", "2026-11-21", "2026-11-20"]);
  const d21 = tl[1];
  assert.match(d21.items[0].text, /Открыл урок: Фишинг \(впервые\)/);
  assert.equal(d21.xp, 20);
  assert.equal(d21.recs, 1);
  assert.deepEqual(d21.answers[0], { source: "trainer:hacker_game", label: "Hacker Game", n: 2, correct: 1, hints: 0 });
  assert.ok(tl[0].items.some(i => /Итоговый тест: 4\/5/.test(i.text)));
});

test("относительное время", () => {
  const now = new Date("2026-11-20T12:00:00Z").getTime();
  assert.equal(relativeTime("2026-11-20T11:30:00Z", "ru", now), "30 мин назад");
  assert.equal(relativeTime("2026-11-18T12:00:00Z", "en", now), "2 d ago");
});
