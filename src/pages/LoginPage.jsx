import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { enabled, user, loading, sendLoginEmail, verifyCode } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const en = lang === "en";

  const [email, setEmail] = useState("");
  const [code,  setCode]  = useState("");
  const [step,  setStep]  = useState("email"); // email | code
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) return <Navigate to="/profile" replace />;

  const submitEmail = async () => {
    const e = email.trim();
    if (!EMAIL_RE.test(e)) { setError(en ? "Enter a valid email" : "Введи корректный email"); return; }
    setBusy(true); setError("");
    try {
      await sendLoginEmail(e);
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    const c = code.trim();
    if (!/^\d{6,10}$/.test(c)) { setError(en ? "The code is the digits from the email" : "Код — это цифры из письма"); return; }
    setBusy(true); setError("");
    try {
      await verifyCode(email.trim(), c);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile-overlay" style={{ position: "static", minHeight: "70vh", background: "none" }}>
      <motion.div
        className="profile-setup-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔑</div>

        {!enabled ? (
          <>
            <h2>{en ? "Accounts are not configured" : "Аккаунты не настроены"}</h2>
            <p>{en
              ? "This build runs without a server. Progress is saved in your browser only."
              : "Эта сборка работает без сервера. Прогресс сохраняется только в браузере."}</p>
          </>
        ) : step === "email" ? (
          <>
            <h2>{en ? "Sign in" : "Вход"}</h2>
            <p>{en
              ? "Enter your email. We'll send a sign-in link and a code — no password needed."
              : "Введи email — пришлём ссылку и код для входа. Пароль не нужен."}</p>
            <input
              className="profile-name-input"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEmail()}
              autoFocus
            />
            {error && <p style={{ color: "#ef4444", marginTop: -8 }}>{error}</p>}
            <button className="t-btn t-btn-primary t-btn-lg t-btn-block" onClick={submitEmail} disabled={busy}>
              {busy ? "…" : en ? "Send" : "Отправить"}
            </button>
          </>
        ) : (
          <>
            <h2>{en ? "Check your email" : "Проверь почту"}</h2>
            <p>{en
              ? <>We sent an email to <b>{email}</b>. Click the link in it, or enter the code here.</>
              : <>Мы отправили письмо на <b>{email}</b>. Перейди по ссылке из него или введи код здесь.</>}</p>
            <input
              className="profile-name-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={en ? "Code from email" : "Код из письма"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCode()}
              autoFocus
            />
            {error && <p style={{ color: "#ef4444", marginTop: -8 }}>{error}</p>}
            <button className="t-btn t-btn-primary t-btn-lg t-btn-block" onClick={submitCode} disabled={busy}>
              {busy ? "…" : en ? "Sign in" : "Войти"}
            </button>
            <button
              className="t-btn t-btn-block"
              style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer" }}
              onClick={() => { setStep("email"); setCode(""); setError(""); }}
            >
              {en ? "← Different email" : "← Другой email"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
