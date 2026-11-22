#!/usr/bin/env node
// Анализ эксперимента CyberAware по CSV-выгрузкам со страницы исследователя.
// Запуск:  npm run analyze -- <папка с CSV>
// Пишет отчёт <папка>/report.md и печатает его в консоль. План анализа: docs/analysis-plan.md.
import fs from "node:fs";
import path from "node:path";
import * as S from "./stats.js";
import { ASSESSMENT } from "../src/research/assessmentData.js";

const FORM_OF = Object.fromEntries(ASSESSMENT.ru.map((q) => [q.id, q.form]));

const SEED = 20270601;
const REPS = 10000;
const TOPIC_RU = {
  basics: "Основы", passwords: "Пароли", phishing: "Фишинг", socials: "Соцсети", malware: "Вредоносное ПО",
  wifi: "Сети и Wi-Fi", updates: "Обновления", privacy: "Приватность", recovery: "Действия при инциденте",
  summary: "Комплексные ситуации",
};

// ── Чтение CSV («;», BOM, кавычки) ───────────────────────────
export function parseCSV(text) {
  text = text.replace(/^﻿/, "");
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ";") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0]);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, convert(r[i] ?? "")])));
}

function convert(v) {
  if (v === "") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  const n = Number(v);
  return Number.isFinite(n) && /^-?\d/.test(v) ? n : v;
}

function findFile(dir, prefix) {
  // Выгрузки тестовых аккаунтов (суффикс _TEST) в анализ не берутся
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith(".csv") && !f.includes("_TEST"));
  if (!files.length) return null;
  files.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs);
  return path.join(dir, files[0]);
}

// ── Форматирование ──────────────────────────────────────────
const f = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : x.toFixed(d).replace(/^-0(\.0+)?$/, "0$1"));
const pv = (p) => (p == null || !Number.isFinite(p) ? "—" : p < 0.001 ? "< .001" : p.toFixed(3).replace(/^0/, ""));
const ci = (c, d = 1) => `[${f(c[0], d)}; ${f(c[1], d)}]`;
const msd = (xs) => (xs.length ? `${f(S.mean(xs))} (${xs.length > 1 ? f(S.sd(xs)) : "—"})` : "—");
const mdn = (xs) => (xs.length ? `${f(S.median(xs))} [${f(S.quantile(xs, 0.25))}–${f(S.quantile(xs, 0.75))}]` : "—");
const table = (head, rows) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const col = (rows, key) => S.finite(rows.map((r) => r[key]));

const GROUPS = [["experimental", "Экспериментальная"], ["control", "Контрольная"]];

