// src/pages/FakeNews.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const newsExamples = [
  { text: "Google покупает Казахстан за 10 миллиардов тенге 🤯", isFake: true },
  { text: "Учёные доказали: 5 часов сна достаточно для счастья 😅", isFake: true },
  { text: "Новый вирус передается через Wi-Fi 📶", isFake: true },
  { text: "Хакеры научились читать мысли пользователей 💭", isFake: true },
  { text: "Комета видна невооружённым глазом из Казахстана сегодня 🌠", isFake: false },
  { text: "В Алматы открылся новый IT-центр для подростков 🖥️", isFake: false },
  { text: "Скоро введут новый вид цифровой карты для студентов 🎓", isFake: false },
];

export default function FakeNews() {
  const [current, setCurrent] = useState(null);
  const [result, setResult] = useState("");

  const getRandomNews = () => {
    const random = Math.floor(Math.random() * newsExamples.length);
    setCurrent(newsExamples[random]);
    setResult("");
  };

  const checkNews = (userChoice) => {
    if (!current) return;
    const correct = current.isFake ? "Фейк ❌" : "Реально ✅";
    const feedback = userChoice === current.isFake ? "Правильно!" : `Неправильно! Это ${correct}`;
    setResult(feedback);
  };

  return (
    <div style={{ maxWidth: 700, margin: "50px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>📰 Fake News тренажёр</h2>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        
        {current ? (
          <motion.div
            key={current.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p style={{ fontSize: 18, marginBottom: 20 }}>{current.text}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => checkNews(true)}
                style={{ padding: "10px 20px", borderRadius: 8, background: "#ff4d4f", color: "#fff", border: "none", cursor: "pointer" }}
              >
                Фейк
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => checkNews(false)}
                style={{ padding: "10px 20px", borderRadius: 8, background: "#52c41a", color: "#fff", border: "none", cursor: "pointer" }}
              >
                Реально
              </motion.button>
            </div>
            {result && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  marginTop: 15,
                  textAlign: "center",
                  fontWeight: "bold",
                  color: result.includes("Правильно") ? "#52c41a" : "#ff4d4f"
                }}
              >
                {result}
              </motion.p>
            )}
          </motion.div>
        ) : (
          <p style={{ textAlign: "center", marginBottom: 15 }}>Нажми кнопку, чтобы получить новость</p>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={getRandomNews}
            style={{ padding: "10px 20px", borderRadius: 8, background: "#1890ff", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Получить новость
          </motion.button>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Link to="/fun" style={{ color: "#1890ff", textDecoration: "underline" }}>⬅ Вернуться в FunZone</Link>
      </div>
    </div>
  );
}
