import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../auth/AuthContext";
import { getProfile, getTestResults } from "../lib/store";
import { useExperience } from "../research/experience";
import "./header.css";

const TOTAL_TESTS = 10;

// Страницы тренажёров — чтобы пункт «Тренажёры» подсвечивался и внутри них
const TRAINER_PATHS = ["/fun", "/fake-news", "/phishing", "/data-sort", "/hacker-game", "/password-checker", "/social-eng", "/url-scanner"];

function isActive(to, pathname) {
  if (to === "/lessons") return pathname.startsWith("/lessons");
  if (to === "/tests") return pathname === "/tests" || pathname.startsWith("/test/");
  if (to === "/fun") return TRAINER_PATHS.some(p => pathname === p);
  return pathname === to;
}

// ── Иконки ───────────────────────────────────────────────────
const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="nav-logo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#818cf8" />
        <stop offset="1" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
    <path d="M16 2.5 4.5 7v8.2c0 7.1 4.9 12.6 11.5 14.3 6.6-1.7 11.5-7.2 11.5-14.3V7L16 2.5Z" fill="url(#nav-logo-g)" />
    <path d="m11 16.2 3.4 3.4 6.8-7.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
  </svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
  </svg>
);
const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function ProgressRing({ done, total }) {
  const r = 9, c = 2 * Math.PI * r, frac = Math.min(1, done / total);
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="nav-ring">
      <circle cx="12" cy="12" r={r} className="nav-ring-bg" />
      <circle
        cx="12" cy="12" r={r}
        className="nav-ring-fg"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - frac)}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

