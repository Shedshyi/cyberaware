import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { TOPICS } from "../../research/assessmentData";
import {
  loadResearchData, buildParticipants, buildTopicStats,
  buildAnswersLong, buildEventsLong, buildInteractionsLong, downloadCSV,
} from "../../research/researchData";
import { mean, sd, pairedTTest, welchTTest, fmt, fmtP } from "../../research/stats";
import "../../research/research.css";
import { useExperience } from "../../research/experience";

// Вовлечённость: [поле, подпись RU, подпись EN]
const ENGAGEMENT = [
  ["active_days", "Активных дней", "Active days"],
  ["lessons_opened", "Открыто уроков", "Lessons opened"],
  ["practice_attempts", "Попыток практических тестов", "Practice test attempts"],
  ["interactions_n", "Обучающих ответов", "Learning answers"],
  ["median_response_sec", "Медиана времени ответа, с", "Median response time, s"],
  ["hints_used", "Подсказок", "Hints used"],
  ["recs_shown", "Показано рекомендаций", "Recommendations shown"],
  ["recs_clicked", "Переходов по рекомендациям", "Recommendations followed"],
  ["xp_total", "Опыт", "XP"],
  ["badges", "Наград", "Badges"],
];

// Колонки CSV участников: без имени и uuid — только псевдонимизированный код.
const PARTICIPANT_COLUMNS = [
  "code", "cohort", "age", "occupation", "study_group", "prior_training", "self_rating",
  "form_order", "pre_form", "post_form",
  "pre_score", "pre_pct", "pre_duration_sec", "post_score", "post_pct", "post_duration_sec", "gain_pct",
  "practice_tests_done", "practice_attempts", "practice_avg_pct", "lessons_opened", "games_played",
  "days_pre_to_post", "active_days", "interactions_n", "interactions_correct_pct", "hints_used",
  "median_response_sec", "recs_shown", "recs_clicked", "adaptations", "model_level_last",
  "model_profile_last", "model_S_adj_last", "xp_total", "badges", "rank_ups", "daily_goals_met",
  "max_streak", "registered_at", "cohort_assigned_at",
];

function CohortPill({ cohort, en }) {
  if (!cohort) return <span className="rs-pill" style={{ background: "#f3f4f6", color: "#6b7280" }}>—</span>;
  return cohort === "control"
    ? <span className="rs-pill rs-pill-ctrl">{en ? "control" : "контроль"}</span>
    : <span className="rs-pill rs-pill-exp">{en ? "experimental" : "эксперим."}</span>;
}

function Bar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
      <div className="rs-progress" style={{ flex: 1, margin: 0, height: 8 }}>
        <div style={{ width: `${value ?? 0}%`, background: color }} />
      </div>
      <span style={{ width: 44, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value == null ? "—" : `${Math.round(value)}%`}</span>
    </div>
  );
}

