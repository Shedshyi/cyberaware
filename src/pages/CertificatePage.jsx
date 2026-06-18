import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

function loadProfile() {
  try { return JSON.parse(localStorage.getItem("userProfile")); } catch { return null; }
}
function loadResults() {
  try { return JSON.parse(localStorage.getItem("testResults")) || {}; } catch { return {}; }
}

function formatDateLong(iso, lang) {
  try {
    return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return ""; }
}

export default function CertificatePage() {
  const { lang } = useLanguage();
  const profile = loadProfile();
  const results = loadResults();
  const certRef = useRef(null);

  const total = 10;
  const done  = Object.keys(results).length;
  const allPassed = done >= total && Object.values(results).every(t => t.score / t.total >= 0.75);

  const avgPct = done
    ? Math.round(Object.values(results).reduce((s, t) => s + t.score / t.total, 0) / done * 100)
    : 0;

  const lastDate = done
    ? Object.values(results).sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date
    : null;

  const userName = profile?.name || (lang === "en" ? "User" : "Пользователь");

  const handlePrint = () => window.print();

  if (!allPassed) {
    const remaining = total - done;
    const pluralTests = (n) => {
      if (lang === "en") return n === 1 ? "test" : "tests";
      if (n === 1) return "тест";
      if (n < 5) return "теста";
      return "тестов";
    };
    return (
      <div className="cert-page">
        <motion.div
          className="cert-locked"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cert-locked-icon">🔒</div>
          <h2 className="cert-locked-title">
            {lang === "en" ? "Certificate not yet unlocked" : "Сертификат ещё не разблокирован"}
          </h2>
          <p className="cert-locked-desc">
            {lang === "en"
              ? <>To receive your certificate, complete all 10 tests with a score of <strong>≥ 75%</strong> each.</>
              : <>Чтобы получить сертификат, пройди все 10 тестов с результатом <strong>≥ 75%</strong> в каждом.</>}
          </p>
          <div className="cert-locked-progress-wrap">
            <div className="cert-locked-bar-bg">
              <motion.div
                className="cert-locked-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(done / total) * 100}%` }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="cert-locked-bar-label">
              {lang === "en" ? `${done} of ${total} tests completed` : `${done} из ${total} тестов пройдено`}
            </p>
          </div>
          {remaining > 0 && (
            <p className="cert-locked-hint">
              {lang === "en"
                ? <>Remaining: <strong>{remaining} {pluralTests(remaining)}</strong></>
                : <>Осталось: <strong>{remaining} {pluralTests(remaining)}</strong></>}
            </p>
          )}
          {done > 0 && (
            <p className="cert-locked-hint">
              {lang === "en"
                ? "Some tests may need to be retaken (score must be ≥ 75%)."
                : "Некоторые тесты могут требовать пересдачи (нужно ≥ 75%)."}
            </p>
          )}
          <div className="cert-locked-btns">
            <Link to="/tests" className="cert-btn cert-btn-primary">
              {lang === "en" ? "Go to tests" : "Перейти к тестам"}
            </Link>
            <Link to="/profile" className="cert-btn cert-btn-outline">
              {lang === "en" ? "My profile" : "Мой профиль"}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="cert-page">
      <motion.div
        className="cert-actions no-print"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button onClick={handlePrint} className="cert-btn cert-btn-primary">
          🖨 {lang === "en" ? "Print / Save PDF" : "Распечатать / Сохранить PDF"}
        </button>
        <Link to="/profile" className="cert-btn cert-btn-outline">
          ← {lang === "en" ? "Back to Profile" : "Назад в профиль"}
        </Link>
      </motion.div>

      <motion.div
        className="cert-card"
        ref={certRef}
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="cert-corner cert-corner-tl" />
        <div className="cert-corner cert-corner-tr" />
        <div className="cert-corner cert-corner-bl" />
        <div className="cert-corner cert-corner-br" />

        <div className="cert-header">
          <div className="cert-shield">🛡️</div>
          <div className="cert-brand">CyberAware</div>
          <div className="cert-brand-sub">
            {lang === "en" ? "Cybersecurity Platform" : "Платформа кибербезопасности"}
          </div>
        </div>

        <div className="cert-divider">
          <div className="cert-divider-line" />
          <div className="cert-divider-star">✦</div>
          <div className="cert-divider-line" />
        </div>

        <div className="cert-title-block">
          <p className="cert-certifies-text">
            {lang === "en" ? "CERTIFICATE OF COMPLETION" : "СЕРТИФИКАТ ОБ ОКОНЧАНИИ"}
          </p>
          <p className="cert-confirms-text">
            {lang === "en" ? "This is to certify that" : "Настоящим подтверждается, что"}
          </p>
        </div>

        <motion.div
          className="cert-name"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {userName}
        </motion.div>

        <div className="cert-body-text">
          <p>
            {lang === "en"
              ? "has successfully completed the course"
              : "успешно завершил(а) обучение по программе"}
          </p>
          <p className="cert-course-name">
            {lang === "en"
              ? "«Fundamentals of Cyber Literacy and Digital Security»"
              : "«Основы киберграмотности и цифровой безопасности»"}
          </p>
          <p>
            {lang === "en"
              ? "demonstrating solid knowledge across all 10 course modules"
              : "продемонстрировав уверенные знания по всем 10 модулям курса"}
          </p>
        </div>

        <div className="cert-stats">
          <div className="cert-stat-item">
            <span className="cert-stat-num">10</span>
            <span className="cert-stat-label">{lang === "en" ? "modules" : "модулей"}</span>
          </div>
          <div className="cert-stat-sep" />
          <div className="cert-stat-item">
            <span className="cert-stat-num">50</span>
            <span className="cert-stat-label">{lang === "en" ? "questions" : "вопросов"}</span>
          </div>
          <div className="cert-stat-sep" />
          <div className="cert-stat-item">
            <span className="cert-stat-num">{avgPct}%</span>
            <span className="cert-stat-label">{lang === "en" ? "avg score" : "средний балл"}</span>
          </div>
        </div>

        <div className="cert-divider">
          <div className="cert-divider-line" />
          <div className="cert-divider-star">✦</div>
          <div className="cert-divider-line" />
        </div>

        <div className="cert-footer">
          <div className="cert-footer-sig">
            <div className="cert-sig-line" />
            <p className="cert-sig-label">
              {lang === "en" ? "CyberAware Team" : "Команда CyberAware"}
            </p>
          </div>
          <div className="cert-footer-seal">
            <div className="cert-seal">
              <span className="cert-seal-icon">🏆</span>
              <span className="cert-seal-text">Verified</span>
            </div>
          </div>
          <div className="cert-footer-date">
            <div className="cert-sig-line" />
            <p className="cert-sig-label">
              {lastDate ? formatDateLong(lastDate, lang) : formatDateLong(new Date().toISOString(), lang)}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.p
        className="cert-hint no-print"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {lang === "en"
          ? "Click «Print / Save PDF» → in the dialog choose «Save as PDF»"
          : "Нажми «Распечатать / Сохранить PDF» → в диалоге выбери «Сохранить как PDF»"}
      </motion.p>
    </div>
  );
}
