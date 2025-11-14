// src/pages/Analytics.jsx
import React, { useEffect, useState } from "react";
import lessons from "../data/lessonsData"; // импортируем данные уроков
import { motion } from "framer-motion";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

export default function Analytics() {
  const [results, setResults] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("testResults")) || {};
    setResults(stored);
  }, []);

  const getColor = (percent) => {
    if (percent < 50) return "#ff4d4f";    // красный
    if (percent < 75) return "#faad14";    // оранжевый
    return "#52c41a";                      // зелёный
  };

  const getLessonTitle = (id) => {
    const lesson = lessons.find(l => l.testPath === `/test/${id}`);
    return lesson ? lesson.title : `Тест ${id}`;
  };

  return (
    <div style={{
      maxWidth: 850,
      margin: "50px auto",
      padding: 30,
      background: "#f0f2f5",
      borderRadius: 16,
      boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 30, fontSize: "2rem", color: "#1890ff" }}>
        📊 Ваша аналитика по пройденным тестам
      </h2>

      {Object.keys(results).length === 0 ? (
        <p style={{ textAlign: "center", fontStyle: "italic", fontSize: "1.1rem" }}>
          Вы ещё не проходили тесты. Начните обучение, чтобы отслеживать прогресс!
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.entries(results).map(([id, res]) => {
            const percent = Math.round((res.score / res.total) * 100);
            const lessonTitle = getLessonTitle(id);
            return (
              <motion.li
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  marginBottom: 25,
                  padding: 25,
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 6px 15px rgba(0,0,0,0.08)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, color: "#333", fontSize: "1.2rem" }}>
                    {lessonTitle}
                  </h3>
                  <span style={{ fontWeight: "bold", color: getColor(percent) }}>
                    {res.score}/{res.total} ({percent}%)
                  </span>
                </div>

                <div style={{
                  height: 18,
                  width: "100%",
                  background: "#e0e0e0",
                  borderRadius: 12,
                  overflow: "hidden"
                }}>
                  <motion.div
                    style={{
                      height: "100%",
                      backgroundColor: getColor(percent),
                      borderRadius: 12
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>

                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#555" }}>
                  <span>Пройден: {res.date}</span>
                  <span>
                    {percent >= 75 ? (
                      <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1.2rem" }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "1.2rem" }} />
                    )}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
