// src/pages/Tests.jsx
import React from "react";
import { Link } from "react-router-dom";
import lessons from "../data/lessonsData";

export default function Tests() {
  return (
    <div style={{
      maxWidth: 900,
      margin: "50px auto",
      padding: 30,
      background: "#f0f2f5",
      borderRadius: 16,
      boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 40, fontSize: "2rem" }}>
        🧩 Тесты по киберграмотности
      </h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {lessons.map((lesson, index) => (
          <li
            key={lesson.id}
            style={{
              marginBottom: 20,
              padding: "18px 25px",
              background: "white",
              borderRadius: 10,
              boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
              transition: "all 0.3s",
              cursor: "pointer"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.08)";
            }}
          >
            <Link
              to={lesson.testPath}
              style={{
                textDecoration: "none",
                color: "#1890ff",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              {lesson.title} ➡️
            </Link>
            <p style={{ margin: "5px 0 0", fontSize: "0.95rem", color: "#555" }}>
              {lesson.desc}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
