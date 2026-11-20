import test from "node:test";
import assert from "node:assert/strict";
import { analyze, parseCSV } from "./analyze.js";
import { makeDemo, toCSV } from "./demo-data.js";

test("CSV: BOM, «;», кавычки и JSON внутри ячейки", () => {
  const text = '﻿code;payload;n;flag\r\nP001;"{""a"":1;""b"":2}";3.5;true\r\nP002;;;false\r\n';
  const rows = parseCSV(text);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].payload, '{"a":1;"b":2}');
  assert.equal(rows[0].n, 3.5);
  assert.equal(rows[0].flag, true);
  assert.equal(rows[1].n, null);
});

test("анализ на синтетике находит заложенный эффект и считает выбывших", () => {
  const demo = makeDemo({ nPerGroup: 12, effect: 20, seed: 3 });
  const back = { participants: parseCSV(toCSV(demo.participants)), answers: parseCSV(toCSV(demo.answers)) };
  const { markdown, result } = analyze(back);
  assert.equal(result.nE, 12);
  assert.equal(result.nC, 12);
  assert.ok(result.ancova.diff > 8, `diff = ${result.ancova.diff}`);
  assert.ok(result.ancova.p < 0.05);
  assert.match(markdown, /Выбыли после входного теста/);
  assert.match(markdown, /Следов экспериментальных функций в контрольной группе нет/);
});

test("без эффекта ANCOVA обычно не значима, а при малой выборке тесты не запускаются", () => {
  const { result } = analyze(makeDemo({ nPerGroup: 12, effect: 0, seed: 11 }));
  assert.ok(Math.abs(result.ancova.diff) < 10);
  const tiny = analyze(makeDemo({ nPerGroup: 2, effect: 0, dropouts: 0 }));
  assert.equal(tiny.result.ancova, undefined);
  assert.match(tiny.markdown, /Ниже только описательная статистика/);
});

test("утечка в контрольную группу попадает в отчёт", () => {
  const demo = makeDemo({ nPerGroup: 5, seed: 5 });
  demo.participants.find((p) => p.cohort === "control").xp_total = 20;
  assert.match(analyze(demo).markdown, /следы экспериментальных функций/);
});
