// Нечёткая модель поведенческой оценки (Jambul & Akhitova, IEEE DG 2026, Paper ID137).
//
// Пять слоёв, как в статье:
//   1. Наблюдение: на каждый ответ x1 правильность, x2 время (с), x3 подсказка, x4 сложность (1–3).
//   2. Нормализация и скользящее окно: время min-max в [0, 120] с отсечением; окно W = 5.
//   3. Поведенческие сигналы: WA, GS, HP, FI, SS.
//   4. Вывод Мамдани: треугольные функции принадлежности (табл. I), 20 правил,
//      агрегация max, импликация min, дефаззификация центроидом → S ∈ [0, 100].
//   5. Поправка на уверенность: C = 1 − α·GS − β·FI (α = 0,4, β = 0,3), S_adj = S·C;
//      правило безопасности: K = 3 и более неверных подряд → Beginner.
//
// Что взято из статьи дословно, а что достроено, помечено ниже меткой [статья] / [достроено].
// Достроенное нужно, потому что в статье нет полной базы правил, выходных функций
// принадлежности, порогов уровней и точных формул FI и SS.

export const PARAMS = {
  N: 10,            // [статья] длина сессии для оценки
  W: 5,             // [статья] скользящее окно для FI и SS
  T_MAX: 120,       // [статья] нормализация времени в [0, 120] с
  ALPHA: 0.4,       // [статья] вес угадывания в поправке
  BETA: 0.3,        // [статья] вес усталости в поправке
  K: 3,             // [статья] ошибок подряд для принудительного Beginner
  FAST_SEC: 10,     // [достроено] «быстрый» ответ для GS: меньше 10 с
  LEVEL_ADV: 65,    // [достроено] S_adj ≥ 65 → Advanced
  LEVEL_INT: 35,    // [достроено] S_adj ≥ 35 → Intermediate, иначе Beginner
  EPS: 1e-6,        // [статья] ε в знаменателе HP
};

// ── Функции принадлежности ──────────────────────────────────────────────
// Треугольная [a, b, c]; a === b или b === c даёт «плечо» на краю.
export function tri(x, [a, b, c]) {
  if (x < a || x > c) return 0;
  if (x === b) return 1;
  if (x < b) return b === a ? 1 : (x - a) / (b - a);
  return c === b ? 1 : (c - x) / (c - b);
}

// [статья] Таблица I
export const INPUT_MF = {
  WA: { L: [0, 0, 0.5],  M: [0.4, 0.65, 0.8], H: [0.7, 1, 1] },
  GS: { L: [0, 0, 0.3],  M: [0.2, 0.45, 0.65], H: [0.55, 1, 1] },
  HP: { L: [0, 0, 0.3],  M: [0.2, 0.5, 0.7],   H: [0.6, 1, 1] },
  FI: { L: [0, 0, 0.4],  M: [0.3, 0.55, 0.75], H: [0.65, 1, 1] },
  SS: { L: [0, 0, 0.4],  M: [0.3, 0.6, 0.8],   H: [0.7, 1, 1] },
};

// [достроено] Выходные функции принадлежности на шкале навыка [0, 100].
// Подобраны так, чтобы на сигналах из таблицы III статьи центроид давал
// сырые оценки, близкие к таблице IV (82,4 / 61,7 / 28,3) — см. fuzzy.test.js.
export const OUTPUT_MF = {
  Beginner:     [5, 30, 50],
  Intermediate: [35, 62, 85],
  Advanced:     [60, 88, 100],
};

