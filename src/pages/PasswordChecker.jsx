import React, { useState } from "react";

export default function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState("");
  const [advice, setAdvice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const checkStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (!pass) {
      setStrength("");
      setAdvice("");
      return;
    }

    switch (score) {
      case 0:
      case 1:
        setStrength("Слабый ❌");
        setAdvice("Добавь цифры, заглавные буквы и спецсимволы. Например: MyPass@2024");
        break;
      case 2:
        setStrength("Средний ⚠️");
        setAdvice("Неплохо! Но можно сильнее. Добавь спецсимвол и сделай пароль длиннее 10 символов.");
        break;
      case 3:
        setStrength("Хороший ✅");
        setAdvice("Пароль надёжный, но добавь уникальный символ, чтобы усилить защиту.");
        break;
      case 4:
        setStrength("Мощный 💪");
        setAdvice("Красавчик! Пароль топ уровня. Не используй его повторно и не делись с другими.");
        break;
      default:
        setStrength("");
        setAdvice("");
    }
  };

  const getColor = () => {
    switch (strength) {
      case "Слабый ❌":
        return "#ff4d4f";
      case "Средний ⚠️":
        return "#faad14";
      case "Хороший ✅":
        return "#52c41a";
      case "Мощный 💪":
        return "#00ff99";
      default:
        return "#ccc";
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "50px auto", padding: 20, background: "#f5f5f5", borderRadius: 15, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>🔐 Проверка силы пароля</h2>

      <div style={{ display: "flex", marginBottom: 20 }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Введи пароль"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            checkStrength(e.target.value);
          }}
          style={{
            flex: 1,
            padding: "12px 15px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
            outline: "none",
            marginRight: 10
          }}
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          style={{
            padding: "12px 15px",
            borderRadius: 8,
            border: "none",
            background: "#1890ff",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseOver={(e) => e.target.style.background = "#40a9ff"}
          onMouseOut={(e) => e.target.style.background = "#1890ff"}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      {strength && (
        <>
          <div style={{ height: 12, borderRadius: 6, background: "#e0e0e0", overflow: "hidden", marginBottom: 15 }}>
            <div
              style={{
                width: `${Math.min(password.length * 10, 100)}%`,
                background: getColor(),
                height: "100%",
                borderRadius: 6,
                transition: "width 0.3s, background 0.3s",
              }}
            ></div>
          </div>

          <div style={{ padding: 15, background: "#fff", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 10 }}>
            <h3 style={{ color: getColor(), marginBottom: 10 }}>{strength}</h3>
            <p style={{ color: "#333", fontSize: 14 }}>{advice}</p>
          </div>
        </>
      )}
    </div>
  );
}
