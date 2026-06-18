import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

function getHiScore() {
  try { return parseInt(localStorage.getItem("hgHiScore") || "0", 10); } catch { return 0; }
}
function getPhishingRounds() {
  try { return parseInt(localStorage.getItem("phishingRounds") || "0", 10); } catch { return 0; }
}
function getSnCount() {
  try { return parseInt(localStorage.getItem("snCorrect") || "0", 10); } catch { return 0; }
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

export default function FunZone() {
  const { t, lang } = useLanguage();
  const [scores, setScores] = useState({});
  const hiScore = getHiScore();

  const TRAINERS = [
    {
      emoji: "🎮",
      title: t("funzone.trainers.hackerGame.title"),
      desc:  t("funzone.trainers.hackerGame.desc"),
      link: "/hacker-game",
      time: t("funzone.trainers.hackerGame.time"),
      accent: "#7c3aed", bg: "#f5f3ff",
      badge: t("funzone.trainers.hackerGame.badge"), badgeColor: "#7c3aed",
      getScore: () => { const s = getHiScore(); return s > 0 ? t("funzone.trainers.hackerGame.score", { s }) : null; },
    },
    {
      emoji: "🎣",
      title: t("funzone.trainers.phishing.title"),
      desc:  t("funzone.trainers.phishing.desc"),
      link: "/phishing",
      time: t("funzone.trainers.phishing.time"),
      accent: "#f59e0b", bg: "#fffbeb",
      badge: t("funzone.trainers.phishing.badge"), badgeColor: "#d97706",
      getScore: () => { const r = getPhishingRounds(); return r > 0 ? t("funzone.trainers.phishing.score", { s: r }) : null; },
    },
    {
      emoji: "🕵️",
      title: t("funzone.trainers.socialEng.title"),
      desc:  t("funzone.trainers.socialEng.desc"),
      link: "/social-eng",
      time: t("funzone.trainers.socialEng.time"),
      accent: "#10b981", bg: "#ecfdf5",
      badge: t("funzone.trainers.socialEng.badge"), badgeColor: "#059669",
      getScore: () => { const n = getSnCount(); return n > 0 ? t("funzone.trainers.socialEng.score", { s: n }) : null; },
    },
    {
      emoji: "🔗",
      title: t("funzone.trainers.urlScanner.title"),
      desc:  t("funzone.trainers.urlScanner.desc"),
      link: "/url-scanner",
      time: t("funzone.trainers.urlScanner.time"),
      accent: "#3b82f6", bg: "#eff6ff",
      badge: t("funzone.trainers.urlScanner.badge"), badgeColor: "#2563eb",
      getScore: null,
    },
    {
      emoji: "📰",
      title: t("funzone.trainers.fakeNews.title"),
      desc:  t("funzone.trainers.fakeNews.desc"),
      link: "/fake-news",
      time: t("funzone.trainers.fakeNews.time"),
      accent: "#ef4444", bg: "#fef2f2",
      badge: null, getScore: null,
    },
    {
      emoji: "🔐",
      title: t("funzone.trainers.password.title"),
      desc:  t("funzone.trainers.password.desc"),
      link: "/password-checker",
      time: t("funzone.trainers.password.time"),
      accent: "#6366f1", bg: "#eef2ff",
      badge: null, getScore: null,
    },
    {
      emoji: "🗂️",
      title: t("funzone.trainers.dataSort.title"),
      desc:  t("funzone.trainers.dataSort.desc"),
      link: "/data-sort",
      time: t("funzone.trainers.dataSort.time"),
      accent: "#0891b2", bg: "#ecfeff",
      badge: null, getScore: null,
    },
  ];

  useEffect(() => {
    const s = {};
    TRAINERS.forEach(tr => {
      if (tr.getScore) s[tr.link] = tr.getScore();
    });
    setScores(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <div className="fz-page">
      {/* Hero */}
      <div className="fz-hero">
        <div className="fz-hero-glow" />
        <p className="fz-eyebrow">{t("funzone.eyebrow")}</p>
        <h1 className="fz-title">{t("funzone.title")}</h1>
        <p className="fz-subtitle">{t("funzone.subtitle")}</p>
        {hiScore > 0 && (
          <motion.div className="fz-hi-strip"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
            <span>🏆</span>
            <span>{t("funzone.hiScore", { score: hiScore })}</span>
          </motion.div>
        )}
      </div>

      {/* Grid */}
      <div className="fz-grid-wrap">
        <motion.div className="fz-grid"
          variants={containerVariants} initial="hidden" animate="visible">
          {TRAINERS.map((tr) => {
            const score = scores[tr.link];
            return (
              <motion.div key={tr.link} variants={cardVariants}>
                <Link to={tr.link} className="fz-card-link">
                  <motion.div className="fz-card" whileHover={{ y:-5, boxShadow:"0 20px 50px rgba(0,0,0,0.10)" }}>
                    <div className="fz-card-top">
                      <div className="fz-card-icon" style={{ background: tr.bg }}>
                        <span>{tr.emoji}</span>
                      </div>
                      {tr.badge && (
                        <span className="fz-card-badge" style={{ background: tr.bg, color: tr.badgeColor }}>
                          {tr.badge}
                        </span>
                      )}
                    </div>
                    <p className="fz-card-title">{tr.title}</p>
                    <p className="fz-card-desc">{tr.desc}</p>
                    <div className="fz-card-footer">
                      <span className="fz-card-time">⏱ {tr.time}</span>
                      {score && (
                        <span className="fz-card-score" style={{ color: tr.accent }}>
                          {score}
                        </span>
                      )}
                      <span className="fz-card-go" style={{ color: tr.accent }}>{t("funzone.start")}</span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
