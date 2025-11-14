// src/components/LessonTemplate.jsx
import React from "react";
import { Card, Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import "../styles.css";

const { Title, Paragraph } = Typography;

export default function LessonTemplate({ title, videoUrl, description, tips = [], testLink, nextId }) {
  const navigate = useNavigate();

  return (
    <div className="lesson-page">
      <Card className="lesson-card">
        <Title level={2} className="lesson-title">{title}</Title>

        <div className="lesson-video">
          <iframe
            src={videoUrl}
            title={title}
            allowFullScreen
          ></iframe>
        </div>

        <Paragraph className="lesson-description">{description}</Paragraph>

        {tips.length > 0 && (
          <div className="lesson-tips">
            <h3>💡 Советы:</h3>
            <ul>
              {tips.map((tip, index) => <li key={index}>{tip}</li>)}
            </ul>
          </div>
        )}

        <div className="lesson-buttons">
          {testLink && (
            <Button type="primary" onClick={() => navigate(testLink)}>
              Пройти тест
            </Button>
          )}
          {nextId && (
            <Button onClick={() => navigate(`/lessons/${nextId}`)}>
              Следующий урок →
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
