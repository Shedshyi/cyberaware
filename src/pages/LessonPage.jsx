import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import lessons from "../data/lessonsData";

export default function LessonPage() {
  const { id } = useParams();
  const lesson = lessons.find(l => l.id === id);

  if (!lesson) return <Navigate to="/lessons" replace />;

  const buttonStyle = (bgColor) => ({
    flex: "1 1 auto",
    textAlign: "center",
    padding: "12px 10px",
    background: bgColor,
    color: "#fff",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
    minWidth: "150px"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: 900,
        margin: "50px auto",
        padding: 30,
        background: "#f5f7fa",
        borderRadius: 16,
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: "center", fontSize: "2.5rem", color: "#1890ff", marginBottom: 20 }}
      >
        {lesson.title}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ textAlign: "center", marginBottom: 30, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}
      >
        <iframe
          src={lesson.video}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: 12,
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            border: "2px solid #1890ff",
          }}
        ></iframe>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "#333", marginBottom: 30 }}
      >
        {lesson.desc}
      </motion.div>

      {lesson.tips && lesson.tips.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, staggerChildren: 0.1 }}>
          <h3 style={{ color: "#fa8c16", marginBottom: 15 }}>💡 Useful Tips:</h3>
          <ul style={{ paddingLeft: 20 }}>
            {lesson.tips.map((tip, idx) => (
              <motion.li
                key={idx}
                whileHover={{ scale: 1.03, color: "#1890ff" }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{ marginBottom: 8, color: "#555", cursor: "pointer" }}
              >
                {tip}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ display: "flex", justifyContent: "space-between", gap: 15, flexWrap: "wrap", marginTop: 40 }}
      >
        {lesson.prev && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to={`/lessons/${lesson.prev}`} style={buttonStyle("#0086b3")}>
              ← Previous Lesson
            </Link>
          </motion.div>
        )}

        {lesson.testPath && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to={lesson.testPath} style={buttonStyle("#52c41a")}>
              Пройти тест
            </Link>
          </motion.div>
        )}

        {lesson.next && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to={`/lessons/${lesson.next}`} style={buttonStyle("#1890ff")}>
              Следующий урок →
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
