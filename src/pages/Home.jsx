import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import SkillAssessment from "../components/SkillAssessment";

function loadProfile() {
  try { return JSON.parse(localStorage.getItem("userProfile")); }
  catch { return null; }
}
function loadResults() {
  try { return JSON.parse(localStorage.getItem("testResults")) || {}; }
  catch { return {}; }
}

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const FEATURE_LINKS = ["/lessons", "/tests", "/analytics", "/fun"];
const FEATURE_KEYS  = ["lessons", "tests", "analytics", "trainers"];
const FEATURE_COLORS = ["hv2-card-icon-indigo","hv2-card-icon-blue","hv2-card-icon-amber","hv2-card-icon-rose"];
const FEATURE_EMOJIS = ["📚","✅","📊","🎮"];

export default function Home() {
  const { t } = useLanguage();
  const [profile,    setProfile]    = useState(() => loadProfile());
  const [results,    setResults]    = useState(() => loadResults());
  const [showCookie, setShowCookie] = useState(
    () => localStorage.getItem("cookiesChoice") !== "set"
  );
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const sync = () => { setProfile(loadProfile()); setResults(loadResults()); };
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const handleCookie = (accept) => {
    localStorage.setItem("cookiesChoice", "set");
    setShowCookie(false);
    setToastMsg(accept ? t("home.cookie.toastAccept") : t("home.cookie.toastDecline"));
    setTimeout(() => setToastMsg(""), 3500);
  };

  const allScores = Object.values(results);
  const done      = allScores.length;
  const avgPct    = done
    ? Math.round(allScores.reduce((s, r) => s + r.score / r.total * 100, 0) / done)
    : 0;
  const passedAll = done >= 10 && allScores.every(r => r.score / r.total >= 0.75);

  const steps = [
    t("home.how.steps.0", {}),
    t("home.how.steps.1", {}),
    t("home.how.steps.2", {}),
  ];

  return (
    <div className="home-v2">

      {/* ── HERO ── */}
      <section className="hv2-hero">
        <div className="hv2-hero-inner">
          <motion.div className="hv2-chip"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}>
            <span className="hv2-chip-dot" />
            {t("home.chip")}
          </motion.div>

          <motion.h1 className="hv2-title"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            Cyber<span className="hv2-title-gradient">Aware</span>
          </motion.h1>

          <motion.p className="hv2-subtitle"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            {t("home.subtitle")}
          </motion.p>

          <motion.div className="hv2-actions"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <Link to="/lessons" className="hv2-btn-primary">{t("home.cta1")}</Link>
            <Link to="/fun"     className="hv2-btn-secondary">{t("home.cta2")}</Link>
          </motion.div>
        </div>

        <motion.div className="hv2-stats"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.45 }}>
          {[
            { value: "10",  label: t("home.stats.topics")    },
            { value: "50+", label: t("home.stats.questions") },
            { value: "6",   label: t("home.stats.trainers")  },
          ].map(s => (
            <div className="hv2-stat" key={s.label}>
              <span className="hv2-stat-value">{s.value}</span>
              <span className="hv2-stat-label">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── PERSONAL PROGRESS ── */}
      {done > 0 && (
        <section className="hv2-progress-section">
          <motion.div className="hv2-progress-card"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="hv2-progress-left">
              {profile && (
                <div className="hv2-progress-avatar" style={{ background: profile.color }}>
                  {profile.name[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="hv2-progress-greeting">
                  {profile ? t("home.progress.hi", { name: profile.name }) : t("home.progress.welcome")}
                </p>
                <p className="hv2-progress-sub">
                  {passedAll
                    ? t("home.progress.complete")
                    : t("home.progress.done", { done, avg: avgPct })}
                </p>
              </div>
            </div>
            <div className="hv2-progress-bar-wrap">
              <div className="hv2-progress-bar-bg">
                <motion.div className="hv2-progress-bar-fill"
                  initial={{ width: 0 }} whileInView={{ width: `${done * 10}%` }}
                  viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <span className="hv2-progress-pct">{done}/10</span>
            </div>
            <Link to={passedAll ? "/certificate" : "/lessons"} className="hv2-progress-btn">
              {passedAll ? t("home.progress.certificate") : t("home.progress.continue")}
            </Link>
          </motion.div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section className="hv2-features">
        <div className="hv2-features-inner">
          <p className="hv2-section-eyebrow">{t("home.features.eyebrow")}</p>
          <h2 className="hv2-section-title">{t("home.features.title")}</h2>
          <p className="hv2-section-sub">{t("home.features.subtitle")}</p>

          <motion.div className="hv2-cards"
            variants={stagger} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            {FEATURE_KEYS.map((key, i) => (
              <motion.div key={key} variants={fadeUp}>
                <Link to={FEATURE_LINKS[i]} className="hv2-card">
                  <div className={`hv2-card-icon ${FEATURE_COLORS[i]}`}>
                    <span className="hv2-card-emoji">{FEATURE_EMOJIS[i]}</span>
                  </div>
                  <span className="hv2-card-tag">{t(`home.features.${key}.label`)}</span>
                  <p className="hv2-card-title">{t(`home.features.${key}.title`)}</p>
                  <p className="hv2-card-desc">{t(`home.features.${key}.desc`)}</p>
                  <span className="hv2-card-link">{t(`home.features.${key}.link`)}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="hv2-how">
        <div className="hv2-how-inner">
          <p className="hv2-section-eyebrow">{t("home.how.eyebrow")}</p>
          <h2 className="hv2-section-title">{t("home.how.title")}</h2>
          <motion.div className="hv2-steps"
            variants={stagger} initial="hidden"
            whileInView="visible" viewport={{ once: true, margin: "-40px" }}>
            {[0,1,2].map(i => (
              <motion.div key={i} className="hv2-step" variants={fadeUp}>
                <div className="hv2-step-num">{i + 1}</div>
                <h3 className="hv2-step-title">{t(`home.how.steps.${i}.title`)}</h3>
                <p className="hv2-step-desc">{t(`home.how.steps.${i}.desc`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SKILL ASSESSMENT ── */}
      <SkillAssessment />

      {/* ── COOKIE BANNER ── */}
      <AnimatePresence>
        {showCookie && (
          <motion.div className="hv2-cookie"
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}>
            <p>{t("home.cookie.text")}</p>
            <div className="hv2-cookie-actions">
              <button className="hv2-cookie-decline" onClick={() => handleCookie(false)}>
                {t("home.cookie.decline")}
              </button>
              <button className="hv2-cookie-accept" onClick={() => handleCookie(true)}>
                {t("home.cookie.accept")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMsg && (
          <motion.div className="hv2-toast"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}>
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
