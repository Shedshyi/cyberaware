import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { loadResearchData, buildParticipants, setTestAccount } from "../../research/researchData";
import {
  buildAdminRows, buildFunnel, cohortBalance, buildTimeline, relativeTime, hoursSince,
  STEPS, STEP_TEXT, POST_MIN_PRACTICE,
} from "../../research/admin";
import "../../research/research.css";
import "../../research/admin.css";

const OCCUPATION = {
  bachelor: ["Бакалавриат", "Undergraduate"], master: ["Магистратура", "Master's"], school: ["Школьник", "School"],
  employed: ["Работает", "Employed"], other: ["Другое", "Other"],
};
const INACTIVE_HOURS = 72;

function CohortPill({ cohort, en }) {
  if (!cohort) return <span className="rs-pill ad-pill-none">{en ? "no group" : "без группы"}</span>;
  return cohort === "control"
    ? <span className="rs-pill rs-pill-ctrl">{en ? "control" : "контроль"}</span>
    : <span className="rs-pill rs-pill-exp">{en ? "experimental" : "эксперим."}</span>;
}

function StepBadge({ row, en }) {
  const label = STEP_TEXT[en ? "en" : "ru"][row.step];
  const extra = row.step === "learning" ? ` ${row.practiceDone}/${POST_MIN_PRACTICE}` : "";
  return <span className={`ad-step ad-step-${row.step}`}>{label}{extra}</span>;
}

