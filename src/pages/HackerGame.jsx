// src/pages/HackerGame.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- КОНСТАНТЫ И ДАННЫЕ ИГРЫ ---
const MAX_SECURITY = 100;
const MIN_SECURITY = 0;
const GAME_LENGTH = 5; // Количество попыток взлома

const threatsData = [
  { id: 1, type: "Письмо", text: "Ваш аккаунт заблокирован. Срочно перейдите по ссылке для подтверждения.", isPhishing: true, correctScore: 20, incorrectScore: -15 },
  { id: 2, type: "SMS", text: "Вам пришло 5000 тенге. Подтвердите, отправив 'ДА' на этот номер.", isPhishing: true, correctScore: 15, incorrectScore: -10 },
  { id: 3, type: "Уведомление", text: "Обновление политики конфиденциальности. Нажмите, чтобы принять.", isPhishing: false, correctScore: 10, incorrectScore: -5 },
  { id: 4, type: "Звонок", text: "Представились банком и просят назвать код из СМС, чтобы 'отменить подозрительный перевод'.", isPhishing: true, correctScore: 30, incorrectScore: -35 },
  { id: 5, type: "Письмо", text: "Amazon: Сброс пароля. Если это не вы, просто проигнорируйте письмо.", isPhishing: false, correctScore: 5, incorrectScore: -20 },
  { id: 6, type: "Ссылка", text: "Фотографии с вечеринки! (tinyurl.cc/123)", isPhishing: true, correctScore: 15, incorrectScore: -10 },
  { id: 7, type: "SMS", text: "Поздравляем! Вы выиграли iPhone! Заберите приз здесь.", isPhishing: true, correctScore: 25, incorrectScore: -15 },
];

