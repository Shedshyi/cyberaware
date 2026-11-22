import test from "node:test";
import assert from "node:assert/strict";
import { postGate, RESEARCH } from "./config.js";

const day = 864e5;
const pre = { pre: { date: "2026-11-20T10:00:00Z" } };
const t0 = Date.parse("2026-11-20T10:00:00Z");

test("итоговый тест: нужны практика и пауза после входного", () => {
  assert.equal(postGate({ research: pre, practiceDone: 5, now: t0 + day }).unlocked, false);
  assert.equal(postGate({ research: pre, practiceDone: 5, now: t0 + day }).daysLeft, RESEARCH.postMinDaysAfterPre - 1);
  assert.equal(postGate({ research: pre, practiceDone: 4, now: t0 + 10 * day }).unlocked, false);
  assert.equal(postGate({ research: pre, practiceDone: 5, now: t0 + RESEARCH.postMinDaysAfterPre * day }).unlocked, true);
});

test("тестовым аккаунтам пауза не нужна; без входного теста — закрыт", () => {
  assert.equal(postGate({ research: pre, practiceDone: 5, isTest: true, now: t0 + 60e3 }).unlocked, true);
  assert.equal(postGate({ research: { pre: null }, practiceDone: 9, isTest: true }).unlocked, false);
});

import { formFor, fallbackFormOrder, getAssessment } from "./assessmentData.js";

test("варианты теста: на входе и выходе разные", () => {
  assert.deepEqual([formFor("AB", "pre"), formFor("AB", "post")], ["A", "B"]);
  assert.deepEqual([formFor("BA", "pre"), formFor("BA", "post")], ["B", "A"]);
  assert.deepEqual([formFor(null, "pre"), formFor(null, "post")], ["A", "B"]);
  assert.ok(["AB", "BA"].includes(fallbackFormOrder("e3b0c442-98fc")));
  const a = getAssessment("ru", "A").map(q => q.id), b = getAssessment("ru", "B").map(q => q.id);
  assert.equal(a.length, 15);
  assert.equal(a.filter(id => b.includes(id)).length, 0, "варианты не пересекаются");
});
