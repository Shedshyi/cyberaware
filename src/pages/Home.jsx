import React, { useState } from "react";
import { Typography, Button, Card, Row, Col } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const { Title, Paragraph } = Typography;

const features = [
  { title: "📹 Уроки", desc: "Смотри видеоуроки и прокачивай свои навыки киберграмотности.", link: "/lessons", color: "#1890ff" },
  { title: "🧠 Тесты", desc: "Проверяй свои знания и получай аналитику по результатам.", link: "/tests", color: "#52c41a" },
  { title: "📊 Аналитика", desc: "Отслеживай прогресс и анализируй слабые стороны.", link: "/analytics", color: "#faad14" },
  { title: "🎉 FunZone", desc: "Интерактивные упражнения, советы и мини-игры по кибербезопасности.", link: "/fun", color: "#eb2f96" },
];

const Home = () => {
  const [showCookie, setShowCookie] = useState(true);
  const [cookieMessage, setCookieMessage] = useState("");

  const handleCookie = (accept) => {
    setShowCookie(false);
    setCookieMessage(
      accept
        ? "А вы даже не читали, что такое куки 😏"
        : "Ну и ладно, без куки тоже весело 😎"
    );
    setTimeout(() => setCookieMessage(""), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ padding: "50px 20px", textAlign: "center", background: "linear-gradient(120deg,#f0f2f5,#bae7ff)" }}
    >
      {/* ==== COOKIE POPUP ==== */}
      <AnimatePresence>
        {showCookie && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            style={{
              position: "fixed",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              width: "450px",
              maxWidth: "90%",
              background: "#d9d9d9",
              padding: "25px 30px",
              borderRadius: 15,
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              zIndex: 1000,
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: 15, fontSize: 16, fontWeight: 500 }}>
              🍪 Мы используем куки для улучшения работы сайта. Примите их, чтобы продолжить.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 15 }}>
              <button
                onClick={() => handleCookie(true)}
                style={{
                  padding: "10px 25px",
                  borderRadius: 8,
                  background: "#595959",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Принять
              </button>
              <button
                onClick={() => handleCookie(false)}
                style={{
                  padding: "10px 25px",
                  borderRadius: 8,
                  background: "#8c8c8c",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Нет
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==== COOKIE FEEDBACK ==== */}
      <AnimatePresence>
        {cookieMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            style={{
              position: "fixed",
              bottom: 100,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#fff",
              padding: "12px 25px",
              borderRadius: 12,
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
              zIndex: 1000,
              fontWeight: "bold",
            }}
          >
            {cookieMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==== MAIN HOME CONTENT ==== */}
      <Title style={{ fontSize: 48, marginBottom: 20 }}>Добро пожаловать в CyberAware 🔒</Title>
      <Paragraph style={{ fontSize: 18, marginBottom: 40 }}>
        Этот проект помогает развивать навыки киберграмотности через видеоуроки, тесты и интерактивные упражнения.
      </Paragraph>

      <Row gutter={[20, 20]} justify="center">
        {features.map((f, i) => (
          <Col xs={24} sm={12} md={12} lg={6} key={i}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Card
                title={f.title}
                bordered={false}
                style={{
                  background: f.color,
                  color: "#fff",
                  minHeight: 180,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              >
                <p>{f.desc}</p>
                <Button type="default" style={{ background: "#fff", color: f.color, fontWeight: "bold" }}>
                  <Link to={f.link}>Перейти</Link>
                </Button>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </motion.div>
  );
};

export default Home;