// Функция для выбора уникальных угроз для игры
const getGameThreats = (count) => {
  const shuffled = [...threatsData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// --- КОМПОНЕНТ ШКАЛЫ БЕЗОПАСНОСТИ ---
const SecurityBar = ({ securityLevel }) => {
  // Определяем цвет полосы в зависимости от уровня
  const getColor = (level) => {
    if (level > 70) return "#52c41a"; // Зеленый
    if (level > 30) return "#faad14"; // Оранжевый
    return "#ff4d4f"; // Красный
  };

  return (
    <div style={{ marginBottom: 30 }}>
      <p style={{ fontSize: "1.2em", fontWeight: "bold", textAlign: "center" }}>
        🔒 Безопасность аккаунта: {securityLevel}%
      </p>
      <div 
        style={{ 
          height: 20, 
          background: "#e0e0e0", 
          borderRadius: 10, 
          overflow: "hidden" 
        }}
      >
        <motion.div
          animate={{ width: `${securityLevel}%`, backgroundColor: getColor(securityLevel) }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ height: "100%", borderRadius: 10 }}
        />
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ ФИНАЛЬНОГО ЭКРАНА ---
const FinalScreen = ({ securityLevel, onRestart }) => {
  let title, message, color;

  if (securityLevel > 80) {
    title = "Брандмауэр! 🛡️";
    message = "Ты настоящий эксперт по безопасности. Твой аккаунт в идеальном порядке!";
    color = "#52c41a";
  } else if (securityLevel > 40) {
    title = "Хорошо, но можно лучше! 🚧";
    message = "Ты справился с большинством угроз, но стоит быть внимательнее к деталям.";
    color = "#faad14";
  } else {
    title = "Взлом! 🚨";
    message = "Твой аккаунт скомпрометирован. Время изучить основы кибербезопасности!";
    color = "#ff4d4f";
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="final-screen"
      style={{
        padding: 40,
        borderRadius: 15,
        background: color,
        color: "#fff",
        textAlign: "center",
        boxShadow: `0 8px 16px rgba(0,0,0,0.3)`,
      }}
    >
      <h2>{title}</h2>
      <p style={{ margin: "20px 0", fontSize: "1.1em" }}>{message}</p>
      <h3 style={{ marginBottom: 30 }}>Финальный уровень безопасности: {securityLevel}%</h3>
      <button 
        onClick={onRestart}
        style={{
          padding: '10px 20px',
          fontSize: '1em',
          cursor: 'pointer',
          borderRadius: 8,
          border: 'none',
          background: '#fff',
          color: color,
          fontWeight: 'bold',
        }}
      >
        Начать заново
      </button>
    </motion.div>
  );
};


// --- ОСНОВНОЙ КОМПОНЕНТ ИГРЫ ---
export default function HackerGame() {
  const [securityLevel, setSecurityLevel] = useState(50); // Начальный уровень
  const [currentThreatIndex, setCurrentThreatIndex] = useState(0);
  const [message, setMessage] = useState("Начинаем игру!");
  const [threats] = useState(getGameThreats(GAME_LENGTH));

  // Текущая угроза
  const currentThreat = threats[currentThreatIndex];
  // Определяем, закончилась ли игра
  const isGameOver = currentThreatIndex >= GAME_LENGTH;

  // Функция обработки действий игрока
  const handleAction = (action) => {
    if (isGameOver) return;

    let isCorrect, scoreChange;
    const isBlock = action === 'Block';

    // 1. Определяем, было ли действие правильным
    if (currentThreat.isPhishing === isBlock) {
      isCorrect = true;
      scoreChange = currentThreat.correctScore;
      setMessage(`✅ Верно! Это был ${currentThreat.isPhishing ? 'фишинг' : 'безопасное уведомление'}. +${scoreChange} к безопасности.`);
    } else {
      isCorrect = false;
      scoreChange = currentThreat.incorrectScore; // Отрицательное число
      setMessage(`❌ Ошибка! ${currentThreat.isPhishing ? 'Нужно было блокировать.' : 'Нужно было игнорировать.'} ${scoreChange} к безопасности.`);
    }

    // 2. Обновляем уровень безопасности
    setSecurityLevel(prev => 
      Math.max(MIN_SECURITY, Math.min(MAX_SECURITY, prev + scoreChange))
    );

    // 3. Переходим к следующей угрозе через небольшую задержку для анимации
    setTimeout(() => {
      setCurrentThreatIndex(prev => prev + 1);
      if (currentThreatIndex + 1 < GAME_LENGTH) {
        setMessage("Следующая попытка...");
      }
    }, 800);
  };
  
  // Функция для перезапуска игры
  const handleRestart = () => {
    setSecurityLevel(50);
    setCurrentThreatIndex(0);
    setMessage("Начинаем игру!");
    // Здесь можно было бы обновить threats, если бы использовался useMemo
    window.location.reload(); // Простой способ перезапуска для тестового кода
  };

  if (isGameOver) {
    return (
      <div style={{ maxWidth: 600, margin: "50px auto", padding: 20, textAlign: 'center' }}>
        <FinalScreen 
          securityLevel={securityLevel} 
          onRestart={handleRestart}
        />
      </div>
    );
  }

  // --- UI ИГРОВОГО ЭКРАНА ---
  return (
    <div style={{ maxWidth: 600, margin: "50px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Хакер vs Пользователь</h1>
      
      <SecurityBar securityLevel={securityLevel} />

      <h3 style={{ textAlign: "center", marginBottom: 20 }}>
        Попытка {currentThreatIndex + 1} из {GAME_LENGTH}
      </h3>

      <motion.div
        key={currentThreat.id} // Ключ для AnimatePresence
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          padding: 30,
          borderRadius: 15,
          background: "#f0f2f5",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          marginBottom: 30,
        }}
      >
        <p style={{ fontWeight: "bold", color: "#1890ff" }}>Тип угрозы: {currentThreat.type}</p>
        <p style={{ fontSize: "1.3em", margin: "15px 0" }}>**{currentThreat.text}**</p>
        
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 20 }}>
          <motion.button
            onClick={() => handleAction('Block')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={buttonStyle("#ff4d4f")}
          >
            ❌ Блокировать
          </motion.button>
          <motion.button
            onClick={() => handleAction('Ignore')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={buttonStyle("#52c41a")}
          >
            ✅ Игнорировать
          </motion.button>
        </div>
      </motion.div>
      
      <motion.p 
        key={message}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: "center", fontWeight: "bold", minHeight: 20 }}
      >
        {message}
      </motion.p>
    </div>
  );
}

// Вспомогательный стиль для кнопок
const buttonStyle = (color) => ({
  padding: '10px 20px',
  fontSize: '1em',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  background: color,
  color: '#fff',
  fontWeight: 'bold',
});