export default function ResearchDashboard() {
  const { enabled, loading, user, profile } = useAuth();
  const { lang } = useLanguage();
  const en = lang === "en";

  const [data, setData]   = useState(null);
  const [error, setError] = useState("");
  const [group, setGroup] = useState("");
  const [pool, setPool]   = useState("real");
  const isResearcher = profile?.role === "researcher";
  const { preview, setPreview } = useExperience();

  const reload = () => {
    setError("");
    loadResearchData().then(setData).catch(e => setError(e.message));
  };
  useEffect(() => { if (isResearcher) reload(); }, [isResearcher]);

  const all = useMemo(() => (data ? buildParticipants(data, { pool }) : []), [data, pool]);
  const groups = useMemo(() => [...new Set(all.map(p => p.study_group).filter(Boolean))].sort(), [all]);
  const participants = group ? all.filter(p => p.study_group === group) : all;
  const completers = participants.filter(p => p.pre_pct != null && p.post_pct != null);
  const topicStats = useMemo(
    () => (data ? buildTopicStats(data.answers, new Set(completers.map(p => p.id))) : []),
    [data, completers.map(p => p.id).join()], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!enabled) return <Navigate to="/" replace />;
  if (loading || (user && !profile)) return <div className="rs-page" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isResearcher) {
    return (
      <div className="rs-page">
        <div className="rs-card">
          <h1 className="rs-title">{en ? "Researchers only" : "Только для исследователя"}</h1>
          <p className="rs-lead" style={{ margin: 0 }}>{en
            ? "Your account doesn't have the researcher role. It is assigned with one SQL command in Supabase (see supabase/migrations/002_research.sql)."
            : "У аккаунта нет роли исследователя. Она выдаётся одной SQL-командой в Supabase (см. supabase/migrations/002_research.sql)."}</p>
        </div>
      </div>
    );
  }

  const byCohort = ["experimental", "control"].map(c => {
    const rows = completers.filter(p => p.cohort === c);
    const pre = rows.map(r => r.pre_pct), post = rows.map(r => r.post_pct);
    return { cohort: c, n: rows.length, pre, post, gains: rows.map(r => r.gain_pct), test: pairedTTest(pre, post) };
  });
  const between = welchTTest(byCohort[0].gains, byCohort[1].gains);
  const allPaired = pairedTTest(completers.map(p => p.pre_pct), completers.map(p => p.post_pct));

  const exportAll = () => {
    const suffix = `${pool === "test" ? "_TEST" : ""}${group ? `_${group}` : ""}`;
    downloadCSV(`participants${suffix}.csv`, participants, PARTICIPANT_COLUMNS);
    downloadCSV(`answers_pre_post${suffix}.csv`, buildAnswersLong(data.answers, participants));
    downloadCSV(`events${suffix}.csv`, buildEventsLong(data.events, participants));
    downloadCSV(`interactions${suffix}.csv`, buildInteractionsLong(data.interactions, participants));
  };

  return (
    <div className="rs-page rs-page-wide">
      <span className="rs-eyebrow">{en ? "Researcher" : "Исследователь"}</span>
      <h1 className="rs-title">{en ? "Study results" : "Результаты исследования"}</h1>

      <div className="rs-filters">
        <div className="rs-seg">
          <button type="button" className={pool === "real" ? "on" : ""} onClick={() => setPool("real")}>{en ? "Participants" : "Участники"}</button>
          <button type="button" className={pool === "test" ? "on" : ""} onClick={() => setPool("test")}>🧪 {en ? "Test accounts" : "Тестовые"}</button>
        </div>
        <select className="rs-select" value={group} onChange={e => setGroup(e.target.value)}>
          <option value="">{en ? "All groups" : "Все группы"}</option>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button className="rs-btn rs-btn-outline" onClick={reload}>↻ {en ? "Refresh" : "Обновить"}</button>
        <Link to="/research/admin" className="rs-btn rs-btn-outline">{en ? "Admin panel →" : "Админ-панель →"}</Link>
        <div className="rs-seg" title={en ? "How the site looks to you" : "Как сайт выглядит для тебя"}>
          <button type="button" className={preview !== "traditional" ? "on" : ""} onClick={() => setPreview("full")}>
            {en ? "View: experimental" : "Вид: экспериментальная"}
          </button>
          <button type="button" className={preview === "traditional" ? "on" : ""} onClick={() => setPreview("traditional")}>
            {en ? "View: control" : "Вид: контрольная"}
          </button>
        </div>
        <button className="rs-btn rs-btn-primary" onClick={exportAll} disabled={!data || !participants.length}>
          ⬇ {en ? "Export CSV (4 files)" : "Выгрузить CSV (4 файла)"}
        </button>
      </div>

      {pool === "test" && (
        <p className="rs-note" style={{ margin: "0 0 16px" }}>{en
          ? "🧪 Showing test accounts only. Their exports get the _TEST suffix — don't use them in the thesis."
          : "🧪 Показаны только тестовые аккаунты. Их выгрузка помечается _TEST — в диссертацию её не брать."}</p>
      )}
      {error && <p className="rs-error">{error}</p>}
      {!data && !error && <p className="rs-lead">{en ? "Loading…" : "Загрузка…"}</p>}

      {data && (
        <>
          <div className="rs-kpis">
            <div className="rs-kpi"><div className="rs-kpi-value">{participants.length}</div><div className="rs-kpi-label">{en ? "participants (consented)" : "участников (с согласием)"}</div></div>
            <div className="rs-kpi"><div className="rs-kpi-value">{participants.filter(p => p.pre_pct != null).length}</div><div className="rs-kpi-label">{en ? "took entry test" : "прошли входной тест"}</div></div>
            <div className="rs-kpi"><div className="rs-kpi-value">{completers.length}</div><div className="rs-kpi-label">{en ? "took final test" : "прошли итоговый тест"}</div></div>
            <div className="rs-kpi"><div className="rs-kpi-value">{completers.length ? `${allPaired.meanDiff > 0 ? "+" : ""}${fmt(allPaired.meanDiff, 1)}` : "—"}</div><div className="rs-kpi-label">{en ? "mean gain, pp" : "средний прирост, п.п."}</div></div>
          </div>

          <div className="rs-card">
            <h3>{en ? "Entry vs. final test" : "Входной и итоговый тест"}</h3>
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>{en ? "Group" : "Группа"}</th><th className="num">n</th>
                    <th className="num">{en ? "Pre, M (SD)" : "До, M (SD)"}</th>
                    <th className="num">{en ? "Post, M (SD)" : "После, M (SD)"}</th>
                    <th className="num">{en ? "Gain" : "Прирост"}</th>
                    <th className="num">t (df)</th><th className="num">p</th><th className="num">Cohen's d</th>
                  </tr>
                </thead>
                <tbody>
                  {byCohort.map(c => (
                    <tr key={c.cohort}>
                      <td><CohortPill cohort={c.cohort} en={en} /></td>
                      <td className="num">{c.n}</td>
                      <td className="num">{fmt(mean(c.pre), 1)} ({fmt(sd(c.pre), 1)})</td>
                      <td className="num">{fmt(mean(c.post), 1)} ({fmt(sd(c.post), 1)})</td>
                      <td className="num">{fmt(c.test.meanDiff, 1)}</td>
                      <td className="num">{fmt(c.test.t)} ({c.test.n > 1 ? c.test.df : "—"})</td>
                      <td className="num">{fmtP(c.test.p)}</td>
                      <td className="num">{fmt(c.test.d)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rs-note">
              {en ? "Paired t-test within each group (pre → post). " : "Внутри групп — парный t-тест (до → после). "}
              <b>{en ? "Gain, experimental vs. control (Welch's t-test): " : "Прирост: экспериментальная против контрольной (t-тест Уэлча): "}</b>
              t = {fmt(between.t)}, df = {fmt(between.df, 1)}, p = {fmtP(between.p)}, d = {fmt(between.d)}.
              {" "}{en
                ? "Use these as a preview; run the final analysis on the exported CSV."
                : "Это предварительный расчёт: финальный анализ делай по выгруженному CSV."}
            </p>
          </div>

          <div className="rs-card">
            <h3>{en ? "Engagement by group (means)" : "Вовлечённость по группам (средние)"}</h3>
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>{en ? "Metric" : "Показатель"}</th>
                    <th className="num">{en ? "Experimental" : "Эксперим."}</th>
                    <th className="num">{en ? "Control" : "Контроль"}</th>
                  </tr>
                </thead>
                <tbody>
                  {ENGAGEMENT.map(([key, ru, enLabel]) => (
                    <tr key={key}>
                      <td>{en ? enLabel : ru}</td>
                      {["experimental", "control"].map(c => {
                        const vals = participants.filter(p => p.cohort === c).map(p => p[key]).filter(Number.isFinite);
                        return <td key={c} className="num">{vals.length ? `${fmt(mean(vals), 1)} (${fmt(sd(vals), 1)})` : "—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rs-note">{en
              ? "Mean (SD) over all consented participants of the group. Recommendations, XP and badges exist only in the experimental group by design."
              : "Среднее (SD) по всем участникам группы с согласием. Рекомендации, опыт и награды по дизайну есть только у экспериментальной группы."}</p>
          </div>

          <div className="rs-card">
            <h3>{en ? "Correct answers by topic (participants with both tests)" : "Верные ответы по темам (участники с обоими тестами)"}</h3>
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead><tr><th>{en ? "Topic" : "Тема"}</th><th>{en ? "Pre" : "До"}</th><th>{en ? "Post" : "После"}</th></tr></thead>
                <tbody>
                  {topicStats.map(t => (
                    <tr key={t.topic}>
                      <td>{TOPICS[t.topic][en ? "en" : "ru"]}</td>
                      <td><Bar value={t.pre} color="#a5b4fc" /></td>
                      <td><Bar value={t.post} color="#6366f1" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rs-card">
            <h3>{en ? "Participants" : "Участники"}</h3>
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>{en ? "Code" : "Код"}</th><th>{en ? "Name" : "Имя"}</th><th>{en ? "Group" : "Группа"}</th><th>{en ? "Cohort" : "Выборка"}</th>
                    <th className="num">{en ? "Pre" : "До"}</th><th className="num">{en ? "Post" : "После"}</th><th className="num">Δ</th>
                    <th className="num">{en ? "Tests" : "Тесты"}</th><th className="num">{en ? "Lessons" : "Уроки"}</th><th className="num">{en ? "Games" : "Игры"}</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.id}>
                      <td>{p.code}</td><td>{p.name}</td><td>{p.study_group || "—"}</td>
                      <td><CohortPill cohort={p.cohort} en={en} /></td>
                      <td className="num">{p.pre_pct == null ? "—" : `${Math.round(p.pre_pct)}%`}</td>
                      <td className="num">{p.post_pct == null ? "—" : `${Math.round(p.post_pct)}%`}</td>
                      <td className="num">{p.gain_pct == null ? "—" : `${p.gain_pct > 0 ? "+" : ""}${Math.round(p.gain_pct)}`}</td>
                      <td className="num">{p.practice_tests_done}</td>
                      <td className="num">{p.lessons_opened}</td>
                      <td className="num">{p.games_played}</td>
                    </tr>
                  ))}
                  {!participants.length && (
                    <tr><td colSpan={10} style={{ color: "#9ca3af" }}>{en ? "No participants yet" : "Участников пока нет"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="rs-note">{en
              ? "Names are shown only here. CSV exports contain pseudonymous codes (P001…) without names or emails."
              : "Имена видны только здесь. В CSV вместо имён и email — коды участников (P001…)."}</p>
          </div>
        </>
      )}
    </div>
  );
}