// ── База правил (20 правил) ─────────────────────────────────────────────
// Пустое поле = «любое значение». SS указан там, где он влияет на вывод.
export const RULES = [
  // [статья] R1: высокая точность, весь шум низкий → Advanced (SS Low добавлен, чтобы отличать от R11)
  { id: "R1",  if: { WA: "H", GS: "L", HP: "L", FI: "L", SS: "L" }, then: "Advanced",     source: "paper" },
  // [статья] R2: высокая точность, но много угадывания → Intermediate
  { id: "R2",  if: { WA: "H", GS: "H", HP: "L", FI: "L" },          then: "Intermediate", source: "paper" },
  // [достроено] R3: высокая точность за счёт подсказок → Intermediate
  { id: "R3",  if: { WA: "H", GS: "L", HP: "H" },                   then: "Intermediate", source: "reconstructed" },
  // [статья] R4: высокая точность, но признаки усталости → Intermediate
  { id: "R4",  if: { WA: "H", GS: "L", HP: "L", FI: "H" },          then: "Intermediate", source: "paper" },
  // [статья] R5: средняя точность, шум низкий → Intermediate
  { id: "R5",  if: { WA: "M", GS: "L", HP: "L", FI: "L" },          then: "Intermediate", source: "paper" },
  // [статья] R6: средняя точность и угадывание → Beginner
  { id: "R6",  if: { WA: "M", GS: "H", HP: "L", FI: "L" },          then: "Beginner",     source: "paper" },
  // [достроено] R7: средняя точность и сильная опора на подсказки → Beginner
  { id: "R7",  if: { WA: "M", HP: "H" },                            then: "Beginner",     source: "reconstructed" },
  // [достроено] R8: средняя точность и усталость → Intermediate (усталость не снижает оценку знаний ниже)
  { id: "R8",  if: { WA: "M", GS: "L", FI: "H" },                   then: "Intermediate", source: "reconstructed" },
  // [достроено] R9: средняя точность и плато → Intermediate
  { id: "R9",  if: { WA: "M", GS: "L", SS: "H" },                   then: "Intermediate", source: "reconstructed" },
  // [статья] R10: низкая точность → Beginner при любых сигналах
  { id: "R10", if: { WA: "L" },                                     then: "Beginner",     source: "paper" },
  // [статья] R11: высокая точность и плато → Intermediate
  { id: "R11", if: { WA: "H", GS: "L", HP: "L", FI: "L", SS: "H" }, then: "Intermediate", source: "paper" },
  // [достроено] R12: высокая точность, умеренное плато → Advanced
  { id: "R12", if: { WA: "H", GS: "L", HP: "L", FI: "L", SS: "M" }, then: "Advanced",     source: "reconstructed" },
  // [достроено] R13: высокая точность, умеренное угадывание → Intermediate
  { id: "R13", if: { WA: "H", GS: "M" },                            then: "Intermediate", source: "reconstructed" },
  // [достроено] R14: высокая точность, умеренные подсказки → Advanced
  { id: "R14", if: { WA: "H", GS: "L", HP: "M", FI: "L" },          then: "Advanced",     source: "reconstructed" },
  // [достроено] R15: высокая точность, умеренная усталость → Advanced
  { id: "R15", if: { WA: "H", GS: "L", HP: "L", FI: "M" },          then: "Advanced",     source: "reconstructed" },
  // [достроено] R16: высокая точность при угадывании и подсказках → Intermediate
  { id: "R16", if: { WA: "H", GS: "H", HP: "H" },                   then: "Intermediate", source: "reconstructed" },
  // [достроено] R17: средняя точность, умеренное угадывание → Intermediate
  { id: "R17", if: { WA: "M", GS: "M" },                            then: "Intermediate", source: "reconstructed" },
  // [достроено] R18: средняя точность, умеренные подсказки → Intermediate
  { id: "R18", if: { WA: "M", HP: "M" },                            then: "Intermediate", source: "reconstructed" },
  // [достроено] R19: средняя точность, угадывание вместе с усталостью → Beginner
  { id: "R19", if: { WA: "M", GS: "H", FI: "H" },                   then: "Beginner",     source: "reconstructed" },
  // [достроено] R20: высокая точность, но и угадывание, и усталость → Intermediate
  { id: "R20", if: { WA: "H", GS: "H", FI: "H" },                   then: "Intermediate", source: "reconstructed" },
];

