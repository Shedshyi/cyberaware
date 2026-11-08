import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import "../research/research.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

// Переводим самые частые ошибки Supabase Auth
function humanError(err, en) {
  const m = (err?.message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return en ? "Wrong email or password." : "Неверный email или пароль.";
  if (m.includes("already registered")) return en ? "This email is already registered — sign in instead." : "Этот email уже зарегистрирован — войди в аккаунт.";
  if (m.includes("email not confirmed")) return en ? "Email is not confirmed yet. Check your inbox." : "Email ещё не подтверждён. Проверь почту.";
  if (m.includes("rate limit") || m.includes("too many")) return en ? "Too many attempts. Wait a minute and try again." : "Слишком много попыток. Подожди минуту и попробуй снова.";
  if (m.includes("not authorized")) return en ? "Email sign-in links are not available yet. Use a password." : "Вход по ссылке пока недоступен. Используй пароль.";
  if (m.includes("password")) return en ? `Password must be at least ${MIN_PASSWORD} characters.` : `Пароль — минимум ${MIN_PASSWORD} символов.`;
  return err?.message || (en ? "Something went wrong." : "Что-то пошло не так.");
}

export default function LoginPage() {
  const { enabled, user, loading, sendLoginEmail, verifyCode, signInWithPassword, signUpWithPassword } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const en = lang === "en";

  const [method, setMethod]     = useState("password"); // password | link
  const [mode, setMode]         = useState("signin");   // signin | signup (для пароля)
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");

  if (!loading && user) return <Navigate to="/profile" replace />;

  const run = async (fn) => {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); } catch (err) { setError(humanError(err, en)); } finally { setBusy(false); }
  };

  const checkEmail = () => {
    if (!EMAIL_RE.test(email.trim())) { setError(en ? "Enter a valid email." : "Введи корректный email."); return false; }
    return true;
  };

  const submitPassword = () => {
    if (!checkEmail()) return;
    if (password.length < MIN_PASSWORD) { setError(en ? `Password must be at least ${MIN_PASSWORD} characters.` : `Пароль — минимум ${MIN_PASSWORD} символов.`); return; }
    run(async () => {
      if (mode === "signin") {
        await signInWithPassword(email.trim(), password);
        navigate("/profile");
      } else {
        const signedIn = await signUpWithPassword(email.trim(), password);
        if (signedIn) navigate("/profile");
        else setInfo(en ? "Account created. Confirm your email via the link we sent, then sign in." : "Аккаунт создан. Подтверди email по ссылке из письма и войди.");
      }
    });
  };

  const submitLink = () => {
    if (!checkEmail()) return;
    run(async () => { await sendLoginEmail(email.trim()); setLinkSent(true); });
  };

  const submitCode = () => {
    if (!/^\d{6,10}$/.test(code.trim())) { setError(en ? "The code is the digits from the email." : "Код — это цифры из письма."); return; }
    run(async () => { await verifyCode(email.trim(), code.trim()); navigate("/profile"); });
  };

  const switchMethod = (m) => { setMethod(m); setError(""); setInfo(""); setLinkSent(false); };

  return (
    <div className="rs-page" style={{ maxWidth: 460 }}>
      <motion.div
        className="rs-card"
        style={{ padding: 32 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {!enabled ? (
          <>
            <h1 className="rs-title" style={{ fontSize: 24 }}>{en ? "Accounts are not configured" : "Аккаунты не настроены"}</h1>
            <p className="rs-lead" style={{ margin: 0 }}>{en
              ? "This build runs without a server. Progress is saved in your browser only."
              : "Эта сборка работает без сервера. Прогресс сохраняется только в браузере."}</p>
          </>
        ) : (
          <>
            <h1 className="rs-title" style={{ fontSize: 26 }}>
              {method === "password" && mode === "signup" ? (en ? "Create account" : "Регистрация") : (en ? "Sign in" : "Вход")}
            </h1>
            <p className="rs-lead" style={{ marginBottom: 20, fontSize: 15 }}>{en
              ? "An account keeps your progress on any device and lets you take part in the study."
              : "Аккаунт сохраняет прогресс на любом устройстве и позволяет участвовать в исследовании."}</p>

            <div className="rs-seg" style={{ marginBottom: 20 }}>
              <button type="button" className={method === "password" ? "on" : ""} onClick={() => switchMethod("password")}>{en ? "Password" : "Пароль"}</button>
              <button type="button" className={method === "link" ? "on" : ""} onClick={() => switchMethod("link")}>{en ? "Email link" : "Ссылка на почту"}</button>
            </div>

            <div className="rs-field" style={{ marginBottom: 14 }}>
              <label htmlFor="login-email">Email</label>
              <input id="login-email" className="rs-input" type="email" autoComplete="email" placeholder="name@example.com"
                value={email} onChange={e => setEmail(e.target.value)} disabled={linkSent}
                onKeyDown={e => e.key === "Enter" && (method === "password" ? submitPassword() : submitLink())} />
            </div>

            {method === "password" && (
              <>
                <div className="rs-field" style={{ marginBottom: 18 }}>
                  <label htmlFor="login-pass">{en ? "Password" : "Пароль"}</label>
                  <input id="login-pass" className="rs-input" type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder={mode === "signup" ? (en ? `At least ${MIN_PASSWORD} characters` : `Минимум ${MIN_PASSWORD} символов`) : ""}
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitPassword()} />
                </div>
                {error && <p className="rs-error" style={{ marginBottom: 12 }}>{error}</p>}
                {info && <p className="rs-note" style={{ marginBottom: 12, marginTop: 0 }}>{info}</p>}
                <button className="rs-btn rs-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitPassword} disabled={busy}>
                  {busy ? "…" : mode === "signin" ? (en ? "Sign in" : "Войти") : (en ? "Create account" : "Создать аккаунт")}
                </button>
                <p className="rs-note" style={{ textAlign: "center", marginTop: 16 }}>
                  {mode === "signin" ? (en ? "No account yet? " : "Ещё нет аккаунта? ") : (en ? "Already registered? " : "Уже есть аккаунт? ")}
                  <button type="button" className="rs-link-btn" onClick={() => { setMode(m => (m === "signin" ? "signup" : "signin")); setError(""); setInfo(""); }}>
                    {mode === "signin" ? (en ? "Create one" : "Зарегистрироваться") : (en ? "Sign in" : "Войти")}
                  </button>
                </p>
              </>
            )}

            {method === "link" && !linkSent && (
              <>
                {error && <p className="rs-error" style={{ marginBottom: 12 }}>{error}</p>}
                <button className="rs-btn rs-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitLink} disabled={busy}>
                  {busy ? "…" : en ? "Send link" : "Отправить ссылку"}
                </button>
              </>
            )}

            {method === "link" && linkSent && (
              <>
                <p className="rs-note" style={{ marginTop: 0, marginBottom: 14 }}>{en
                  ? "We sent an email. Open the link in this browser, or enter the code from the email."
                  : "Письмо отправлено. Открой ссылку в этом же браузере или введи код из письма."}</p>
                <div className="rs-field" style={{ marginBottom: 14 }}>
                  <input className="rs-input" inputMode="numeric" autoComplete="one-time-code" placeholder={en ? "Code from email" : "Код из письма"}
                    value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && submitCode()} autoFocus />
                </div>
                {error && <p className="rs-error" style={{ marginBottom: 12 }}>{error}</p>}
                <button className="rs-btn rs-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitCode} disabled={busy}>
                  {busy ? "…" : en ? "Sign in" : "Войти"}
                </button>
                <p className="rs-note" style={{ textAlign: "center", marginTop: 16 }}>
                  <button type="button" className="rs-link-btn" onClick={() => { setLinkSent(false); setCode(""); setError(""); }}>
                    {en ? "← Different email" : "← Другой email"}
                  </button>
                </p>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
