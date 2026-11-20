// Логика админ-панели исследователя: шаг каждого участника, воронка, хронология.
// Чистые функции без обращения к сети — проверяются тестами (admin.test.js).
import { ASSESSMENT_TEST_ID, TOPICS } from "./assessmentData.js";
import { TOPIC_BY_TEST } from "../adaptive/items.js";
import { BADGE_TEXT, RANKS } from "../game/content.js";

export const POST_MIN_PRACTICE = 5;

/** Шаги участника по порядку. */
export const STEPS = ["registered", "pre", "learning", "ready", "done"];
export const STEP_TEXT = {
  ru: { registered: "Нет согласия", pre: "Ждёт входной тест", learning: "Учится", ready: "Итоговый открыт", done: "Завершил" },
  en: { registered: "No consent yet", pre: "Awaiting entry test", learning: "Learning", ready: "Final test open", done: "Finished" },
};

const maxDate = (...lists) => {
  let best = null;
  for (const list of lists) for (const r of list) if (!best || r.created_at > best) best = r.created_at;
  return best;
};

/**
 * Строки админ-панели: все участники пула, включая тех, кто ещё не дал согласия.
 * built — результат buildParticipants для того же пула (коды и метрики берутся оттуда).
 */
export function buildAdminRows({ profiles, attempts, events, interactions = [] }, built, pool = "real") {
  const byId = Object.fromEntries(built.map(b => [b.id, b]));
  return profiles
    .filter(p => p.role === "participant" && !!p.is_test === (pool === "test"))
    .map(p => {
      const att = attempts.filter(a => a.user_id === p.id);
      const ev = events.filter(e => e.user_id === p.id);
      const it = interactions.filter(r => r.user_id === p.id);
      const hasPre = att.some(a => a.phase === "pre" && a.test_id === ASSESSMENT_TEST_ID);
      const hasPost = att.some(a => a.phase === "post" && a.test_id === ASSESSMENT_TEST_ID);
      const practiceDone = new Set(att.filter(a => a.phase === "practice").map(a => a.test_id)).size;
      const step = !p.consent ? "registered" : !hasPre ? "pre" : hasPost ? "done"
        : practiceDone >= POST_MIN_PRACTICE ? "ready" : "learning";
      const b = byId[p.id];
      return {
        id: p.id,
        code: b?.code ?? "—",
        name: p.display_name || "",
        cohort: p.cohort_assigned_at || p.consent ? p.cohort : null,
        is_test: !!p.is_test,
        step,
        practiceDone,
        lastSeen: maxDate(ev, att, it) || p.created_at,
        profile: p,
        metrics: b ?? null,
      };
    });
}

/** Воронка: число участников на каждом шаге и дальше, по группам. */
export function buildFunnel(rows) {
  const reached = (r, step) => STEPS.indexOf(r.step) >= STEPS.indexOf(step);
  const cohorts = ["experimental", "control"];
  return STEPS.map(step => {
    const at = rows.filter(r => reached(r, step));
    const row = { step, total: at.length };
    for (const c of cohorts) row[c] = at.filter(r => r.cohort === c).length;
    row.none = at.filter(r => !cohorts.includes(r.cohort)).length;
    return row;
  });
}

/** Баланс групп среди тех, кому группа назначена. */
export function cohortBalance(rows) {
  const exp = rows.filter(r => r.cohort === "experimental" && r.profile.consent).length;
  const ctl = rows.filter(r => r.cohort === "control" && r.profile.consent).length;
  return { experimental: exp, control: ctl, diff: Math.abs(exp - ctl) };
}

/** Сколько часов прошло с последней активности. */
export const hoursSince = (iso, now = Date.now()) => (now - new Date(iso).getTime()) / 36e5;

export function relativeTime(iso, lang = "ru", now = Date.now()) {
  if (!iso) return "—";
  const h = hoursSince(iso, now);
  const en = lang === "en";
  if (h < 1 / 60) return en ? "just now" : "только что";
  if (h < 1) return en ? `${Math.round(h * 60)} min ago` : `${Math.round(h * 60)} мин назад`;
  if (h < 24) return en ? `${Math.round(h)} h ago` : `${Math.round(h)} ч назад`;
  const d = Math.round(h / 24);
  return en ? `${d} d ago` : `${d} дн назад`;
}

// ── Хронология участника ────────────────────────────────────
const topicName = (t, lang) => (t && TOPICS[t] ? TOPICS[t][lang] : t || "");
const SOURCE = {
  practice: { ru: "Практические тесты", en: "Practice tests" },
  skill_check: { ru: "Оценка уровня", en: "Skill check" },
  "trainer:hacker_game": { ru: "Hacker Game", en: "Hacker Game" },
  "trainer:fake_news": { ru: "Фейк или правда", en: "Fake or real" },
  "trainer:phishing_sms": { ru: "Фишинговые SMS", en: "Phishing SMS" },
  "trainer:social_engineering": { ru: "Социальная инженерия", en: "Social engineering" },
  "trainer:url_scanner": { ru: "Проверка ссылок", en: "URL scanner" },
  "trainer:data_sort": { ru: "Хранение данных", en: "Data storage" },
};
const sourceName = (s, lang) => SOURCE[s]?.[lang] ?? s;

