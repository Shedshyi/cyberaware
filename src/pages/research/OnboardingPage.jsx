import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { assignCohort, getProfile, logEvent, saveOnboarding, saveProfile } from "../../lib/store";
import "../../research/research.css";

const OCCUPATIONS = [
  { v: "bachelor", ru: "Студент бакалавриата", en: "Undergraduate student" },
  { v: "master",   ru: "Магистрант",           en: "Master's student" },
  { v: "school",   ru: "Школьник",             en: "School student" },
  { v: "employed", ru: "Работаю",              en: "Employed" },
  { v: "other",    ru: "Другое",               en: "Other" },
];

function ConsentText({ en }) {
  return en ? (
    <div className="rs-consent-text">
      <p><b>Study:</b> evaluating the effectiveness of an interactive cyber-literacy course.</p>
      <ul>
        <li>You will take a short entry test (20 questions, ~10 min), study the course at your own pace, then take a final test.</li>
        <li>We record your answers, test scores, time spent and which lessons/trainers you open.</li>
        <li>Data is used only in aggregated form for a master's thesis. Your name and email are never published.</li>
        <li>Participation is voluntary. You may stop at any time and ask for your data to be deleted.</li>
      </ul>
    </div>
  ) : (
    <div className="rs-consent-text">
      <p><b>Исследование:</b> оценка эффективности интерактивного курса по киберграмотности.</p>
      <ul>
        <li>Ты пройдёшь короткий входной тест (20 вопросов, ~10 минут), затем изучишь курс в удобном темпе и пройдёшь итоговый тест.</li>
        <li>Записываются ответы, баллы, затраченное время и то, какие уроки и тренажёры ты открывал(а).</li>
        <li>Данные используются только в обобщённом виде для магистерской диссертации. Имя и email нигде не публикуются.</li>
        <li>Участие добровольное. Можно прекратить в любой момент и попросить удалить свои данные.</li>
      </ul>
    </div>
  );
}

export default function OnboardingPage() {
  const { enabled, loading, user, profile, refreshProfile, signOut } = useAuth();
  const { lang } = useLanguage();
  const en = lang === "en";
  const navigate = useNavigate();
  const local = getProfile();

  const [name, setName]               = useState(profile?.display_name || local?.name || "");
  const [age, setAge]                 = useState(profile?.age ?? "");
  const [occupation, setOccupation]   = useState(profile?.occupation ?? "");
  const [studyGroup, setStudyGroup]   = useState(profile?.study_group ?? "");
  const [prior, setPrior]             = useState(profile?.prior_training ?? null);
  const [selfRating, setSelfRating]   = useState(profile?.self_rating ?? null);
  const [agree, setAgree]             = useState(false);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState("");

  if (!enabled) return <Navigate to="/" replace />;
  if (!loading && !user) return <Navigate to="/login" replace />;
  if (profile?.consent) return <Navigate to="/research/pre" replace />;

  const ageNum = parseInt(age, 10);
  const valid = agree && name.trim() && ageNum >= 10 && ageNum <= 100 && occupation && prior !== null && selfRating;

  const submit = async () => {
    if (!valid) {
      setError(en ? "Please fill in all required fields and give consent." : "Заполни обязательные поля и подтверди согласие.");
      return;
    }
    setBusy(true); setError("");
    const res = await saveOnboarding({
      display_name: name.trim(),
      age: ageNum,
      occupation,
      study_group: studyGroup.trim() || null,
      prior_training: prior,
      self_rating: selfRating,
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error?.message || (en ? "Could not save. Try again." : "Не удалось сохранить. Попробуй ещё раз."));
      return;
    }
    const cohort = await assignCohort();
    if (cohort) {
      logEvent("cohort_assigned", { cohort });
      try { sessionStorage.setItem("cohortAssigned", "1"); } catch { /* ignore */ }
    }
    await saveProfile({ name: name.trim(), color: local?.color || "#6366f1", joined: profile?.created_at || new Date().toISOString() });
    await refreshProfile();
    navigate("/research/pre", { replace: true });
  };

  return (
    <div className="rs-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <span className="rs-eyebrow">{en ? "Step 1 of 3" : "Шаг 1 из 3"}</span>
        <h1 className="rs-title">{en ? "Welcome to the study" : "Добро пожаловать в исследование"}</h1>
        <p className="rs-lead">{en
          ? "A few questions about you, then a short entry test. After that the whole course is open."
          : "Несколько вопросов о тебе, затем короткий входной тест. После этого откроется весь курс."}</p>

        <div className="rs-card">
          <h3>{en ? "Informed consent" : "Информированное согласие"}</h3>
          <ConsentText en={en} />
          <label className="rs-check">
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
            <span>{en ? "I have read the information above and agree to participate" : "Я ознакомился(-ась) с информацией и согласен(-на) участвовать"}</span>
          </label>
        </div>

        <div className="rs-card">
          <h3>{en ? "About you" : "О тебе"}</h3>
          <div className="rs-grid">
            <div className="rs-field">
              <label>{en ? "Name or nickname *" : "Имя или никнейм *"}</label>
              <input className="rs-input" value={name} maxLength={32} onChange={e => setName(e.target.value)} />
            </div>
            <div className="rs-field">
              <label>{en ? "Age *" : "Возраст *"}</label>
              <input className="rs-input" type="number" inputMode="numeric" min={10} max={100} value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div className="rs-field">
              <label>{en ? "Occupation *" : "Род занятий *"}</label>
              <select className="rs-select" value={occupation} onChange={e => setOccupation(e.target.value)}>
                <option value="">{en ? "Choose…" : "Выбери…"}</option>
                {OCCUPATIONS.map(o => <option key={o.v} value={o.v}>{en ? o.en : o.ru}</option>)}
              </select>
            </div>
            <div className="rs-field">
              <label>{en ? "Group / course" : "Группа / курс"} <span className="rs-hint">{en ? "(optional, e.g. SE-2203)" : "(необязательно, напр. SE-2203)"}</span></label>
              <input className="rs-input" value={studyGroup} maxLength={40} onChange={e => setStudyGroup(e.target.value)} />
            </div>
            <div className="rs-field rs-field-full">
              <label>{en ? "Have you had any cybersecurity training before? *" : "Проходил(а) ли ты раньше обучение по кибербезопасности? *"}</label>
              <div className="rs-seg">
                <button type="button" className={prior === true ? "on" : ""} onClick={() => setPrior(true)}>{en ? "Yes" : "Да"}</button>
                <button type="button" className={prior === false ? "on" : ""} onClick={() => setPrior(false)}>{en ? "No" : "Нет"}</button>
              </div>
            </div>
            <div className="rs-field rs-field-full">
              <label>{en ? "Rate your cyber-literacy *" : "Оцени свою киберграмотность *"}</label>
              <div className="rs-scale">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" className={selfRating === n ? "on" : ""} onClick={() => setSelfRating(n)}>{n}</button>
                ))}
              </div>
              <div className="rs-scale-legend">
                <span>{en ? "very low" : "очень низкая"}</span>
                <span>{en ? "very high" : "очень высокая"}</span>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="rs-error">{error}</p>}
        <div className="rs-actions">
          <button className="rs-btn rs-btn-primary" onClick={submit} disabled={busy}>
            {busy ? "…" : en ? "Continue to entry test →" : "Перейти к входному тесту →"}
          </button>
          <button className="rs-btn rs-btn-ghost" onClick={async () => { await signOut(); navigate("/"); }}>
            {en ? "Don't participate, use as guest" : "Не участвовать, пользоваться как гость"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