// ── Слой 2: нормализация и сигналы ──────────────────────────────────────
const clip01 = (x) => Math.max(0, Math.min(1, x));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** [статья] Min-max нормализация времени в [0, 120] с отсечением. */
export const normTime = (sec) => clip01((Number.isFinite(sec) ? sec : PARAMS.T_MAX / 2) / PARAMS.T_MAX);

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
}

/** [статья] WA = Σ(x1·x4) / Σ(x4). */
export function weightedAccuracy(obs) {
  const den = obs.reduce((a, o) => a + o.difficulty, 0);
  return den ? obs.reduce((a, o) => a + (o.correct ? o.difficulty : 0), 0) / den : 0;
}

/** [статья] GS = быстрые неверные ответы на сложных / все сложные. [достроено] быстрый = < FAST_SEC. */
export function guessingScore(obs) {
  const hard = obs.filter(o => o.difficulty === 3);
  if (!hard.length) return 0;
  return hard.filter(o => !o.correct && o.timeSec < PARAMS.FAST_SEC).length / hard.length;
}

/** [статья] HP = Σx3 / (Σx1 + ε). Может быть больше 1; для нечёткого слоя отсекается до 1. */
export function hintPressure(obs) {
  const hints = obs.filter(o => o.hint).length;
  const correct = obs.filter(o => o.correct).length;
  return hints / (correct + PARAMS.EPS);
}

/**
 * [статья] FI — одновременный рост времени ответа и падение точности в окне W.
 * [достроено] FI = max(0, r(позиция, время)) · max(0, −r(позиция, правильность)),
 * где r — коэффициент корреляции Пирсона. Оба тренда нужны одновременно, поэтому произведение.
 */
export function fatigueIndex(obs) {
  const w = obs.slice(-PARAMS.W);
  if (w.length < 3) return 0;
  const pos = w.map((_, i) => i);
  const rt = pearson(pos, w.map(o => normTime(o.timeSec)));
  const ra = pearson(pos, w.map(o => (o.correct ? 1 : 0)));
  return clip01(Math.max(0, rt) * Math.max(0, -ra));
}

/**
 * [статья] SS — плато: дисперсия WA по скользящему окну.
 * [достроено] SS = (1 − min(1, σ²(WA_w) / 0,25)) · (1 − WA), где WA_w — WA каждого окна
 * длины W по сессии, 0,25 — максимальная дисперсия величины из [0, 1].
 * Множитель (1 − WA) нужен, чтобы стабильно высокая точность не считалась «застоем»
 * (в статье профиль A имеет SS = 0,08 при стабильных верных ответах).
 */
export function stagnationScore(obs) {
  const wa = weightedAccuracy(obs);
  if (obs.length < PARAMS.W) return 0; // мало данных — плато не определяем
  const series = [];
  for (let i = PARAMS.W; i <= obs.length; i++) series.push(weightedAccuracy(obs.slice(i - PARAMS.W, i)));
  const m = mean(series);
  const variance = mean(series.map(v => (v - m) ** 2));
  return clip01((1 - Math.min(1, variance / 0.25)) * (1 - wa));
}

/** Слой 1–2: из наблюдений последней сессии (≤ N) в сигналы. */
export function computeSignals(rawObs) {
  const obs = rawObs.slice(-PARAMS.N).map(o => ({
    correct: !!o.correct,
    timeSec: Number.isFinite(o.timeSec) ? o.timeSec : PARAMS.T_MAX / 2,
    hint: !!o.hint,
    difficulty: [1, 2, 3].includes(o.difficulty) ? o.difficulty : 2,
  }));
  return {
    WA: weightedAccuracy(obs),
    GS: guessingScore(obs),
    HP: hintPressure(obs),
    FI: fatigueIndex(obs),
    SS: stagnationScore(obs),
    n: obs.length,
    maxWrongStreak: obs.reduce((acc, o) => {
      const run = o.correct ? 0 : acc.run + 1;
      return { run, max: Math.max(acc.max, run) };
    }, { run: 0, max: 0 }).max,
  };
}