// ── Меню аватара ─────────────────────────────────────────────
function AccountMenu({ profile, en, onClose }) {
  const { enabled, user, profile: remote, signOut } = useAuth();
  const navigate = useNavigate();
  const isResearcher = remote?.role === "researcher";
  return (
    <motion.div
      className="nav-menu"
      role="menu"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <div className="nav-menu-head">
        <span className="nav-menu-name">{profile?.name || (en ? "Guest" : "Гость")}</span>
        <span className="nav-menu-sub">{user ? user.email : en ? "Progress saved in this browser" : "Прогресс хранится в браузере"}</span>
      </div>
      <Link to="/profile" className="nav-menu-item" role="menuitem" onClick={onClose}>{en ? "Profile" : "Профиль"}</Link>
      <Link to="/analytics" className="nav-menu-item" role="menuitem" onClick={onClose}>{en ? "My progress" : "Мой прогресс"}</Link>
      {isResearcher && (
        <Link to="/research/dashboard" className="nav-menu-item" role="menuitem" onClick={onClose}>{en ? "Study results" : "Результаты исследования"}</Link>
      )}
      {enabled && (
        user ? (
          <button className="nav-menu-item nav-menu-danger" role="menuitem" onClick={async () => { onClose(); await signOut(); navigate("/"); }}>
            {en ? "Sign out" : "Выйти"}
          </button>
        ) : (
          <Link to="/login" className="nav-menu-item" role="menuitem" onClick={onClose}>{en ? "Sign in" : "Войти"}</Link>
        )
      )}
    </motion.div>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { t, lang, setLang } = useLanguage();
  const { enabled, user, loading, profile: remote } = useAuth();
  const en = lang === "en";
  const { features } = useExperience();

  const [profile, setProfile] = useState(() => getProfile());
  const [done, setDone]       = useState(() => Object.keys(getTestResults()).length);
  const [open, setOpen]       = useState(false);   // мобильное меню
  const [menu, setMenu]       = useState(false);   // меню аватара
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme]     = useState(() => {
    try { return localStorage.getItem("theme") || "light"; } catch { return "light"; }
  });
  const menuRef = useRef(null);

  const NAV = [
    { to: "/lessons",   label: t("nav.lessons")   },
    { to: "/tests",     label: t("nav.tests")     },
    { to: "/fun",       label: t("nav.trainers")  },
    { to: "/analytics", label: t("nav.analytics") },
  ].filter(n => n.to !== "/fun" || features.trainers);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
  }, [theme]);

  // Профиль и прогресс живут в localStorage и меняются на других страницах
  useEffect(() => {
    const sync = () => {
      setProfile(getProfile());
      setDone(Object.keys(getTestResults()).length);
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    const iv = setInterval(sync, 1500);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      clearInterval(iv);
    };
  }, [user, loading]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const onKey  = (e) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menu]);

  // На главной поверх тёмного hero хэдер прозрачный, пока не прокрутили
  const overHero = pathname === "/" && !scrolled && !open;
  const showLogin = enabled && !loading && !user;
  const initial = profile?.name?.[0]?.toUpperCase();
  const isResearcher = remote?.role === "researcher";

  return (
    <>
      <header className={`nav-root${overHero ? " nav-over-hero" : ""}${scrolled ? " nav-scrolled" : ""}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo" aria-label="CyberAware">
            <Logo />
            <span className="nav-logo-text">Cyber<span>Aware</span></span>
          </Link>

          <nav className="nav-links" aria-label={en ? "Main" : "Основная навигация"}>
            {NAV.map(({ to, label }) => {
              const active = isActive(to, pathname);
              return (
                <Link key={to} to={to} className={`nav-link${active ? " nav-link-active" : ""}`} aria-current={active ? "page" : undefined}>
                  {active && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <span className="nav-link-label">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="nav-right">
            {done > 0 && (
              <Link
                to="/analytics"
                className="nav-progress"
                title={en ? `${done} of ${TOTAL_TESTS} tests completed` : `Пройдено тестов: ${done} из ${TOTAL_TESTS}`}
              >
                <ProgressRing done={done} total={TOTAL_TESTS} />
                <span>{done}/{TOTAL_TESTS}</span>
              </Link>
            )}

            <div className="nav-lang" role="group" aria-label={en ? "Language" : "Язык"}>
              {["ru", "en"].map(l => (
                <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)} aria-pressed={lang === l}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              className="nav-icon-btn"
              onClick={() => setTheme(th => (th === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
              aria-label={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            {showLogin && !profile ? (
              <Link to="/login" className="nav-cta">{en ? "Sign in" : "Войти"}</Link>
            ) : (
              <div className="nav-account" ref={menuRef}>
                <button
                  className={`nav-avatar-btn${menu ? " on" : ""}`}
                  onClick={() => setMenu(m => !m)}
                  aria-haspopup="menu"
                  aria-expanded={menu}
                  title={profile ? profile.name : t("nav.profile")}
                >
                  <span className="nav-avatar" style={profile ? { background: profile.color } : undefined}>
                    {initial || (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                      </svg>
                    )}
                  </span>
                  <span className="nav-avatar-chev"><Chevron /></span>
                </button>
                <AnimatePresence>
                  {menu && <AccountMenu profile={profile} en={en} onClose={() => setMenu(false)} />}
                </AnimatePresence>
              </div>
            )}

            <button
              className={`nav-burger${open ? " open" : ""}`}
              onClick={() => setOpen(o => !o)}
              aria-label={en ? "Menu" : "Меню"}
              aria-expanded={open}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-sheet"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {NAV.map(({ to, label }) => (
              <Link key={to} to={to} className={`nav-sheet-link${isActive(to, pathname) ? " active" : ""}`}>{label}</Link>
            ))}
            <div className="nav-sheet-sep" />
            <Link to="/profile" className={`nav-sheet-link${pathname === "/profile" ? " active" : ""}`}>
              {profile ? t("nav.mobileProfile", { name: profile.name }) : t("nav.profile")}
            </Link>
            {isResearcher && <Link to="/research/dashboard" className="nav-sheet-link">{en ? "Study results" : "Результаты исследования"}</Link>}
            {showLogin && <Link to="/login" className="nav-sheet-link">{en ? "Sign in" : "Войти"}</Link>}
            <div className="nav-sheet-row">
              <span>{en ? "Language" : "Язык"}</span>
              <div className="nav-lang nav-lang-sheet" role="group">
                {["ru", "en"].map(l => (
                  <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)} aria-pressed={lang === l}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {done > 0 && (
              <div className="nav-sheet-progress">
                <span>{t("nav.mobileCourse")}</span>
                <div className="nav-sheet-bar"><div style={{ width: `${(done / TOTAL_TESTS) * 100}%` }} /></div>
                <strong>{done}/{TOTAL_TESTS}</strong>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
