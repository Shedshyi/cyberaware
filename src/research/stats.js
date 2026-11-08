// Статистика для страницы исследователя.
// Для диссертации итоговые расчёты лучше продублировать в SPSS/R/Python по выгруженному CSV,
// здесь — быстрый предварительный просмотр.

export const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;

export function sd(xs) {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

// ── Регуляризованная неполная бета-функция (Numerical Recipes, betacf) ──
function logGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betacf(a, b, x) {
  const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function incBeta(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2)
    ? bt * betacf(a, b, x) / a
    : 1 - bt * betacf(b, a, 1 - x) / b;
}

/** Двусторонний p-value для t-статистики с df степенями свободы. */
export function tTwoTailedP(t, df) {
  if (!isFinite(t) || !(df > 0)) return NaN;
  return incBeta(df / 2, 0.5, df / (df + t * t));
}

/** Парный t-тест (до/после у одних и тех же участников). */
export function pairedTTest(before, after) {
  const diffs = before.map((b, i) => after[i] - b);
  const n = diffs.length;
  const md = mean(diffs), sdd = sd(diffs);
  if (n < 2 || !(sdd > 0)) return { n, meanDiff: md, sdDiff: sdd, t: NaN, df: n - 1, p: NaN, d: NaN };
  const t = md / (sdd / Math.sqrt(n));
  return { n, meanDiff: md, sdDiff: sdd, t, df: n - 1, p: tTwoTailedP(t, n - 1), d: md / sdd };
}

/** t-тест Уэлча для двух независимых групп (например, прирост в экспериментальной и контрольной). */
export function welchTTest(a, b) {
  const na = a.length, nb = b.length;
  if (na < 2 || nb < 2) return { t: NaN, df: NaN, p: NaN, d: NaN };
  const ma = mean(a), mb = mean(b), va = sd(a) ** 2, vb = sd(b) ** 2;
  const se = Math.sqrt(va / na + vb / nb);
  if (!(se > 0)) return { t: NaN, df: NaN, p: NaN, d: NaN };
  const t = (ma - mb) / se;
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  const pooled = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2));
  return { t, df, p: tTwoTailedP(t, df), d: pooled > 0 ? (ma - mb) / pooled : NaN };
}

export const fmt = (x, digits = 2) => (x == null || !isFinite(x) ? "—" : x.toFixed(digits));
export const fmtP = (p) => (!isFinite(p) ? "—" : p < 0.001 ? "< 0.001" : p.toFixed(3));
