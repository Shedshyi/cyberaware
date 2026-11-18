// Проверка модели против статьи ID137. Запуск: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { assess, inferFromSignals, PARAMS, RULES } from "./fuzzy.js";

// ── 1. Таблица III → таблица IV статьи ───────────────────────────────
// На вход — сигналы профилей из таблицы III, на выходе должны получиться
// уровень, профиль и уверенность из таблицы IV; сырые оценки — в пределах ±2.
const TABLE_III = {
  A: { WA: 0.91, GS: 0.00, HP: 0.00, FI: 0.00, SS: 0.08 },
  B: { WA: 0.64, GS: 0.67, HP: 0.43, FI: 0.11, SS: 0.31 },
  C: { WA: 0.22, GS: 0.00, HP: 2.10, FI: 0.78, SS: 0.14 },
};
const TABLE_IV = {
  A: { S: 82.4, C: 1.00, S_adj: 82.4, level: "Advanced",     profile: "Consistent" },
  B: { S: 61.7, C: 0.70, S_adj: 43.2, level: "Intermediate", profile: "Guessing" },
  C: { S: 28.3, C: 0.77, S_adj: 21.8, level: "Beginner",     profile: "Fatigued" },
};

for (const p of ["A", "B", "C"]) {
  test(`таблица IV, профиль ${p}`, () => {
    const r = inferFromSignals(TABLE_III[p]);
    const want = TABLE_IV[p];
    assert.equal(r.level, want.level);
    assert.equal(r.profile, want.profile);
    assert.equal(r.confidence, want.C);
    assert.ok(Math.abs(r.S - want.S) <= 2, `S = ${r.S}, в статье ${want.S}`);
    assert.ok(Math.abs(r.S_adj - want.S_adj) <= 2, `S_adj = ${r.S_adj}, в статье ${want.S_adj}`);
  });
}

// ── 2. Синтетические сессии по описанию профилей (раздел V статьи) ───
// 10 вопросов: 4 Easy, 3 Medium, 3 Hard.
const DIFFS = [1, 1, 2, 1, 2, 3, 1, 2, 3, 3];
const session = (rows) => rows.map(([correct, timeSec, hint], i) => ({ correct, timeSec, hint, difficulty: DIFFS[i] }));

test("профиль A (Consistent Advanced): всё верно, умеренное время, без подсказок", () => {
  const r = assess(session(DIFFS.map((d, i) => [true, 20 + (i % 3) * 5, false])));
  assert.equal(r.level, "Advanced");
  assert.equal(r.profile, "Consistent");
});

test("профиль B (Guessing Intermediate): 70% верно, сложные — быстро и мимо", () => {
  const r = assess(session([
    [true, 18, false], [true, 15, false], [true, 25, true], [true, 14, false], [false, 30, true],
    [false, 4, false], [true, 16, false], [true, 22, true], [false, 5, false], [true, 6, false],
  ]));
  assert.ok(r.signals.GS > 0.55, `угадывание в зоне High: GS = ${r.signals.GS}`);
  assert.equal(r.profile, "Guessing");
  assert.equal(r.level, "Intermediate");
  // Тот же результат по «сырой» точности (70%) выглядел бы как высокий уровень
  assert.ok(r.confidence < 1);
});

test("профиль C (Fatigued Beginner): точность падает, время растёт, много подсказок", () => {
  const r = assess(session([
    [true, 20, true], [false, 25, true], [true, 35, true], [false, 45, true], [true, 55, false],
    [true, 60, true], [false, 70, false], [false, 80, true], [false, 95, false], [false, 110, false],
  ]));
  assert.equal(r.level, "Beginner");
  assert.equal(r.profile, "Fatigued");
});

// ── 3. Правило безопасности K = 3 ────────────────────────────────────
test("три неверных подряд → Beginner, даже при хорошей точности остального", () => {
  const rows = DIFFS.map((d, i) => [!(i >= 3 && i <= 5), 20, false]);
  const r = assess(session(rows));
  assert.equal(r.override, true);
  assert.equal(r.level, "Beginner");
});

// ── 4. Структура модели совпадает со статьёй ─────────────────────────
test("20 правил, из них 7 — из таблицы II статьи", () => {
  assert.equal(RULES.length, 20);
  assert.deepEqual(RULES.filter(r => r.source === "paper").map(r => r.id).sort(),
    ["R1", "R10", "R11", "R2", "R4", "R5", "R6"]);
  assert.equal(PARAMS.ALPHA, 0.4);
  assert.equal(PARAMS.BETA, 0.3);
  assert.equal(PARAMS.W, 5);
  assert.equal(PARAMS.K, 3);
});

test("пустая сессия не падает", () => {
  const r = assess([]);
  assert.ok(["Beginner", "Intermediate", "Advanced"].includes(r.level));
});