const pct = (v) => (v == null ? "—" : `${Math.round(v)}%`);
const date = (iso, en) => (iso ? new Date(iso).toLocaleString(en ? "en-GB" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export default function ResearchAdmin() {
  const { enabled, loading, user, profile } = useAuth();
  const { lang } = useLanguage();
  const en = lang === "en";
  const L = en ? "en" : "ru";
  const isResearcher = profile?.role === "researcher";

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [pool, setPool] = useState("real");
  const [query, setQuery] = useState("");
  const [cohort, setCohort] = useState("");
  const [step, setStep] = useState("");
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    setError("");
    return loadResearchData().then(setData).catch(e => setError(e.message));
  };
  useEffect(() => { if (isResearcher) reload(); }, [isResearcher]);

  const rows = useMemo(() => {
    if (!data) return [];
    return buildAdminRows(data, buildParticipants(data, { pool }), pool)
      .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));
  }, [data, pool]);
  const funnel = useMemo(() => buildFunnel(rows), [rows]);
  const balance = cohortBalance(rows);
  const inactive = rows.filter(r => r.step !== "done" && r.profile.consent && hoursSince(r.lastSeen) > INACTIVE_HOURS);

  const q = query.trim().toLowerCase();
  const shown = rows.filter(r =>
    (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)) &&
    (!cohort || (cohort === "none" ? !r.cohort : r.cohort === cohort)) &&
    (!step || r.step === step));
  const open = rows.find(r => r.id === openId) || null;

  if (!enabled) return <Navigate to="/" replace />;
  if (loading || (user && !profile)) return <div className="rs-page" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isResearcher) return <Navigate to="/research/dashboard" replace />;

  const toggleTest = async (row) => {
    const next = !row.is_test;
    const msg = next
      ? (en ? `Mark ${row.name || row.code} as a test account? It will disappear from study results and exports.` : `Пометить «${row.name || row.code}» тестовым? Аккаунт пропадёт из результатов исследования и выгрузки.`)
      : (en ? `Return ${row.name || row.code} to real participants?` : `Вернуть «${row.name || row.code}» в настоящие участники?`);
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await setTestAccount(row.id, next);
      await reload();
      setOpenId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rs-page rs-page-wide">
      <span className="rs-eyebrow">{en ? "Researcher" : "Исследователь"}</span>
      <h1 className="rs-title">{en ? "Admin panel" : "Админ-панель"}</h1>

      <div className="rs-filters">
        <div className="rs-seg">
          <button type="button" className={pool === "real" ? "on" : ""} onClick={() => { setPool("real"); setOpenId(null); }}>
            {en ? "Participants" : "Участники"}
          </button>
          <button type="button" className={pool === "test" ? "on" : ""} onClick={() => { setPool("test"); setOpenId(null); }}>
            🧪 {en ? "Test accounts" : "Тестовые"}
          </button>
        </div>
        <button className="rs-btn rs-btn-outline" onClick={reload}>↻ {en ? "Refresh" : "Обновить"}</button>
        <Link to="/research/dashboard" className="rs-btn rs-btn-outline">{en ? "Study results →" : "Результаты исследования →"}</Link>
      </div>

      {pool === "test" && (
        <p className="ad-banner">{en
          ? "Test accounts have their own group balance and never appear in study results or exports."
          : "У тестовых аккаунтов свой баланс групп. В результаты исследования и выгрузку они не попадают."}</p>
      )}
      {error && <p className="rs-error">{error}</p>}
      {!data && !error && <p className="rs-lead">{en ? "Loading…" : "Загрузка…"}</p>}

      {data && (
        <>
          <div className="rs-kpis">
            <div className="rs-kpi"><div className="rs-kpi-value">{rows.length}</div><div className="rs-kpi-label">{en ? "registered" : "зарегистрировались"}</div></div>
            <div className="rs-kpi">
              <div className="rs-kpi-value">{balance.experimental} : {balance.control}</div>
              <div className="rs-kpi-label">{en ? "experimental : control" : "эксперим. : контроль"}{balance.diff > 1 ? " ⚠️" : ""}</div>
            </div>
            <div className="rs-kpi"><div className="rs-kpi-value">{funnel.find(f => f.step === "done").total}</div><div className="rs-kpi-label">{en ? "finished" : "завершили"}</div></div>
            <div className="rs-kpi">
              <div className="rs-kpi-value">{inactive.length}</div>
              <div className="rs-kpi-label">{en ? `inactive > ${INACTIVE_HOURS / 24} days` : `не заходили > ${INACTIVE_HOURS / 24} дн`}</div>
            </div>
          </div>

          <div className="rs-card">
            <h3>{en ? "Who is at which step" : "Кто на каком шаге"}</h3>
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>{en ? "Reached the step" : "Дошли до шага"}</th>
                    <th className="num">{en ? "Experimental" : "Эксперим."}</th>
                    <th className="num">{en ? "Control" : "Контроль"}</th>
                    <th className="num">{en ? "No group" : "Без группы"}</th>
                    <th className="num">{en ? "Total" : "Всего"}</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.map(f => (
                    <tr key={f.step}>
                      <td>{f.step === "registered" ? (en ? "Registered" : "Регистрация") : f.step === "pre" ? (en ? "Consent given" : "Дали согласие")
                        : f.step === "learning" ? (en ? "Entry test done" : "Прошли входной тест")
                        : f.step === "ready" ? (en ? `${POST_MIN_PRACTICE}+ practice tests` : `${POST_MIN_PRACTICE}+ практических тестов`)
                        : (en ? "Final test done" : "Прошли итоговый тест")}</td>
                      <td className="num">{f.experimental}</td>
                      <td className="num">{f.control}</td>
                      <td className="num">{f.none || "—"}</td>
                      <td className="num"><b>{f.total}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rs-note">{en
              ? `Each row counts everyone who got to that step or further. Groups are assigned at consent and kept equal (difference ≤ 1). The final test opens after ${POST_MIN_PRACTICE} different practice tests.`
              : `В строке — все, кто дошёл до шага или дальше. Группа назначается при согласии, группы держатся поровну (разница не больше 1). Итоговый тест открывается после ${POST_MIN_PRACTICE} разных практических тестов.`}</p>
          </div>

          <div className="rs-card">
            <h3>{en ? "Participants" : "Участники"} <span className="ad-count">{shown.length}</span></h3>
            <div className="rs-filters ad-filters">
              <input className="rs-input" placeholder={en ? "Search by name or code" : "Поиск по имени или коду"} value={query} onChange={e => setQuery(e.target.value)} />
              <select className="rs-select" value={cohort} onChange={e => setCohort(e.target.value)}>
                <option value="">{en ? "All groups" : "Все группы"}</option>
                <option value="experimental">{en ? "Experimental" : "Экспериментальная"}</option>
                <option value="control">{en ? "Control" : "Контрольная"}</option>
                <option value="none">{en ? "No group" : "Без группы"}</option>
              </select>
              <select className="rs-select" value={step} onChange={e => setStep(e.target.value)}>
                <option value="">{en ? "All steps" : "Все шаги"}</option>
                {STEPS.map(s => <option key={s} value={s}>{STEP_TEXT[L][s]}</option>)}
              </select>
            </div>
            <div className="rs-table-wrap">
              <table className="rs-table ad-table">
                <thead>
                  <tr>
                    <th>{en ? "Code" : "Код"}</th><th>{en ? "Name" : "Имя"}</th><th>{en ? "Group" : "Группа"}</th><th>{en ? "Step" : "Шаг"}</th>
                    <th className="num">{en ? "Entry" : "Вход"}</th><th className="num">{en ? "Final" : "Итог"}</th>
                    <th className="num">{en ? "Lessons" : "Уроки"}</th><th className="num">{en ? "Days" : "Дней"}</th>
                    <th>{en ? "Last active" : "Активность"}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(r => {
                    const m = r.metrics;
                    const stale = r.step !== "done" && r.profile.consent && hoursSince(r.lastSeen) > INACTIVE_HOURS;
                    return (
                      <tr key={r.id} className={`ad-row${openId === r.id ? " on" : ""}`} onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                        <td>{r.code}</td>
                        <td className="ad-name">{r.name || <span className="ad-muted">{en ? "no name" : "без имени"}</span>}</td>
                        <td><CohortPill cohort={r.cohort} en={en} /></td>
                        <td><StepBadge row={r} en={en} /></td>
                        <td className="num">{pct(m?.pre_pct)}</td>
                        <td className="num">{pct(m?.post_pct)}</td>
                        <td className="num">{m?.lessons_opened ?? "—"}</td>
                        <td className="num">{m?.active_days ?? "—"}</td>
                        <td className={stale ? "ad-stale" : ""}>{relativeTime(r.lastSeen, L)}</td>
                      </tr>
                    );
                  })}
                  {!shown.length && (
                    <tr><td colSpan={9} className="ad-muted">{rows.length ? (en ? "Nobody matches the filters" : "Под фильтры никто не подходит") : (en ? "Nobody here yet" : "Пока никого нет")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="rs-note">{en
              ? "Click a row to open the participant card. Red time — no activity for more than 3 days."
              : "Нажми на строку, чтобы открыть карточку участника. Красное время — не заходил больше 3 дней."}</p>
          </div>

          {open && <ParticipantCard row={open} data={data} en={en} busy={busy} onClose={() => setOpenId(null)} onToggleTest={() => toggleTest(open)} />}
        </>
      )}
    </div>
  );
}

function ParticipantCard({ row, data, en, busy, onClose, onToggleTest }) {
  const L = en ? "en" : "ru";
  const p = row.profile, m = row.metrics;
  const timeline = useMemo(() => buildTimeline(row.id, data, L), [row.id, data, L]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const info = [
    [en ? "Age" : "Возраст", p.age ?? "—"],
    [en ? "Occupation" : "Занятость", OCCUPATION[p.occupation]?.[en ? 1 : 0] ?? p.occupation ?? "—"],
    [en ? "Study group" : "Учебная группа", p.study_group || "—"],
    [en ? "Prior training" : "Обучался ИБ раньше", p.prior_training == null ? "—" : p.prior_training ? (en ? "yes" : "да") : (en ? "no" : "нет")],
    [en ? "Self-rating" : "Самооценка", p.self_rating ? `${p.self_rating}/5` : "—"],
    [en ? "Registered" : "Регистрация", date(p.created_at, en)],
    [en ? "Group assigned" : "Группа назначена", date(p.cohort_assigned_at, en)],
    [en ? "Test forms (entry → final)" : "Варианты теста (вход → итог)",
      p.form_order ? `${p.form_order[0]} → ${p.form_order[1]}${m?.pre_form && m.pre_form !== p.form_order[0] ? (en ? ` (actual entry: ${m.pre_form})` : ` (на входе писал ${m.pre_form})`) : ""}` : "—"],
    [en ? "Last active" : "Последняя активность", date(row.lastSeen, en)],
  ];
  const stats = m ? [
    [en ? "Entry → final" : "Вход → итог", `${pct(m.pre_pct)} → ${pct(m.post_pct)}${m.gain_pct != null ? ` (${m.gain_pct > 0 ? "+" : ""}${Math.round(m.gain_pct)})` : ""}`],
    [en ? "Practice tests" : "Практических тестов", `${m.practice_tests_done} (${m.practice_attempts} ${en ? "attempts" : "попыток"})`],
    [en ? "Lessons opened" : "Уроков открыто", m.lessons_opened],
    [en ? "Learning answers" : "Обучающих ответов", m.interactions_n ? `${m.interactions_n} · ${pct(m.interactions_correct_pct)} ${en ? "correct" : "верно"}` : 0],
    [en ? "Hints" : "Подсказок", m.hints_used],
    ...(row.cohort === "experimental" ? [
      [en ? "Games" : "Игр", m.games_played],
      ["XP", m.xp_total ?? 0],
      [en ? "Badges" : "Наград", m.badges],
      [en ? "Recommendations" : "Рекомендаций", `${m.recs_shown} ${en ? "shown" : "показано"} · ${m.recs_clicked} ${en ? "followed" : "нажато"}`],
      [en ? "Model" : "Модель", m.model_level_last ? `${m.model_level_last} · ${m.model_profile_last}` : "—"],
    ] : []),
  ] : [];

  return (
    <div className="ad-overlay" onClick={onClose}>
      <aside className="ad-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <header className="ad-card-head">
          <div>
            <div className="ad-card-code">{row.code}{row.is_test ? " · 🧪" : ""}</div>
            <h2 className="ad-card-name">{row.name || (en ? "No name" : "Без имени")}</h2>
            <div className="ad-card-tags"><CohortPill cohort={row.cohort} en={en} /><StepBadge row={row} en={en} /></div>
          </div>
          <button className="ad-close" onClick={onClose} aria-label={en ? "Close" : "Закрыть"}>✕</button>
        </header>

        <dl className="ad-grid">
          {info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        {stats.length > 0 && (
          <dl className="ad-grid ad-grid-stats">
            {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        )}

        <h3 className="ad-sub">{en ? "Timeline" : "Хронология"}</h3>
        {!timeline.length && <p className="ad-muted">{en ? "No activity yet" : "Пока ничего не делал"}</p>}
        <div className="ad-timeline">
          {timeline.map(d => (
            <section key={d.date} className="ad-day">
              <div className="ad-day-head">
                <b>{new Date(d.date + "T12:00:00").toLocaleDateString(en ? "en-GB" : "ru-RU", { weekday: "short", day: "numeric", month: "long" })}</b>
                <span className="ad-muted">
                  {[
                    ...d.answers.map(a => `${a.label}: ${a.correct}/${a.n}${a.hints ? ` · ${a.hints} ${en ? "hints" : "подск."}` : ""}`),
                    d.xp ? `+${d.xp} XP` : null,
                    d.recs ? `${d.recs} ${en ? "recs shown" : "рекоменд."}` : null,
                  ].filter(Boolean).join(" · ")}
                </span>
              </div>
              <ul>
                {d.items.map((it, i) => (
                  <li key={i} className={it.strong ? "ad-strong" : ""}>
                    <span className="ad-time">{new Date(it.at).toLocaleTimeString(en ? "en-GB" : "ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span aria-hidden="true">{it.icon}</span> {it.text}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="ad-card-foot">
          <button className="rs-btn rs-btn-outline" disabled={busy} onClick={onToggleTest}>
            {row.is_test ? (en ? "Return to participants" : "Вернуть в участники") : (en ? "🧪 Mark as test account" : "🧪 Пометить тестовым")}
          </button>
          <p className="rs-note">{en
            ? "The group cannot be changed here: that would break random assignment."
            : "Группу здесь сменить нельзя: это сломало бы случайное распределение."}</p>
        </footer>
      </aside>
    </div>
  );
}
