// Проверка качества вопросов: правильный ответ не должен угадываться по длине или позиции,
// банки RU и EN должны совпадать, а сложность — быть распределена для адаптивного подбора.
import test from "node:test";
import assert from "node:assert/strict";
import testsRU from "./testsData.js";
import testsEN from "./testsData.en.js";
import { ASSESSMENT } from "../research/assessmentData.js";

const flat = (bank) => Object.entries(bank).flatMap(([t, qs]) => qs.map(q => ({ ...q, key: `${t}.${q.id}` })));

/** Правильный ответ длиннее всех остальных хотя бы на 10% — заметная подсказка. */
const clearlyLongest = (q) => {
  const L = q.options.map(o => o.length);
  return L[q.correct] >= 1.1 * Math.max(...L.filter((_, i) => i !== q.correct));
};
const lengthRatio = (q) => {
  const L = q.options.map(o => o.length);
  const others = L.filter((_, i) => i !== q.correct);
  return L[q.correct] / (others.reduce((a, b) => a + b, 0) / others.length);
};
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const SETS = [
  ["практика RU", flat(testsRU)], ["практика EN", flat(testsEN)],
  ["входной/итоговый RU", ASSESSMENT.ru.map(q => ({ ...q, key: q.id }))],
  ["входной/итоговый EN", ASSESSMENT.en.map(q => ({ ...q, key: q.id }))],
];

for (const [name, items] of SETS) {
  test(`${name}: правильный ответ не выделяется длиной`, () => {
    const cued = items.filter(clearlyLongest).map(q => q.key);
    // Допускается не больше 5% — например, вопрос «какой пароль надёжнее», где длина и есть суть
    assert.ok(cued.length <= Math.floor(items.length * 0.05), `явно самый длинный правильный ответ: ${cued.join(", ")}`);
    const m = median(items.map(lengthRatio));
    assert.ok(m <= 1.12, `медиана длины правильного к остальным = ${m.toFixed(2)}`);
  });

  test(`${name}: правильные ответы на разных позициях`, () => {
    const pos = [0, 0, 0, 0];
    for (const q of items) pos[q.correct]++;
    for (const n of pos) assert.ok(n / items.length >= 0.15 && n / items.length <= 0.35, `позиции A/B/C/D: ${pos.join("/")}`);
  });

  test(`${name}: структура вопросов`, () => {
    for (const q of items) {
      assert.equal(q.options.length, 4, `${q.key}: 4 варианта`);
      assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4, `${q.key}: индекс ответа`);
      assert.equal(new Set(q.options).size, 4, `${q.key}: варианты не повторяются`);
    }
  });
}

test("банки RU и EN совпадают по id, ответам и сложности", () => {
  for (const t of Object.keys(testsRU)) {
    assert.equal(testsEN[t].length, testsRU[t].length, `тест ${t}`);
    testsRU[t].forEach((q, i) => {
      const e = testsEN[t][i];
      assert.deepEqual([e.id, e.correct, e.difficulty], [q.id, q.correct, q.difficulty], `${t}.${q.id}`);
      assert.ok(q.explanation && e.explanation, `${t}.${q.id}: есть объяснение`);
    });
  }
  ASSESSMENT.ru.forEach((q, i) => {
    const e = ASSESSMENT.en[i];
    assert.deepEqual([e.id, e.topic, e.correct], [q.id, q.topic, q.correct], `вопрос ${q.id}`);
  });
});

test("в каждой теме практики есть все уровни сложности (для адаптивного подбора)", () => {
  for (const [t, qs] of Object.entries(testsRU)) {
    const n = { 1: 0, 2: 0, 3: 0 };
    for (const q of qs) n[q.difficulty]++;
    for (const d of [1, 2, 3]) assert.ok(n[d] >= 2, `тест ${t}: сложность ${d} — ${n[d]} вопр.`);
    assert.ok(qs.length >= 8, `тест ${t}: в банке ${qs.length} вопросов`);
  }
});

test("входной/итоговый: два параллельных варианта по 15, одинаковые по темам", () => {
  const forms = { A: ASSESSMENT.ru.filter(q => q.form === "A"), B: ASSESSMENT.ru.filter(q => q.form === "B") };
  assert.equal(forms.A.length + forms.B.length, ASSESSMENT.ru.length, "у каждого вопроса есть вариант");
  const topics = (qs) => qs.reduce((m, q) => ({ ...m, [q.topic]: (m[q.topic] || 0) + 1 }), {});
  for (const f of ["A", "B"]) {
    assert.equal(forms[f].length, 15, `вариант ${f}`);
    assert.equal(Object.keys(topics(forms[f])).length, 10, `вариант ${f}: все 10 тем`);
    const pos = [0, 0, 0, 0];
    for (const q of forms[f]) pos[q.correct]++;
    for (const n of pos) assert.ok(n >= 2 && n <= 6, `вариант ${f}: позиции ${pos.join("/")}`);
  }
  assert.deepEqual(topics(forms.A), topics(forms.B), "темы в вариантах совпадают");
  assert.ok(ASSESSMENT.ru.every(q => q.id > 200), "новые id начинаются с 201");
  ASSESSMENT.ru.forEach((q, i) => assert.equal(ASSESSMENT.en[i].form, q.form, `вариант вопроса ${q.id} в EN`));
});
