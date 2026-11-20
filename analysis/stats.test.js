import test from "node:test";
import assert from "node:assert/strict";
import * as S from "./stats.js";

const near = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("распределения совпадают с табличными значениями", () => {
  near(S.tTwoSided(2.0, 10), 0.07339);
  near(S.tQuantile(0.975, 10), 2.228139);
  near(S.normQuantile(0.975), 1.959964);
  near(S.fUpper(4.9646, 1, 10), 0.05);
  near(S.tCdf(-1.812461, 10), 0.05);
});

test("t-тесты", () => {
  const w = S.welchT([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
  near(w.t, -1.8974);
  near(w.df, 5.882, 1e-2);
  const p = S.pairedT([1, 2, 3, 4], [2, 4, 5, 7]);
  near(p.meanDiff, 2);
  near(p.t, 2 / (S.sd([1, 2, 2, 3]) / 2));
});

test("точный Уилкоксон и Манн–Уитни", () => {
  const w = S.wilcoxonSigned([0, 0, 0, 0, 0], [1, 2, 3, 4, 5]);
  near(w.p, 2 / 32, 1e-12);
  assert.equal(w.r, 1);
  const zeros = S.wilcoxonSigned([1, 2], [1, 2]);
  assert.equal(zeros.p, 1);
  const m = S.mannWhitney([4, 5, 6], [1, 2, 3]);
  assert.equal(m.U, 9);
  near(m.p, 2 / 20, 1e-12);
  assert.equal(m.r, 1);
  // Связки: равные группы → p = 1
  near(S.mannWhitney([1, 2, 2], [1, 2, 2]).p, 1, 1e-12);
});

test("ANCOVA восстанавливает эффект группы", () => {
  const pre = [10, 20, 30, 40, 50, 15, 25, 35, 45, 55];
  const group = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
  const noise = [0.3, -0.2, 0.1, -0.4, 0.2, -0.1, 0.4, -0.3, 0.2, -0.2];
  const post = pre.map((x, i) => 5 + 0.8 * x + 12 * group[i] + noise[i]);
  const a = S.ancova(pre, post, group);
  near(a.diff, 12, 0.5);
  near(a.slope, 0.8, 0.05);
  assert.ok(a.p < 0.001);
  assert.ok(a.partialEta2 > 0.9);
});

test("KR-20, Холм, минимальный эффект, Спирмен", () => {
  near(S.kr20([[1, 1], [1, 1], [0, 0], [0, 0]]), 1, 1e-12);
  assert.deepEqual(S.holm([0.01, 0.04, 0.03]).map((x) => +x.toFixed(4)), [0.03, 0.06, 0.06]);
  near(S.minDetectableD(10), 1.325, 0.01);
  near(S.spearman([1, 2, 3, 4], [10, 20, 30, 40]).rho, 1, 1e-12);
});

test("перестановки и бутстрэп воспроизводимы", () => {
  const g = [1, 1, 1, 1, 0, 0, 0, 0];
  const y = [9, 8, 9, 10, 1, 2, 1, 2];
  const stat = (lab) => S.mean(y.filter((_, i) => lab[i])) - S.mean(y.filter((_, i) => !lab[i]));
  const p1 = S.permutationP(g, stat, { reps: 2000, seed: 1 });
  assert.equal(p1, S.permutationP(g, stat, { reps: 2000, seed: 1 }));
  near(p1, 2 / 70, 0.02); // точный p = 2/C(8,4)
  const ci = S.bootstrapDiffCI([9, 8, 9, 10], [1, 2, 1, 2], { reps: 2000, seed: 1 });
  assert.ok(ci[0] > 6 && ci[1] < 9);
});

test("точный критерий Фишера", () => {
  // Классический пример «дегустация чая»: [[3,1],[1,3]] → p = 0.4857
  near(S.fisherExact([[3, 1], [1, 3]]), 0.4857);
  near(S.fisherExact([[2, 2], [2, 2]]), 1, 1e-9);
});