/** Подпись события; null — событие не показывается (служебное или слишком частое). */
function describeEvent(e, lang) {
  const en = lang === "en", p = e.payload || {};
  switch (e.type) {
    case "cohort_assigned": return { icon: "🎲", text: en ? `Assigned to ${p.cohort} group` : `Назначена группа: ${p.cohort === "control" ? "контрольная" : "экспериментальная"}` };
    case "lesson_open": return { icon: "📖", text: (en ? "Opened lesson: " : "Открыл урок: ") + topicName(p.lessonId, lang) + (p.firstTime ? (en ? " (first time)" : " (впервые)") : "") };
    case "trainer_open": return { icon: "🎮", text: (en ? "Opened trainer: " : "Открыл тренажёр: ") + sourceName(`trainer:${p.trainer}`, lang) };
    case "game_finish": return { icon: "🏁", text: en ? `Finished Hacker Game: ${p.correct ?? "?"}/${p.rounds ?? "?"} correct, ${p.points ?? 0} pts` : `Завершил Hacker Game: ${p.correct ?? "?"}/${p.rounds ?? "?"} верно, ${p.points ?? 0} очков` };
    case "rec_clicked": return { icon: "👉", text: (en ? "Followed recommendation: " : "Перешёл по рекомендации: ") + `${p.kind}${p.topic ? ` · ${topicName(p.topic, lang)}` : ""}` };
    case "badge_earned": return { icon: BADGE_TEXT[lang]?.[p.badge]?.icon ?? "🏅", text: (en ? "Badge: " : "Награда: ") + (BADGE_TEXT[lang]?.[p.badge]?.title ?? p.badge) };
    case "level_up": return { icon: "⭐", text: (en ? "New rank: " : "Новое звание: ") + (RANKS[lang]?.[p.rank]?.name ?? p.rank) };
    case "daily_goal_met": return { icon: "🔥", text: en ? `Daily goal met (streak ${p.streak})` : `Дневная цель выполнена (серия ${p.streak})` };
    case "adaptation": return { icon: "🎚️", text: en ? `Difficulty adapted: ${p.level}, ${p.profile}` : `Подстройка сложности: ${p.level}, ${p.profile}` };
    case "test_flag_changed": return { icon: "🧪", text: p.is_test ? (en ? "Marked as test account" : "Помечен тестовым") : (en ? "Test mark removed" : "Пометка «тестовый» снята") };
    default: return null; // rec_shown, xp_awarded, model_assessment и др. — сводятся в итоги дня
  }
}

function describeAttempt(a, lang) {
  const en = lang === "en";
  const score = `${a.score}/${a.total}`;
  if (a.phase === "pre") return { icon: "📝", text: (en ? "Entry test: " : "Входной тест: ") + score, strong: true };
  if (a.phase === "post") return { icon: "🎓", text: (en ? "Final test: " : "Итоговый тест: ") + score, strong: true };
  return { icon: "✅", text: (en ? "Practice test: " : "Практический тест: ") + `${topicName(TOPIC_BY_TEST[a.test_id], lang) || a.test_id} — ${score}` };
}

/**
 * Хронология по дням (новые сверху). Каждый день: список действий и итог —
 * обучающие ответы по источникам, полученный опыт, показанные рекомендации.
 */
export function buildTimeline(userId, { attempts, events, interactions = [] }, lang = "ru") {
  const items = [];
  for (const e of events.filter(e => e.user_id === userId)) {
    const d = describeEvent(e, lang);
    if (d) items.push({ at: e.created_at, ...d });
  }
  for (const a of attempts.filter(a => a.user_id === userId)) items.push({ at: a.created_at, ...describeAttempt(a, lang) });

  const days = {};
  const day = (iso) => (days[iso.slice(0, 10)] ??= { date: iso.slice(0, 10), items: [], answers: {}, xp: 0, recs: 0 });
  for (const it of items) day(it.at).items.push(it);
  for (const r of interactions.filter(r => r.user_id === userId)) {
    const s = (day(r.created_at).answers[r.source] ??= { n: 0, correct: 0, hints: 0 });
    s.n++; s.correct += r.correct ? 1 : 0; s.hints += r.hint_used ? 1 : 0;
  }
  for (const e of events.filter(e => e.user_id === userId)) {
    if (e.type === "xp_awarded") day(e.created_at).xp += e.payload?.amount || 0;
    if (e.type === "rec_shown") day(e.created_at).recs++;
  }
  return Object.values(days)
    .map(d => ({
      ...d,
      items: d.items.sort((a, b) => (a.at < b.at ? 1 : -1)),
      answers: Object.entries(d.answers).map(([source, s]) => ({ source, label: sourceName(source, lang), ...s })),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
