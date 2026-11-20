// Подбор вопросов практического теста из банка (8 вопросов на тему → 5 за попытку).
//
// Экспериментальная группа (адаптивно): доля лёгких, средних и сложных вопросов зависит от
// уровня ученика по теме (нечёткая модель ID137), а внутри уровня сложности первыми идут
// вопросы, на которые ученик в прошлый раз ответил неверно, затем ещё не встречавшиеся.
// Контрольная группа (традиционно): одинаковая для всех смесь сложности, вопросы случайные.
// В обеих группах варианты ответа перемешиваются при каждой попытке.

export const PRACTICE_SIZE = 5;
/** С какой попытки по тесту показываются правильные ответы и объяснения. */
export const REVEAL_FROM_ATTEMPT = 2;

/** Сколько вопросов каждой сложности (1 — лёгкий, 2 — средний, 3 — сложный) из 5. */
export const MIX = {
  Beginner:     { 1: 3, 2: 2, 3: 0 },
  Intermediate: { 1: 1, 2: 3, 3: 1 },
  Advanced:     { 1: 0, 2: 2, 3: 3 },
};
/** Традиционный режим: одна смесь для всех. */
export const FIXED_MIX = { 1: 2, 2: 2, 3: 1 };

/**
 * Уровень ученика по теме: оценка модели по теме → общая оценка → входной тест по теме.
 * Возвращает { level, source }.
 */
export function practiceLevel(model, topic) {
  const t = model?.topics?.[topic];
  if (t?.level) return { level: t.level, source: "topic" };
  if (t?.pre && t.pre !== "unknown") {
    return { level: t.pre === "known" ? "Advanced" : t.pre === "weak" ? "Beginner" : "Intermediate", source: "pre" };
  }
  if (model?.global?.level) return { level: model.global.level, source: "global" };
  return { level: "Intermediate", source: "default" };
}

/** История ответов по вопросам теста: qid → { seen, lastCorrect }. */
export function itemHistory(interactions = [], testId) {
  const prefix = `${testId}.`;
  const h = new Map();
  for (const r of interactions) {
    if (r.source !== "practice" || !String(r.itemId ?? "").startsWith(prefix)) continue;
    const qid = Number(String(r.itemId).slice(prefix.length));
    const prev = h.get(qid) ?? { seen: 0, lastCorrect: null };
    h.set(qid, { seen: prev.seen + 1, lastCorrect: !!r.correct });
  }
  return h;
}

function shuffle(xs, rand) {
  const v = xs.slice();
  for (let i = v.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [v[i], v[j]] = [v[j], v[i]];
  }
  return v;
}

/** Ранг для адаптивного режима: 0 — ошибся в прошлый раз, 1 — ещё не видел, 2 — уже отвечал верно. */
const priority = (h) => (h?.lastCorrect === false ? 0 : !h ? 1 : 2);

/**
 * @param {object} p
 * @param {Array}  p.bank          вопросы темы с полем difficulty
 * @param {boolean} p.adaptive     экспериментальная группа
 * @param {string} [p.level]       Beginner | Intermediate | Advanced (для адаптивного режима)
 * @param {Map}    [p.history]     itemHistory(...)
 * @param {Function} [p.rand]      генератор случайных чисел (для тестов)
 * @returns {{ items: Array<{q, order:number[]}>, mix: object }}
 */
export function pickPractice({ bank, adaptive, level = "Intermediate", history = new Map(), rand = Math.random, n = PRACTICE_SIZE }) {
  const mix = adaptive ? (MIX[level] ?? MIX.Intermediate) : FIXED_MIX;
  const pools = { 1: [], 2: [], 3: [] };
  for (const q of shuffle(bank, rand)) (pools[q.difficulty] ?? pools[2]).push(q);
  if (adaptive) for (const d of [1, 2, 3]) pools[d].sort((a, b) => priority(history.get(a.id)) - priority(history.get(b.id)));

  const chosen = [];
  const take = (d, k) => { while (k-- > 0 && pools[d].length && chosen.length < n) chosen.push(pools[d].shift()); };
  for (const d of [1, 2, 3]) take(d, mix[d]);
  // Не хватило вопросов нужной сложности — добираем из соседних уровней (ближайший первым)
  const target = adaptive ? (level === "Advanced" ? 3 : level === "Beginner" ? 1 : 2) : 2;
  const order = [target, ...[1, 2, 3].filter(d => d !== target).sort((a, b) => Math.abs(a - target) - Math.abs(b - target))];
  for (const d of order) take(d, n);

  const items = chosen
    .sort((a, b) => a.difficulty - b.difficulty)               // от лёгких к сложным
    .map(q => ({ q, order: shuffle([...q.options.keys()], rand) }));
  return { items, mix };
}

/** Номер текущей попытки по тесту (результаты из хранилища: { [testId]: {attempts?, ...} }). */
export function attemptNumber(results, testId) {
  const r = results?.[testId];
  return (r ? (r.attempts ?? 1) : 0) + 1;
}
