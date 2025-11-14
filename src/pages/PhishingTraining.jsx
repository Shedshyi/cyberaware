import React, { useState } from "react";
import { generatePhishingSMS } from "../data/phishingGenerator";
import { motion } from "framer-motion";

export default function PhishingTraining() {
  const [smsData, setSmsData] = useState(generatePhishingSMS());
  const [clicked, setClicked] = useState([]);

  const handleTrapClick = (line) => {
    if (!clicked.includes(line)) {
      setClicked([...clicked, line]);
    }
  };

  const handleRestart = () => {
    setSmsData(generatePhishingSMS());
    setClicked([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: 800,
        margin: "40px auto",
        padding: 30,
        background: "#f0f2f5",
        borderRadius: 16,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20, color: "#1890ff" }}>
        🕵️ Обучение фишингу — найди опасные элементы
      </h2>

      <div
        style={{
          whiteSpace: "pre-line",
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
          fontSize: "1.05rem",
          lineHeight: "1.55"
        }}
      >
        {smsData.message.split("\n").map((line, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            {smsData.traps.some((t) => t.text === line) ? (
              <span
                onClick={() => handleTrapClick(line)}
                style={{
                  background: clicked.includes(line) ? "#d4ffd6" : "#ffe1e1",
                  padding: "4px 6px",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "0.2s",
                  fontWeight: "bold"
                }}
              >
                {line}
              </span>
            ) : (
              line
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 25 }}>
        <h3>📌 Обнаруженные элементы:</h3>
        {clicked.length === 0 ? (
          <p style={{ fontStyle: "italic" }}>Ты пока ничего не отметил.</p>
        ) : (
          <ul>
            {clicked.map((line, i) => {
              const trap = smsData.traps.find((t) => t.text === line);
              return (
                <li key={i} style={{ marginBottom: 10 }}>
                  <strong>{trap.text}</strong> — {trap.reason}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <motion.button
        onClick={handleRestart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: 20,
          padding: "12px 25px",
          background: "#1890ff",
          borderRadius: 10,
          color: "#fff",
          border: "none",
          fontSize: "1rem",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        🔄 Сгенерировать новое SMS
      </motion.button>
    </motion.div>
  );
}