// ── Слой 3: вывод Мамдани ───────────────────────────────────────────────
export function fuzzify(signals) {
  const out = {};
  for (const [name, sets] of Object.entries(INPUT_MF)) {
    const x = clip01(signals[name]); // HP > 1 отсекается до 1
    out[name] = { L: tri(x, sets.L), M: tri(x, sets.M), H: tri(x, sets.H) };
  }
  return out;
}

export function fireRules(memberships) {
  return RULES.map(rule => {
    let strength = 1;
    for (const [sig, term] of Object.entries(rule.if)) strength = Math.min(strength, memberships[sig][term]);
    return { id: rule.id, then: rule.then, strength };
  });
}

/** Дефаззификация центроидом агрегированного (max) множества, импликация min. */
export function defuzzify(fired, steps = 1000) {
  const clipBy = {};
  for (const f of fired) clipBy[f.then] = Math.max(clipBy[f.then] || 0, f.strength);
  let num = 0, den = 0;
  for (let i = 0; i <= steps; i++) {
    const s = (100 * i) / steps;
    let mu = 0;
    for (const [label, h] of Object.entries(clipBy)) {
      if (h > 0) mu = Math.max(mu, Math.min(h, tri(s, OUTPUT_MF[label])));
    }
    num += s * mu;
    den += mu;
  }
  return den > 0 ? num / den : null;
}

// ── Слой 4–5: поправка на уверенность и выход ───────────────────────────
export function levelFor(score) {
  if (score >= PARAMS.LEVEL_ADV) return "Advanced";
  if (score >= PARAMS.LEVEL_INT) return "Intermediate";
  return "Beginner";
}

/**
 * Поведенческий профиль. [статья] пять профилей.
 * [достроено] Профиль — первый сигнал, перешедший в зону High, в порядке
 * угадывание → усталость → подсказки → плато (тот же приоритет, что α > β в статье).
 */
export function behaviorProfile(s) {
  if (s.GS > INPUT_MF.GS.H[0]) return "Guessing";
  if (s.FI > INPUT_MF.FI.H[0]) return "Fatigued";
  if (Math.min(1, s.HP) > INPUT_MF.HP.H[0]) return "Hint-Dependent";
  if (s.SS > INPUT_MF.SS.H[0]) return "Stagnating";
  return "Consistent";
}

/** Вывод из готовых сигналов (используется и в тестах на таблице III статьи). */
export function inferFromSignals(signals, { maxWrongStreak = 0 } = {}) {
  const memberships = fuzzify(signals);
  const fired = fireRules(memberships);
  const raw = defuzzify(fired);
  const S = raw ?? 50;
  const confidence = clip01(1 - PARAMS.ALPHA * signals.GS - PARAMS.BETA * signals.FI);
  const S_adj = S * confidence;
  const override = maxWrongStreak >= PARAMS.K;
  return {
    signals,
    memberships,
    firedRules: fired.filter(f => f.strength > 0).map(f => ({ id: f.id, then: f.then, strength: +f.strength.toFixed(3) })),
    S: +S.toFixed(1),
    confidence: +confidence.toFixed(2),
    S_adj: +S_adj.toFixed(1),
    level: override ? "Beginner" : levelFor(S_adj),
    override,
    profile: behaviorProfile(signals),
  };
}

/**
 * Полная оценка по последовательности ответов.
 * @param {{correct:boolean, timeSec:number, hint:boolean, difficulty:1|2|3}[]} observations
 */
export function assess(observations) {
  const signals = computeSignals(observations);
  const { maxWrongStreak, n, ...core } = signals;
  const result = inferFromSignals(core, { maxWrongStreak });
  return { ...result, n };
}
