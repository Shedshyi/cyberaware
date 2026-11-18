// Политика следующего шага. Запуск: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLearnerModel, nextStep, trainerParams } from "./learner.js";

const now = Date.parse("2026-11-18T12:00:00Z");
const at = (minAgo) => new Date(now - minAgo * 60000).toISOString();
const row = (topic, correct, sec, extra = {}) => ({ source: "practice", topic, itemId: "x", correct, responseMs: sec * 1000, hintUsed: false, difficulty: 2, at: at(5), ...extra });

test("новичок без данных: первый урок — самая слабая по входному тесту тема", () => {
  const m = buildLearnerModel({ preTopics: { basics: { correct: 2, total: 2 }, phishing: { correct: 0, total: 2 } } });
  const s = nextStep(m, { now });
  assert.equal(s.kind, "lesson");
  assert.equal(s.topic, "phishing");
  assert.equal(s.reason.key, "pre_weak");
});

test("урок прочитан, теста нет → практический тест этой темы", () => {
  const m = buildLearnerModel({ lessonRead: { basics: at(10) } });
  const s = nextStep(m, { now });
  assert.equal(s.kind, "test");
  assert.equal(s.to, "/test/1");
});

test("тест не сдан → повторить", () => {
  const m = buildLearnerModel({ lessonRead: { basics: at(30) }, testResults: { 1: { score: 2, total: 5 } } });
  const s = nextStep(m, { now });
  assert.equal(s.topic, "basics");
  assert.ok(["retest", "review"].includes(s.kind));
});

test("быстрые ошибки на сложных → режим «не спеши»", () => {
  const rows = [];
  for (let i = 0; i < 10; i++) rows.push(row("phishing", i % 3 !== 0, i % 3 === 0 ? 3 : 20, { difficulty: i % 3 === 0 ? 3 : 1 }));
  const m = buildLearnerModel({ interactions: rows });
  assert.equal(m.global.profile, "Guessing");
  assert.equal(nextStep(m, { now }).kind, "slow");
  assert.equal(trainerParams(m).timerSec, 20);
});

test("усталость учитывается, только если занимался недавно", () => {
  const rows = [true, true, true, true, true, true, false, false, false, false]
    .map((c, i) => row("wifi", c, 10 + i * 12, { at: at(3) }));
  const m = buildLearnerModel({ interactions: rows });
  assert.equal(m.global.profile, "Fatigued");
  assert.equal(nextStep(m, { now }).kind, "break");
  assert.notEqual(nextStep(m, { now: now + 3 * 3600 * 1000 }).kind, "break");
});

test("всё пройдено и итоговый открыт → итоговый тест", () => {
  const lessonRead = {}, testResults = {};
  ["basics","passwords","phishing","socials","malware","wifi","updates","privacy","recovery","summary"]
    .forEach((t, i) => { lessonRead[t] = at(60); testResults[i + 1] = { score: 5, total: 5 }; });
  const s = nextStep(buildLearnerModel({ lessonRead, testResults }), { now, postUnlocked: true });
  assert.equal(s.kind, "post");
});
