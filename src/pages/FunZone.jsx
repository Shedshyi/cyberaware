// src/pages/FunZone.jsx (Обновлено)
import { Link } from "react-router-dom";
import { useState } from "react"; // useState оставлен, хотя tip и getCyberTip удалены, на случай, если вам понадобится другое состояние

function FunZone() {
  // const [tip, setTip] = useState(""); // Удалено, так как больше не используется

  // const securityTips = [ ... ]; // Удалено
  // const getCyberTip = () => { ... }; // Удалено

  return (
    <div style={{ maxWidth: 900, margin: "50px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", fontSize: 32, marginBottom: 30 }}>
        🎉 FunZone
      </h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          justifyContent: "center",
        }}
      >
        {/* Тесты */}
        <div
          style={{
            flex: "1 1 300px",
            background: "#f0f2f5",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>🧠 Пройти тесты</h2>
          <Link to="/tests">
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#1890ff",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#40a9ff")}
              onMouseOut={(e) => (e.target.style.background = "#1890ff")}
            >
              Перейти
            </button>
          </Link>
        </div>

        {/* Проверка пароля */}
        <div
          style={{
            flex: "1 1 300px",
            background: "#f0f2f5",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>🔐 Проверка пароля</h2>
          <Link to="/password-checker">
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#52c41a",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#73d13d")}
              onMouseOut={(e) => (e.target.style.background = "#52c41a")}
            >
              Проверить
            </button>
          </Link>
        </div>

        {/* Fake News */}
        <div
          style={{
            flex: "1 1 300px",
            background: "#f0f2f5",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>
            📰 Fake News тренажёр
          </h2>
          <Link to="/fake-news">
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#ff4d4f",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#ff7875")}
              onMouseOut={(e) => (e.target.style.background = "#ff4d4f")}
            >
              Проверить новости
            </button>
          </Link>
        </div>

        {/* Фишинг-тренажёр */}
        <div
          style={{
            flex: "1 1 300px",
            background: "#f0f2f5",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>
            🎣 Фишинг-тренажёр
          </h2>
          <Link to="/phishing">
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#fa8c16",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#ffa940")}
              onMouseOut={(e) => (e.target.style.background = "#fa8c16")}
            >
              Начать тренажёр
            </button>
          </Link>
        </div>

        {/* Hacker Game (бывший Совет дня) */}
        <div
          style={{
            flex: "1 1 300px",
            background: "#f0f2f5",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          {/* ОБНОВЛЕНО */}
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>🎮 Hacker Game</h2> 
          <Link to="/hacker-game">
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#722ed1",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#9254de")}
              onMouseOut={(e) => (e.target.style.background = "#722ed1")}
            >
              Играть
            </button>
          </Link>
          {/* Блок с 'tip' удален */}
        </div>

        {/* Data Sort тренажёр */}
        <div
          style={{
            flex: "1 1 300px",
            background: "#f0f2f5",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>📊 Data Sort тренажёр</h2>
          <Link to="/data-sort">
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#13c2c2",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#36cfc9")}
              onMouseOut={(e) => (e.target.style.background = "#13c2c2")}
            >
              Начать тренажёр
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FunZone;