// ── Анализ ──────────────────────────────────────────────────
export function analyze({ participants, answers = [], alpha = 0.05 }) {
  const out = [];
  const say = (s = "") => out.push(s);
  const by = (rows, g) => rows.filter((r) => r.cohort === g);
  const assigned = participants.filter((p) => p.cohort === "experimental" || p.cohort === "control");
  const completers = assigned.filter((p) => p.pre_pct != null && p.post_pct != null);
  const E = by(completers, "experimental"), C = by(completers, "control");
  const enough = E.length >= 3 && C.length >= 3;

  say("# CyberAware — результаты эксперимента");
  say();
  say(`Сформировано автоматически скриптом \`analysis/analyze.js\` по плану \`docs/analysis-plan.md\`. α = ${alpha}, тесты двусторонние, seed = ${SEED}, ${REPS} перестановок/бутстрэп-выборок. Баллы — % верных ответов (0–100).`);
  say();

  // 1. Поток участников
  say("## 1. Поток участников");
  say();
  say(table(["", ...GROUPS.map(([, n]) => n), "Всего"], [
    ["Дали согласие и получили группу", ...GROUPS.map(([g]) => by(assigned, g).length), assigned.length],
    ["Прошли входной тест", ...GROUPS.map(([g]) => by(assigned, g).filter((p) => p.pre_pct != null).length), assigned.filter((p) => p.pre_pct != null).length],
    ["Прошли итоговый тест (анализ)", E.length, C.length, completers.length],
  ]));
  const noGroup = participants.length - assigned.length;
  if (noGroup) { say(); say(`Без группы (не учитываются): ${noGroup}.`); }
  const dropped = assigned.filter((p) => p.pre_pct != null && p.post_pct == null);
  if (dropped.length) {
    say();
    say(`Выбыли после входного теста: ${dropped.map((p) => `${p.code} (${p.cohort === "experimental" ? "Э" : "К"})`).join(", ")}. ` +
      `Их входной балл: ${msd(col(dropped, "pre_pct"))} против ${msd(col(completers, "pre_pct"))} у завершивших.`);
  }
  say();

  if (!enough) {
    say(`> Для статистических тестов нужно хотя бы по 3 завершивших в каждой группе (сейчас Э = ${E.length}, К = ${C.length}). Ниже только описательная статистика.`);
    say();
  }

  // 2. Проверка манипуляции
  say("## 2. Проверка манипуляции и вовлечённость");
  say();
  say("Медиана [межквартильный размах] среди завершивших. В контрольной группе показатели адаптивности и геймификации должны быть равны нулю.");
  say();
  const ENG = [
    ["active_days", "Активные дни"], ["lessons_opened", "Открыто уроков"], ["practice_tests_done", "Разных практических тестов"],
    ["interactions_n", "Обучающих ответов"], ["interactions_correct_pct", "Точность обучающих ответов, %"],
    ["games_played", "Сыграно игр"], ["recs_shown", "Показано рекомендаций"], ["recs_clicked", "Выполнено рекомендаций"],
    ["xp_total", "Опыт (XP)"], ["badges", "Награды"], ["days_pre_to_post", "Дней от входного до итогового"],
  ];
  say(table(["Показатель", ...GROUPS.map(([, n]) => n)], ENG.map(([k, label]) => [label, mdn(col(E, k)), mdn(col(C, k))])));
  const leaks = C.filter((p) => (p.recs_shown || 0) + (p.xp_total || 0) + (p.badges || 0) > 0);
  say();
  say(leaks.length
    ? `⚠️ У контрольной группы есть следы экспериментальных функций: ${leaks.map((p) => p.code).join(", ")}. Проверить до интерпретации.`
    : "Следов экспериментальных функций в контрольной группе нет.");
  say();

  // 3. Исходная эквивалентность
  say("## 3. Сопоставимость групп на старте");
  say();
  const rowsBase = [];
  for (const [k, label] of [["pre_pct", "Входной тест, %"], ["age", "Возраст"], ["self_rating", "Самооценка (1–5)"]]) {
    const a = col(E, k), b = col(C, k);
    const mw = enough && a.length >= 3 && b.length >= 3 ? S.mannWhitney(a, b) : null;
    rowsBase.push([label, msd(a), msd(b), mw ? pv(mw.p) : "—"]);
  }
  const prior = (rows) => [rows.filter((p) => p.prior_training === true).length, rows.filter((p) => p.prior_training === false).length];
  const [pe, ne] = prior(E), [pc, nc] = prior(C);
  rowsBase.push(["Обучались ИБ раньше, n (%)", `${pe} (${f((pe / Math.max(1, pe + ne)) * 100, 0)}%)`, `${pc} (${f((pc / Math.max(1, pc + nc)) * 100, 0)}%)`,
    enough ? pv(S.fisherExact([[pe, ne], [pc, nc]])) : "—"]);
  say(table(["Показатель", "Э: M (SD)", "К: M (SD)", "p"], rowsBase));
  say();
  say("p: Манн–Уитни (точный) для количественных, Фишер для обучения раньше. Проверка описательная: при случайном распределении различия на старте случайны, а входной балл всё равно учитывается в основной модели.");
  say();

  // 4. Надёжность теста
  say("## 4. Надёжность теста (KR-20)");
  say();
  const completerCodes = new Set(completers.map((p) => p.code));
  const rel = [];
  // Надёжность считается по каждому варианту (A, B): строка матрицы — одна попытка (участник × фаза)
  for (const form of ["A", "B"]) {
    const rows = answers.filter((a) => (FORM_OF[a.question_id] ?? "A") === form && completerCodes.has(a.participant));
    const qids = [...new Set(rows.map((a) => a.question_id))].sort();
    const sittings = [...new Set(rows.map((a) => `${a.participant}|${a.phase}`))];
    const matrix = sittings.map((k) => qids.map((q) => rows.find((a) => `${a.participant}|${a.phase}` === k && a.question_id === q)?.correct ?? null))
      .filter((r) => r.every((x) => x != null));
    if (qids.length) rel.push([`Вариант ${form}`, matrix.length, qids.length, matrix.length >= 3 ? f(S.kr20(matrix), 2) : "—"]);
  }
  say(table(["Тест", "Прохождений", "Вопросов", "KR-20"], rel));
  say();
  say("Прохождение — один участник на одной фазе: вариант A пишут и на входе (порядок A→B), и на выходе (B→A).");
  say();

  // 4a. Варианты теста
  const hasForms = completers.some((p) => p.pre_form);
  if (hasForms) {
    say("### Варианты теста и их сложность");
    say();
    say(table(["Порядок", ...GROUPS.map(([, n]) => n)], ["AB", "BA"].map((o) => [o === "AB" ? "A → B" : "B → A",
      ...GROUPS.map(([g]) => by(completers, g).filter((p) => `${p.pre_form}${p.post_form}` === o).length)])));
    say();
    const formMean = (form) => [
      msd(col(completers.filter((p) => p.pre_form === form), "pre_pct")),
      msd(col(completers.filter((p) => p.post_form === form), "post_pct")),
    ];
    say(table(["Вариант", "На входе: M (SD)", "На выходе: M (SD)"], [["A", ...formMean("A")], ["B", ...formMean("B")]]));
    say();
    say("Если один вариант заметно легче, это видно по обоим столбцам; контрбалансировка и ковариата порядка в разделе 6 убирают его влияние на сравнение групп.");
    say();
  }

  // 5. Изменение внутри групп
  say("## 5. Изменение от входного к итоговому внутри групп");
  say();
  const within = [];
  for (const [g, label] of GROUPS) {
    const rows = by(completers, g);
    const pre = rows.map((p) => p.pre_pct), post = rows.map((p) => p.post_pct);
    if (rows.length < 3) { within.push([label, rows.length, msd(pre), msd(post), "—", "—", "—", "—"]); continue; }
    const t = S.pairedT(pre, post), w = S.wilcoxonSigned(pre, post);
    within.push([label, rows.length, msd(pre), msd(post), `${f(t.meanDiff)} ${ci(t.ci)}`, `${f(t.dz, 2)}`, pv(t.p), pv(w.p)]);
  }
  say(table(["Группа", "n", "До: M (SD)", "После: M (SD)", "Прирост [95% ДИ]", "d_z", "p (t)", "p (Уилкоксон)"], within));
  say();

  // 6. Основной анализ
  const allC = [...E, ...C];
  const orderCol = allC.map((p) => (p.pre_form === "B" ? 1 : 0));
  const useOrder = allC.some((p) => p.pre_form === "A") && allC.some((p) => p.pre_form === "B");
  say(`## 6. Основная гипотеза: ANCOVA (итоговый балл ~ группа + входной балл${useOrder ? " + порядок вариантов" : ""})`);
  say();
  const result = { completers: completers.length, nE: E.length, nC: C.length };
  if (enough) {
    const all = allC;
    const pre = all.map((p) => p.pre_pct), post = all.map((p) => p.post_pct), grp = all.map((p) => (p.cohort === "experimental" ? 1 : 0));
    const covars = useOrder ? [orderCol] : [];
    const a = S.ancova(pre, post, grp, covars);
    const permP = S.permutationP(grp, (lab) => S.ancovaDiff(pre, post, lab, covars), { reps: REPS, seed: SEED });
    Object.assign(result, { ancova: a, permP });
    say(table(["Показатель", "Значение"], [
      ["Скорректированная разница Э − К, п.п.", `${f(a.diff)} ${ci(a.ci)}`],
      [`t(${a.df})`, f(a.t, 2)],
      ["p (параметрический)", pv(a.p)],
      ["p (перестановочный)", pv(permP)],
      ["Частная η²", f(a.partialEta2, 3)],
      ["Наклон по входному баллу", f(a.slope, 2)],
      ["Однородность наклонов (p взаимодействия)", pv(a.slopesP)],
      ...(useOrder ? [["Порядок B→A против A→B, п.п.", `${f(a.covars[0].beta)} ${ci(a.covars[0].ci)}, p = ${pv(a.covars[0].p)}`]] : []),
    ]));
    say();
    const sig = a.p < alpha && permP < alpha;
    say(sig
      ? `**Вывод:** при равном входном уровне экспериментальная группа набрала на итоговом тесте на ${f(a.diff)} п.п. ${a.diff > 0 ? "больше" : "меньше"}; разница статистически значима (оба p < ${alpha}).`
      : `**Вывод:** скорректированная разница ${f(a.diff)} п.п. статистически не значима на уровне α = ${alpha}${a.p < alpha || permP < alpha ? " по обоим критериям одновременно" : ""}. При таком размере выборки это не доказывает отсутствие эффекта (см. раздел 9).`);
    if (a.slopesP < 0.1) { say(); say("⚠️ Наклоны в группах различаются (p взаимодействия < .10): эффект может зависеть от входного уровня, ANCOVA интерпретировать осторожно и опираться на раздел 7."); }
    say();

    // 7. Вторичные
    say("## 7. Вторичные анализы прироста");
    say();
    const gE = E.map((p) => p.post_pct - p.pre_pct), gC = C.map((p) => p.post_pct - p.pre_pct);
    const norm = (p) => (p.pre_pct < 100 ? (p.post_pct - p.pre_pct) / (100 - p.pre_pct) : null);
    const nE = S.finite(E.map(norm)), nC = S.finite(C.map(norm));
    const w = S.welchT(gE, gC), g = S.hedgesG(gE, gC), mw = S.mannWhitney(gE, gC), boot = S.bootstrapDiffCI(gE, gC, { reps: REPS, seed: SEED });
    const wN = nE.length >= 3 && nC.length >= 3 ? S.welchT(nE, nC) : null;
    const mwN = wN ? S.mannWhitney(nE, nC) : null;
    const pHolm = S.holm([w.p, mw.p, wN?.p ?? 1]);
    result.secondary = { welch: w, hedges: g, mannWhitney: mw };
    say(table(["Анализ", "Э", "К", "Разница / эффект", "p", "p (Холм)"], [
      ["Прирост, п.п.: t Уэлча", msd(gE), msd(gC), `${f(w.diff)} ${ci(w.ci)}; g = ${f(g.g, 2)} ${ci(g.ci, 2)}`, pv(w.p), pv(pHolm[0])],
      ["Прирост: Манн–Уитни (точный)", mdn(gE), mdn(gC), `U = ${f(mw.U, 1)}; r = ${f(mw.r, 2)}`, pv(mw.p), pv(pHolm[1])],
      ["Нормированный прирост (Hake): t Уэлча", msd(nE.map((x) => x * 100)), msd(nC.map((x) => x * 100)), wN ? `${f(wN.diff * 100)} п.п.` : "—", pv(wN?.p), wN ? pv(pHolm[2]) : "—"],
    ]));
    say();
    say(`Бутстрэп 95% ДИ разницы приростов: ${ci(boot)} п.п. Нормированный прирост = (после − до) / (100 − до), показан ×100; участники со 100% на входе исключены из этой строки.`);
    say();
  } else {
    say("Недостаточно данных.");
    say();
  }

  // 8. По темам
  say("## 8. По темам (описательно)");
  say();
  say("% верных ответов среди завершивших. На тему приходится 2 вопроса, поэтому проверка значимости по темам не проводится.");
  say();
  const byCode = Object.fromEntries(completers.map((p) => [p.code, p.cohort]));
  const acc = {};
  for (const a of answers) {
    const g = byCode[a.participant];
    if (!g || !a.topic) continue;
    const k = `${a.topic}|${g}|${a.phase}`;
    acc[k] ??= [0, 0];
    acc[k][0] += a.correct ? 1 : 0; acc[k][1] += 1;
  }
  const share = (t, g, ph) => (acc[`${t}|${g}|${ph}`] ? (acc[`${t}|${g}|${ph}`][0] / acc[`${t}|${g}|${ph}`][1]) * 100 : null);
  const topics = Object.keys(TOPIC_RU).filter((t) => GROUPS.some(([g]) => acc[`${t}|${g}|pre`]));
  say(table(["Тема", "Э: до → после", "К: до → после", "Δ Э − Δ К"], topics.map((t) => {
    const dE = share(t, "experimental", "post") - share(t, "experimental", "pre");
    const dC = share(t, "control", "post") - share(t, "control", "pre");
    return [TOPIC_RU[t], `${f(share(t, "experimental", "pre"), 0)} → ${f(share(t, "experimental", "post"), 0)}`,
      `${f(share(t, "control", "pre"), 0)} → ${f(share(t, "control", "post"), 0)}`, f(dE - dC, 0)];
  })));
  say();

  // 9. Мощность
  say("## 9. Чувствительность выборки");
  say();
  const nMin = Math.min(E.length, C.length) || 1;
  const r = completers.length >= 4 ? S.spearman(completers.map((p) => p.pre_pct), completers.map((p) => p.post_pct)).rho : 0;
  const rr = Number.isFinite(r) ? Math.max(0, Math.min(0.95, r)) : 0;
  say(`При ${nMin} завершивших в меньшей группе минимальный эффект, который выявляется с мощностью 80% (α = ${alpha}): ` +
    `d ≈ ${f(S.minDetectableD(Math.max(2, nMin)), 2)} для сравнения приростов и d ≈ ${f(S.minDetectableD(Math.max(3, nMin), { prePostR: rr }), 2)} для ANCOVA ` +
    `(с наблюдаемой связью входного и итогового балла ρ = ${f(rr, 2)}). Эффекты меньше этого выборка надёжно не различает.`);
  say();

  // 10. Разведочный анализ
  say("## 10. Разведочно: вовлечённость и прирост");
  say();
  say("Корреляция Спирмена между показателями вовлечённости и приростом внутри каждой группы. Без поправок — только для обсуждения, не для выводов.");
  say();
  const exp = [];
  for (const [k, label] of [["active_days", "Активные дни"], ["interactions_n", "Обучающих ответов"], ["lessons_opened", "Открыто уроков"], ["xp_total", "Опыт (XP)"]]) {
    const cells = GROUPS.map(([g]) => {
      const rows = by(completers, g).filter((p) => p[k] != null);
      if (rows.length < 5) return "—";
      const s = S.spearman(rows.map((p) => p[k]), rows.map((p) => p.post_pct - p.pre_pct));
      return Number.isFinite(s.rho) ? `ρ = ${f(s.rho, 2)}, p = ${pv(s.p)}` : "—";
    });
    exp.push([label, ...cells]);
  }
  say(table(["Показатель", ...GROUPS.map(([, n]) => n)], exp));
  say();

  return { markdown: out.join("\n"), result };
}

// ── CLI ─────────────────────────────────────────────────────
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) {
    console.error("Использование: npm run analyze -- <папка с participants*.csv и answers_pre_post*.csv>");
    process.exit(1);
  }
  const pFile = findFile(dir, "participants");
  if (!pFile) { console.error(`В ${dir} нет participants*.csv`); process.exit(1); }
  const aFile = findFile(dir, "answers_pre_post");
  const participants = parseCSV(fs.readFileSync(pFile, "utf8"));
  const answers = aFile ? parseCSV(fs.readFileSync(aFile, "utf8")) : [];
  const { markdown } = analyze({ participants, answers });
  const target = path.join(dir, "report.md");
  fs.writeFileSync(target, markdown + "\n");
  console.log(markdown);
  console.error(`\nОтчёт сохранён: ${target}`);
}
