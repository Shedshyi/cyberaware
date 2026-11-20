import test from "node:test";
import assert from "node:assert/strict";
import { pickPractice, itemHistory, practiceLevel, attemptNumber, MIX, FIXED_MIX } from "./practice.js";
import testsRU from "../data/testsData.js";

const rng = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const countDiff = (items) => items.reduce((m, { q }) => ({ ...m, [q.difficulty]: (m[q.difficulty] || 0) + 1 }), {});

test("адаптивная смесь сложности зависит от уровня", () => {
  for (const level of ["Beginner", "Intermediate", "Advanced"]) {
    const bank = [1, 2, 3].flatMap(d => [0, 1, 2].map(k => ({ id: d * 10 + k, difficulty: d, options: ["a", "b", "c", "d"] })));
    const { items } = pickPractice({ bank, adaptive: true, level, rand: rng(3) });
    assert.equal(items.length, 5);
    const c = countDiff(items);
    for (const d of [1, 2, 3]) assert.equal(c[d] || 0, MIX[level][d], `${level}, сложность ${d}`);
    assert.equal(new Set(items.map(i => i.q.id)).size, 5, "без повторов");
  }
});

test("традиционный режим: фиксированная смесь независимо от уровня и истории", () => {
  const { items } = pickPractice({ bank: testsRU[4], adaptive: false, level: "Advanced", rand: rng(7) });
  const c = countDiff(items);
  for (const d of [1, 2, 3]) assert.equal(c[d] || 0, FIXED_MIX[d]);
});

test("адаптивно: сначала вопросы с прошлыми ошибками, потом новые", () => {
  const bank = testsRU[1];
  const mediums = bank.filter(q => q.difficulty === 2).map(q => q.id);
  const wrong = mediums[mediums.length - 1];
  const interactions = bank.filter(q => q.id !== wrong).map(q => ({ source: "practice", itemId: `1.${q.id}`, correct: true }))
    .concat([{ source: "practice", itemId: `1.${wrong}`, correct: false }]);
  const history = itemHistory(interactions, 1);
  for (let s = 1; s < 20; s++) {
    const { items } = pickPractice({ bank, adaptive: true, level: "Beginner", history, rand: rng(s) });
    assert.ok(items.some(i => i.q.id === wrong), `сид ${s}: вопрос с ошибкой выбран`);
  }
});

test("нехватка вопросов нужной сложности добирается из соседних уровней", () => {
  const bank = testsRU[1].filter(q => q.difficulty !== 3);
  const { items } = pickPractice({ bank, adaptive: true, level: "Advanced", rand: rng(2) });
  assert.equal(items.length, 5);
});

test("варианты перемешаны, но это перестановка исходных индексов", () => {
  const { items } = pickPractice({ bank: testsRU[2], adaptive: false, rand: rng(5) });
  for (const { q, order } of items) assert.deepEqual([...order].sort(), [...q.options.keys()]);
  const moved = items.some(({ order }) => order.join() !== "0,1,2,3");
  assert.ok(moved);
});

test("уровень: тема → входной тест → общий → по умолчанию", () => {
  assert.equal(practiceLevel({ topics: { phishing: { level: "Advanced" } } }, "phishing").level, "Advanced");
  assert.equal(practiceLevel({ topics: { phishing: { level: null, pre: "weak" } } }, "phishing").level, "Beginner");
  assert.equal(practiceLevel({ topics: { phishing: { level: null, pre: "unknown" } }, global: { level: "Advanced" } }, "phishing").source, "global");
  assert.equal(practiceLevel({}, "phishing").level, "Intermediate");
});

test("номер попытки и история", () => {
  assert.equal(attemptNumber({}, "3"), 1);
  assert.equal(attemptNumber({ 3: { score: 4, total: 5 } }, "3"), 2);
  assert.equal(attemptNumber({ 3: { score: 4, total: 5, attempts: 3 } }, "3"), 4);
  const h = itemHistory([{ source: "practice", itemId: "2.3", correct: false }, { source: "practice", itemId: "2.3", correct: true }, { source: "trainer:x", itemId: "2.4" }], 2);
  assert.deepEqual(h.get(3), { seen: 2, lastCorrect: true });
  assert.equal(h.has(4), false);
});
