import React from "react";
import { Link } from "react-router-dom";

export default function LessonTemplate({ title, videoUrl, description, tips = [], testLink, nextId }) {
  return (
    <div className="lesson-page">
      <div className="lesson-card">
        <h2 className="lesson-title">{title}</h2>

        <div className="lesson-video">
          <iframe src={videoUrl} title={title} allowFullScreen />
        </div>

        <p className="lesson-description">{description}</p>

        {tips.length > 0 && (
          <div className="lesson-tips">
            <h3>💡 Советы:</h3>
            <ul>
              {tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
        )}

        <div className="lesson-buttons">
          {testLink && <Link to={testLink} className="t-btn t-btn-primary">Пройти тест</Link>}
          {nextId && <Link to={`/lessons/${nextId}`} className="t-btn t-btn-outline">Следующий урок →</Link>}
        </div>
      </div>
    </div>
  );
}
