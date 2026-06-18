import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { generatePhishingSMS } from "../data/phishingGenerator";
import { useLanguage } from "../i18n/LanguageContext";

export default function PhishingTraining() {
  const { lang } = useLanguage();
  const [smsData, setSmsData] = useState(() => generatePhishingSMS());
  const [clicked, setClicked] = useState([]);
  const [checked, setChecked] = useState(false);

  const totalTraps = smsData.traps.length;
  const foundAll   = clicked.length === totalTraps;

  const handleTrapClick = (line) => {
    if (checked || clicked.includes(line)) return;
    setClicked((prev) => [...prev, line]);
  };

  const handleRestart = () => {
    setSmsData(generatePhishingSMS());
    setClicked([]);
    setChecked(false);
  };

  const progressMsg = foundAll && !checked
    ? (lang === "en" ? `✅ All traps found! Click "Check".` : "✅ Все ловушки найдены! Нажми «Проверить».")
    : clicked.length > 0
      ? (lang === "en" ? `Found ${clicked.length} of ${totalTraps}` : `Найдено ${clicked.length} из ${totalTraps}`)
      : (lang === "en" ? "Click on suspicious parts of the message" : "Нажми на подозрительные части сообщения");

  return (
    <div className="trainer-page">
      <div className="trainer-header">
        <p className="trainer-eyebrow">{lang === "en" ? "Trainer" : "Тренажёр"}</p>
        <h1 className="trainer-title">{lang === "en" ? "Phishing Trainer" : "Фишинг-тренажёр"}</h1>
        <p className="trainer-subtitle">
          {lang === "en"
            ? "Find all suspicious elements in the SMS message. Click them to mark."
            : "Найди все подозрительные элементы в SMS-сообщении. Нажми на них, чтобы отметить."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
        {Array.from({ length: totalTraps }).map((_, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: i < clicked.length ? "#10b981" : "#f3f4f6",
            border: `2px solid ${i < clicked.length ? "#10b981" : "#e5e7eb"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: i < clicked.length ? "#fff" : "#9ca3af",
            fontWeight: 700, transition: "all 0.3s",
          }}>
            {i < clicked.length ? "✓" : i + 1}
          </div>
        ))}
      </div>

      <div className="trainer-card" style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{
          background: "#f3f4f6", borderRadius: "12px 12px 0 0",
          padding: "10px 16px", margin: "-36px -36px 20px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#6366f1", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700,
          }}>K</div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f0f14" }}>Kaspi Bank</p>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>SMS</p>
          </div>
        </div>

        <div style={{
          background: "#f0f9ff", borderRadius: 14,
          padding: "16px 18px", border: "1px solid #bae6fd",
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
            {progressMsg}
          </p>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "#1e3a5f" }}>
            {smsData.message.split("\n").map((line, i) => {
              const trap = smsData.traps.find((t) => t.text === line);
              if (trap) {
                const isFound = clicked.includes(line);
                return (
                  <span
                    key={i}
                    onClick={() => handleTrapClick(line)}
                    title={isFound ? trap.reason : (lang === "en" ? "Click if it looks suspicious" : "Нажми, если кажется подозрительным")}
                    style={{
                      display: "inline-block",
                      background: isFound ? "#dcfce7" : checked ? "#fee2e2" : "#fef9c3",
                      borderRadius: 6,
                      padding: "1px 6px",
                      cursor: checked || isFound ? "default" : "pointer",
                      fontWeight: 700,
                      border: `1px solid ${isFound ? "#86efac" : checked ? "#fca5a5" : "#fde047"}`,
                      transition: "all 0.2s",
                      marginBottom: 2,
                    }}
                  >
                    {line}
                  </span>
                );
              }
              return <span key={i} style={{ display: "block" }}>{line}</span>;
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {!checked && (
            <button className="t-btn t-btn-primary" style={{ flex: 1 }} onClick={() => setChecked(true)}>
              {lang === "en" ? "Check" : "Проверить"}
            </button>
          )}
          <button className="t-btn t-btn-outline" style={{ flex: 1 }} onClick={handleRestart}>
            🔄 {lang === "en" ? "New SMS" : "Новое SMS"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(checked || clicked.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="trainer-card"
            style={{ marginTop: 20 }}
          >
            <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f0f14" }}>
              📌 {lang === "en" ? "Suspicious elements — breakdown" : "Разбор подозрительных элементов"}
            </p>
            {smsData.traps.map((trap) => {
              const found = clicked.includes(trap.text);
              return (
                <div key={trap.text} style={{
                  display: "flex", gap: 12, padding: "12px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{found ? "✅" : checked ? "❌" : "🔍"}</span>
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "#0f0f14" }}>
                      «{trap.text}»
                    </p>
                    {(found || checked) && (
                      <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.55 }}>
                        {trap.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {checked && (
              <p style={{ marginTop: 14, marginBottom: 0, fontSize: 14, fontWeight: 600,
                color: foundAll ? "#166534" : "#991b1b" }}>
                {foundAll
                  ? (lang === "en" ? "🎉 Great! You found all the traps." : "🎉 Отлично! Ты нашёл все ловушки.")
                  : (lang === "en"
                      ? `Found ${clicked.length} of ${totalTraps}. Keep practising!`
                      : `Найдено ${clicked.length} из ${totalTraps}. Продолжай тренироваться!`)}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
    </div>
  );
}
