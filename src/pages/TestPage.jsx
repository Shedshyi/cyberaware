// src/pages/TestPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import testsData from '../data/testsData';
import { motion } from 'framer-motion';

export default function TestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const questions = testsData[id] || [];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (qId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) newScore++;
    });
    setScore(newScore);
    setSubmitted(true);

    const results = JSON.parse(localStorage.getItem('testResults')) || {};
    results[id] = {
      score: newScore,
      total: questions.length,
      date: new Date().toLocaleString()
    };
    localStorage.setItem('testResults', JSON.stringify(results));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: 800,
        margin: "50px auto",
        padding: 30,
        background: "#f0f2f5",
        borderRadius: 16,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        fontFamily: "'Segoe UI', sans-serif"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 40, fontSize: "2rem", color: "#1890ff" }}>
        🧩 Тест №{id}
      </h2>

      {!submitted ? (
        <>
          {questions.map(q => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: q.id * 0.1 }}
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: 25,
                padding: 25,
                background: "#fff",
                borderRadius: 14,
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 15, marginBottom: 15 }}>
                <div style={{
                  minWidth: 40,
                  minHeight: 40,
                  borderRadius: "50%",
                  background: "#1890ff",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  flexShrink: 0
                }}>
                  {q.id}
                </div>
                <h4 style={{ margin: 0, color: "#333", fontSize: "1.2rem", lineHeight: 1.4, wordBreak: "break-word" }}>
                  {q.question}
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, i) => (
                  <label
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 15px",
                      borderRadius: 8,
                      border: answers[q.id] === i ? "2px solid #1890ff" : "1px solid #d9d9d9",
                      background: answers[q.id] === i ? "#e6f7ff" : "#fafafa",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "1rem"
                    }}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === i}
                      onChange={() => handleAnswer(q.id, i)}
                      style={{ marginRight: 12 }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </motion.div>
          ))}

          <motion.button
            onClick={handleSubmit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: "100%",
              padding: "14px 0",
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderRadius: 12,
              border: "none",
              background: "#1890ff",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
              marginTop: 20
            }}
          >
            Отправить
          </motion.button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: "center",
            padding: 35,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 6px 22px rgba(0,0,0,0.1)"
          }}
        >
          <h3 style={{ fontSize: "1.8rem", color: "#52c41a", marginBottom: 25 }}>
            🎉 Твой результат: {score} из {questions.length}
          </h3>
          <motion.button
            onClick={() => navigate('/analytics')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "14px 30px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderRadius: 12,
              border: "none",
              background: "#52c41a",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
              transition: "all 0.2s"
            }}
          >
            Смотреть аналитику
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
