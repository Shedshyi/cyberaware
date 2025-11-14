// src/pages/Lessons.jsx
import React from "react";
import { Link } from "react-router-dom";
import lessons from "../data/lessonsData";
import "../styles.css";

export default function Lessons() {
  return (
    <div className="lessons-container">
      <h1 className="page-title">📚 Уроки по киберграмотности</h1>
      <p className="page-subtitle">Выбери тему и изучи материал — под каждой темой есть тест.</p>

      <div className="lessons-grid">
        {lessons.map(l => (
          <div key={l.id} className="lesson-card">
            <h2>{l.title}</h2>
            <p>{l.desc}</p>
            <div className="video-container">
              <iframe
                width="100%"
                height="160"
                src={l.video}
                title={l.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <Link to={`/lessons/${l.id}`} className="lesson-link">📖 Открыть тему</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
