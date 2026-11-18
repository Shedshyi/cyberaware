// Геймификация: чистые функции (без React и хранилища), чтобы их можно было тестировать
// и точно описать в диссертации.
//
// Принципы (теория самодетерминации — автономия, компетентность, причастность):
//  • опыт только за осмысленные действия и никогда не отнимается;
//  • мастерство по темам (медали) отражает знание, а не число попыток;
//  • дневная цель небольшая, серия прощает один пропуск в неделю («заморозка»);
//  • награды — за мастерство и полезные привычки, а не за объём; рейтинга нет.

export const XP = {
  lesson_first_open: 20,     // впервые открыл урок миссии
  practice_done: 10,         // прошёл практический тест (любой результат)
  practice_correct: 5,       // + за каждый верный ответ
  topic_passed_first: 30,    // впервые сдал тему (≥ 75%)
  improved: 10,              // улучшил свой лучший результат по теме
  game_round_correct: 2,     // верный раунд в тренажёре
  skill_check: 15,           // прошёл оценку уровня
  daily_goal: 20,            // выполнил дневную цель
};

export const DAILY_GOAL_XP = 40;
export const PASS_PCT = 75;

// Звания: порог опыта. Названия — в content.js
export const RANK_XP = [0, 120, 300, 550, 900, 1400];

export const rankIndex = (xp) => RANK_XP.reduce((idx, min, i) => (xp >= min ? i : idx), 0);

export function rankProgress(xp) {
  const i = rankIndex(xp);
  const from = RANK_XP[i], to = RANK_XP[i + 1];
  return { index: i, from, to: to ?? null, pct: to ? Math.round(((xp - from) / (to - from)) * 100) : 100 };
}

// ── Даты (локальный день пользователя) ───────────────────────────────
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (key, n) => { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n)); };
const weekOf = (key) => { const [y, m, d] = key.split("-").map(Number); const dt = new Date(y, m - 1, d); const day = (dt.getDay() + 6) % 7; return dayKey(new Date(y, m - 1, d - day)); };

export function emptyState() {
  return { xp: 0, days: {}, goalDays: {}, freezes: {}, badges: {}, best: {}, passed: {}, counters: {} };
}

/**
 * Серия: подряд идущие дни с выполненной дневной целью, считая назад от сегодня (или вчера,
 * если сегодня цель ещё не выполнена). Один пропущенный день в неделю закрывается «заморозкой».
 */
export function streak(state, today = dayKey()) {
  let day = state.goalDays[today] ? today : addDays(today, -1);
  let count = 0;
  const usedFreeze = {};
  for (let guard = 0; guard < 400; guard++) {
    if (state.goalDays[day]) { count++; day = addDays(day, -1); continue; }
    const wk = weekOf(day);
    if (count > 0 && !usedFreeze[wk] && state.goalDays[addDays(day, -1)]) { usedFreeze[wk] = true; day = addDays(day, -1); continue; }
    break;
  }
  return count;
}

/**
 * Применяет событие обучения и возвращает новое состояние и то, что нужно показать и записать.
 * @param {object} state
 * @param {{type:string, topic?:string, score?:number, total?:number, hints?:number, correct?:number, firstTime?:boolean, today?:string}} ev
 * @param {{topicLevel?: (topic:string) => string|null}} [ctx]
 */
export function applyEvent(state, ev, ctx = {}) {
  const s = structuredClone(state);
  const today = ev.today || dayKey();
  const gains = [];
  const add = (reason, amount, extra = {}) => { if (amount > 0) { s.xp += amount; s.days[today] = (s.days[today] || 0) + amount; gains.push({ reason, amount, ...extra }); } };
  const before = { rank: rankIndex(s.xp), goal: !!s.goalDays[today] };

  if (ev.type === "lesson_open" && ev.firstTime) add("lesson_first_open", XP.lesson_first_open, { topic: ev.topic });

  if (ev.type === "practice_test") {
    const pct = Math.round((ev.score / ev.total) * 100);
    add("practice_done", XP.practice_done, { topic: ev.topic });
    add("practice_correct", XP.practice_correct * ev.score, { topic: ev.topic });
    const prevBest = s.best[ev.topic];
    if (pct >= PASS_PCT && !s.passed[ev.topic]) { s.passed[ev.topic] = today; add("topic_passed_first", XP.topic_passed_first, { topic: ev.topic }); }
    else if (prevBest !== undefined && pct > prevBest) add("improved", XP.improved, { topic: ev.topic });
    if (prevBest !== undefined && prevBest < PASS_PCT && pct >= PASS_PCT) s.counters.comebacks = (s.counters.comebacks || 0) + 1;
    s.best[ev.topic] = Math.max(prevBest ?? 0, pct);
    if (pct >= PASS_PCT && (ev.hints ?? 0) === 0) s.counters.cleanPasses = (s.counters.cleanPasses || 0) + 1;
  }

  if (ev.type === "game_finish") {
    add("game_round_correct", XP.game_round_correct * (ev.correct || 0));
    s.counters.bestGame = Math.max(s.counters.bestGame || 0, ev.total ? Math.round((ev.correct / ev.total) * 100) : 0);
  }

  if (ev.type === "skill_check") add("skill_check", XP.skill_check);

  // Дневная цель
  if (!s.goalDays[today] && (s.days[today] || 0) >= DAILY_GOAL_XP) {
    s.goalDays[today] = true;
    add("daily_goal", XP.daily_goal);
  }

  // Награды
  const newBadges = [];
  for (const b of BADGES) {
    if (!s.badges[b.id] && b.check(s, ctx, today)) { s.badges[b.id] = today; newBadges.push(b.id); }
  }

  const after = rankIndex(s.xp);
  return {
    state: s,
    gains,
    newBadges,
    levelUp: after > before.rank ? after : null,
    goalMet: !before.goal && !!s.goalDays[today],
    streak: streak(s, today),
  };
}

// ── Медали мастерства по темам ───────────────────────────────────────
// bronze: урок открыт и тест пройден хоть раз; silver: тест сдан (≥ 75%);
// gold: сдан и модель оценивает тему как Advanced (или 100% в тесте).
export function medal(state, topic, { lessonRead = false, topicLevel = null } = {}) {
  const best = state.best[topic];
  if (best === undefined) return lessonRead ? "started" : null;
  if (best >= PASS_PCT && (topicLevel === "Advanced" || best === 100)) return "gold";
  if (best >= PASS_PCT) return "silver";
  return "bronze";
}

const countMedals = (s, ctx, kind) => Object.keys(s.best).filter(t => {
  const m = medal(s, t, { topicLevel: ctx.topicLevel?.(t) ?? null });
  return kind === "silver" ? m === "silver" || m === "gold" : m === kind;
}).length;

// Условия наград. Названия и описания — в content.js
export const BADGES = [
  { id: "first_mission",  check: (s) => Object.keys(s.passed).length >= 1 },
  { id: "half_way",       check: (s, c) => countMedals(s, c, "silver") >= 5 },
  { id: "full_course",    check: (s, c) => countMedals(s, c, "silver") >= 10 },
  { id: "gold_three",     check: (s, c) => countMedals(s, c, "gold") >= 3 },
  { id: "no_hints",       check: (s) => (s.counters.cleanPasses || 0) >= 3 },
  { id: "comeback",       check: (s) => (s.counters.comebacks || 0) >= 1 },
  { id: "detective",      check: (s) => (s.counters.bestGame || 0) >= 75 },
  { id: "streak_3",       check: (s, c, today) => streak(s, today) >= 3 },
  { id: "streak_7",       check: (s, c, today) => streak(s, today) >= 7 },
];
