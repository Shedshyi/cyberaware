import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

function loadProfile() {
  try { return JSON.parse(localStorage.getItem("userProfile")); }
  catch { return null; }
}
function loadResults() {
  try { return JSON.parse(localStorage.getItem("testResults")) || {}; }
  catch { return {}; }
}

export default function Header() {
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  const [profile, setProfile] = useState(() => loadProfile());
  const [done,    setDone]    = useState(() => Object.keys(loadResults()).length);
  const [open,    setOpen]    = useState(false);
  const [theme,   setTheme]   = useState(() => localStorage.getItem("theme") || "light");

  const NAV = [
    { to: "/lessons",   label: t("nav.lessons")  },
    { to: "/tests",     label: t("nav.tests")    },
    { to: "/fun",       label: t("nav.trainers") },
    { to: "/analytics", label: t("nav.analytics")},
  ];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => {
      setProfile(loadProfile());
      setDone(Object.keys(loadResults()).length);
    };
    window.addEventListener("focus",   sync);
    window.addEventListener("storage", sync);
    const iv = setInterval(sync, 1500);
    return () => {
      window.removeEventListener("focus",   sync);
      window.removeEventListener("storage", sync);
      clearInterval(iv);
    };
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <motion.header
        className="hdr-root"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="hdr-inner">

          <Link to="/" className="hdr-logo">
            <span className="hdr-logo-icon">🔐</span>
            <span className="hdr-logo-text">CyberAware</span>
          </Link>

          <nav className="hdr-nav">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`hdr-link${location.pathname === to ? " hdr-link-active" : ""}`}
              >
                {label}
              </Link>
            ))}
            {done > 0 && (
              <Link to="/analytics" className="hdr-progress-pill">
                {t("nav.progress", { done })}
              </Link>
            )}
          </nav>

          <div className="hdr-right">
            {/* Language toggle */}
            <button
              className="hdr-lang"
              onClick={() => setLang(lang === "ru" ? "en" : "ru")}
              title={lang === "ru" ? "Switch to English" : "Переключить на русский"}
            >
              {lang === "ru" ? "EN" : "RU"}
            </button>

            {/* Theme toggle */}
            <button
              className="hdr-theme"
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              title={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <Link
              to="/profile"
              className={`hdr-avatar${location.pathname === "/profile" ? " hdr-avatar-active" : ""}`}
              title={profile ? profile.name : t("nav.profile")}
            >
              {profile
                ? <span style={{ background: profile.color }}>{profile.name[0].toUpperCase()}</span>
                : <span className="hdr-avatar-empty">👤</span>
              }
            </Link>
            <button
              className={`hdr-burger${open ? " hdr-burger-open" : ""}`}
              onClick={() => setOpen(o => !o)}
              aria-label="Меню"
            >
              <span /><span /><span />
            </button>
          </div>

        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="hdr-mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{   opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`hdr-mobile-link${location.pathname === to ? " hdr-mobile-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/profile"
              className={`hdr-mobile-link${location.pathname === "/profile" ? " hdr-mobile-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {profile ? t("nav.mobileProfile", { name: profile.name }) : t("nav.profile")}
            </Link>
            {done > 0 && (
              <div className="hdr-mobile-progress">
                <span>{t("nav.mobileCourse")}</span>
                <strong>{t("nav.mobileTests", { done })}</strong>
              </div>
            )}
            <button
              className="hdr-mobile-link"
              style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              onClick={() => { setLang(lang === "ru" ? "en" : "ru"); setOpen(false); }}
            >
              🌐 {lang === "ru" ? "Switch to English" : "Переключить на русский"}
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
