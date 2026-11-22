// Небольшая статистическая библиотека без зависимостей для анализа эксперимента.
// Всё считается двусторонне, если не сказано иное.

// ── Описательные ─────────────────────────────────────────────
export const finite = (xs) => xs.filter((x) => typeof x === "number" && Number.isFinite(x));
export const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
export function variance(xs) {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
}
export const sd = (xs) => Math.sqrt(variance(xs));
export function quantile(xs, q) {
  const v = [...xs].sort((a, b) => a - b);
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}
export const median = (xs) => quantile(xs, 0.5);

// ── Распределения ────────────────────────────────────────────
function lnGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a, b, x) {
  const MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Регуляризованная неполная бета-функция I_x(a, b). */
export function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** P(T > |t|) · 2 для распределения Стьюдента. */
export const tTwoSided = (t, df) => ibeta(df / (df + t * t), df / 2, 0.5);
/** Функция распределения Стьюдента. */
export function tCdf(t, df) {
  const tail = 0.5 * ibeta(df / (df + t * t), df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}
/** P(F > f). */
export const fUpper = (f, d1, d2) => (f <= 0 ? 1 : ibeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2));

export function normCdf(z) {
  // Абрамовиц–Стиган 7.1.26 через erf, точность ~1e-7
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t
    * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

function bisect(f, lo, hi, target) {
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
export const normQuantile = (p) => bisect(normCdf, -40, 40, p);
export const tQuantile = (p, df) => bisect((t) => tCdf(t, df), -1e3, 1e3, p);

// ── Ранги ────────────────────────────────────────────────────
/** Средние ранги (1…n) с учётом связок. */
export function ranks(xs) {
  const idx = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(xs.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

// ── t-тесты ──────────────────────────────────────────────────
export function pairedT(before, after) {
  const d = before.map((b, i) => after[i] - b);
  const n = d.length, md = mean(d), s = sd(d);
  const se = s / Math.sqrt(n), df = n - 1;
  const t = md / se;
  const crit = tQuantile(0.975, df);
  return { n, meanDiff: md, sdDiff: s, t, df, p: tTwoSided(t, df), ci: [md - crit * se, md + crit * se], dz: md / s };
}

export function welchT(a, b) {
  const va = variance(a), vb = variance(b), na = a.length, nb = b.length;
  const se = Math.sqrt(va / na + vb / nb);
  const diff = mean(a) - mean(b);
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  const t = diff / se;
  const crit = tQuantile(0.975, df);
  return { diff, t, df, p: tTwoSided(t, df), ci: [diff - crit * se, diff + crit * se] };
}

/** g Хеджеса (a − b) с приближённым 95% ДИ (Hedges & Olkin, 1985). */
export function hedgesG(a, b) {
  const na = a.length, nb = b.length;
  const sp = Math.sqrt(((na - 1) * variance(a) + (nb - 1) * variance(b)) / (na + nb - 2));
  const d = (mean(a) - mean(b)) / sp;
  const J = 1 - 3 / (4 * (na + nb) - 9);
  const g = d * J;
  const se = Math.sqrt((na + nb) / (na * nb) + (g * g) / (2 * (na + nb)));
  return { g, ci: [g - 1.959964 * se, g + 1.959964 * se] };
}

// ── Точные непараметрические тесты (с учётом связок) ─────────
// Ранги удваиваются, чтобы полуцелые ранги стали целыми, и распределение
// суммы рангов перечисляется динамическим программированием.

/** Знаково-ранговый критерий Уилкоксона, точный p (условно на связки). */
export function wilcoxonSigned(before, after) {
  const d = before.map((b, i) => after[i] - b).filter((x) => x !== 0);
  const n = d.length;
  if (n === 0) return { n: 0, zeros: before.length, Wplus: 0, p: 1, r: 0 };
  const r2 = ranks(d.map(Math.abs)).map((r) => Math.round(r * 2));
  const total = r2.reduce((s, x) => s + x, 0);
  const W2 = d.reduce((s, x, i) => s + (x > 0 ? r2[i] : 0), 0);
  // dist[s] = число подмножеств рангов с суммой s
  let dist = new Array(total + 1).fill(0); dist[0] = 1;
  for (const r of r2) {
    const next = dist.slice();
    for (let s = 0; s + r <= total; s++) if (dist[s]) next[s + r] += dist[s];
    dist = next;
  }
  const all = 2 ** n;
  const lo = Math.min(W2, total - W2);
  let tail = 0;
  for (let s = 0; s <= lo; s++) tail += dist[s];
  const p = Math.min(1, (2 * tail) / all);
  const Wplus = W2 / 2, Wminus = (total - W2) / 2;
  return { n, zeros: before.length - n, Wplus, Wminus, p, r: (Wplus - Wminus) / (total / 2) };
}

/** U-критерий Манна–Уитни, точный p (условно на связки); r — ранг-бисериальная корреляция (a > b). */
export function mannWhitney(a, b) {
  const na = a.length, nb = b.length, N = na + nb;
  const r2 = ranks([...a, ...b]).map((r) => Math.round(r * 2));
  const total = r2.reduce((s, x) => s + x, 0);
  const Ra2 = r2.slice(0, na).reduce((s, x) => s + x, 0);
  // cnt[k][s] = число способов выбрать k рангов с суммой s
  let cnt = Array.from({ length: na + 1 }, () => new Map());
  cnt[0].set(0, 1);
  for (const r of r2) {
    for (let k = Math.min(na, N) - 1; k >= 0; k--) {
      for (const [s, c] of cnt[k]) cnt[k + 1].set(s + r, (cnt[k + 1].get(s + r) || 0) + c);
    }
  }
  const distr = cnt[na];
  let totalWays = 0;
  for (const c of distr.values()) totalWays += c;
  const center = (na * total) / N; // ожидаемая сумма удвоенных рангов группы a
  const dev = Math.abs(Ra2 - center);
  let extreme = 0;
  for (const [s, c] of distr) if (Math.abs(s - center) >= dev - 1e-9) extreme += c;
  const U = Ra2 / 2 - (na * (na + 1)) / 2;
  return { U, p: Math.min(1, extreme / totalWays), r: (2 * U) / (na * nb) - 1 };
}

// ── Регрессия (ANCOVA) ───────────────────────────────────────
function solve(A, y) {
  // Гаусс–Жордан для (XᵀX)⁻¹; возвращает обратную матрицу
  const n = A.length;
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const div = M[c][c];
    if (Math.abs(div) < 1e-12) throw new Error("Матрица вырождена");
    for (let j = 0; j < 2 * n; j++) M[c][j] /= div;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((row) => row.slice(n));
}

/** МНК без статистических выводов: коэффициенты, остатки, (XᵀX)⁻¹. Z уже со столбцом единиц. */
function lsq(Z, y) {
  const p = Z[0].length;
  const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => Z.reduce((s, r) => s + r[i] * r[j], 0)));
  const inv = solve(XtX);
  const Xty = Array.from({ length: p }, (_, i) => Z.reduce((s, r, k) => s + r[i] * y[k], 0));
  const beta = inv.map((row) => row.reduce((s, v, j) => s + v * Xty[j], 0));
  const resid = Z.map((r, k) => y[k] - r.reduce((s, v, j) => s + v * beta[j], 0));
  return { beta, inv, resid, sse: resid.reduce((s, e) => s + e * e, 0) };
}

/** МНК: X — массив строк предикторов (без свободного члена), y — отклик. */
export function ols(X, y) {
  const Z = X.map((row) => [1, ...row]);
  const n = Z.length, p = Z[0].length;
  const { beta, inv, sse } = lsq(Z, y);
  const df = n - p;
  const sigma2 = sse / df;
  const se = inv.map((row, i) => Math.sqrt(sigma2 * row[i]));
  const t = beta.map((b, i) => b / se[i]);
  const crit = tQuantile(0.975, df);
  return {
    beta, se, t, df, sse,
    p: t.map((ti) => tTwoSided(ti, df)),
    ci: beta.map((b, i) => [b - crit * se[i], b + crit * se[i]]),
  };
}

/**
 * ANCOVA: post ~ group + pre (+ дополнительные ковариаты, например порядок вариантов теста).
 * group — 1 для экспериментальной, 0 для контрольной; covars — массив столбцов.
 * Возвращает скорректированную разницу групп, её ДИ и p, частную η², коэффициенты
 * ковариат и проверку однородности наклонов (взаимодействие group × pre).
 */
export function ancova(pre, post, group, covars = []) {
  const extra = (i) => covars.map((c) => c[i]);
  const main = ols(pre.map((x, i) => [group[i], x, ...extra(i)]), post);
  const reduced = ols(pre.map((x, i) => [x, ...extra(i)]), post);
  const partialEta2 = (reduced.sse - main.sse) / reduced.sse;
  const preC = pre.map((x) => x - mean(pre));
  const inter = ols(preC.map((x, i) => [group[i], x, group[i] * x, ...extra(i)]), post);
  return {
    diff: main.beta[1], se: main.se[1], t: main.t[1], df: main.df, p: main.p[1], ci: main.ci[1],
    slope: main.beta[2], partialEta2,
    covars: covars.map((_, k) => ({ beta: main.beta[3 + k], ci: main.ci[3 + k], p: main.p[3 + k] })),
    slopesP: inter.p[3],
  };
}

// ── Перестановочный тест и бутстрэп ─────────────────────────
export function rng(seed = 20270601) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(xs, rand) {
  const v = xs.slice();
  for (let i = v.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [v[i], v[j]] = [v[j], v[i]];
  }
  return v;
}

/** Перестановочный p для статистики stat(groupLabels): метки групп перемешиваются. */
export function permutationP(group, stat, { reps = 10000, seed } = {}) {
  const rand = rng(seed);
  const obs = Math.abs(stat(group));
  let hits = 0;
  for (let i = 0; i < reps; i++) if (Math.abs(stat(shuffle(group, rand))) >= obs - 1e-12) hits++;
  return (hits + 1) / (reps + 1);
}

/** Процентильный бутстрэп-ДИ для разницы средних a − b. */
export function bootstrapDiffCI(a, b, { reps = 10000, seed } = {}) {
  const rand = rng(seed);
  const pick = (xs) => xs.map(() => xs[Math.floor(rand() * xs.length)]);
  const diffs = [];
  for (let i = 0; i < reps; i++) diffs.push(mean(pick(a)) - mean(pick(b)));
  return [quantile(diffs, 0.025), quantile(diffs, 0.975)];
}

// ── Прочее ───────────────────────────────────────────────────
export function spearman(x, y) {
  const rx = ranks(x), ry = ranks(y);
  const mx = mean(rx), my = mean(ry);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my); dx += (rx[i] - mx) ** 2; dy += (ry[i] - my) ** 2;
  }
  const rho = dx && dy ? num / Math.sqrt(dx * dy) : NaN;
  const n = x.length;
  const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
  return { rho, n, p: Number.isFinite(t) ? tTwoSided(t, n - 2) : rho === 0 ? 1 : 0 };
}

/** KR-20 по матрице 0/1 (строка — участник, столбец — вопрос). */
export function kr20(matrix) {
  const k = matrix[0].length;
  const totals = matrix.map((r) => r.reduce((s, x) => s + x, 0));
  const vt = (variance(totals) * (totals.length - 1)) / totals.length; // дисперсия генеральной совокупности, как p·q
  let pq = 0;
  for (let j = 0; j < k; j++) {
    const p = mean(matrix.map((r) => r[j]));
    pq += p * (1 - p);
  }
  return vt > 0 ? (k / (k - 1)) * (1 - pq / vt) : NaN;
}

/** Минимальный обнаружимый эффект d для двух групп по n человек (t-приближение). */
export function minDetectableD(nPerGroup, { alpha = 0.05, power = 0.8, prePostR = 0 } = {}) {
  const df = 2 * nPerGroup - 2 - (prePostR ? 1 : 0);
  const d = (tQuantile(1 - alpha / 2, df) + tQuantile(power, df)) * Math.sqrt(2 / nPerGroup);
  // ANCOVA с ковариатой r уменьшает дисперсию ошибки в (1 − r²) раз
  return d * Math.sqrt(1 - prePostR ** 2);
}

/** Поправка Холма: массив p → скорректированные p в том же порядке. */
export function holm(ps) {
  const order = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(ps.length);
  let prev = 0;
  order.forEach(([p, i], k) => {
    prev = Math.max(prev, Math.min(1, p * (ps.length - k)));
    out[i] = prev;
  });
  return out;
}

/** Точный критерий Фишера для таблицы 2×2 [[a, b], [c, d]], двусторонний. */
export function fisherExact([[a, b], [c, d]]) {
  const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
  const r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
  const prob = (x) => Math.exp(lf(r1) + lf(r2) + lf(c1) + lf(n - c1) - lf(n) - lf(x) - lf(r1 - x) - lf(c1 - x) - lf(r2 - c1 + x));
  const obs = prob(a);
  let p = 0;
  for (let x = Math.max(0, c1 - r2); x <= Math.min(r1, c1); x++) {
    const px = prob(x);
    if (px <= obs * (1 + 1e-7)) p += px;
  }
  return Math.min(1, p);
}

/**
 * Только коэффициент группы в post ~ group + pre (+ ковариаты) по теореме Фриша–Во —
 * быстро, для перестановок: группа и отклик очищаются от ковариат, затем регрессия остатков.
 */
export function ancovaDiff(pre, post, group, covars = []) {
  const Z = pre.map((x, i) => [1, x, ...covars.map((c) => c[i])]);
  const eg = lsq(Z, group).resid, ey = lsq(Z, post).resid;
  return eg.reduce((s, x, i) => s + x * ey[i], 0) / eg.reduce((s, x) => s + x * x, 0);
}
