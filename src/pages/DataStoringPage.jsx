// src/pages/DataSortingPage.jsx
import React, { useState } from "react";

export default function DataSortingPage() {
  const initialItems = [
    { id: 1, text: "Паспортные данные", critical: true },
    { id: 2, text: "Email", critical: false },
    { id: 3, text: "Номер банковской карты", critical: true },
    { id: 4, text: "Любимый фильм", critical: false },
    { id: 5, text: "Номер телефона", critical: true },
    { id: 6, text: "Город проживания", critical: false },
    { id: 7, text: "Фото с документами", critical: true },
    { id: 8, text: "Интересы / хобби", critical: false },
  ];

  const [items, setItems] = useState(initialItems);
  const [criticalBox, setCriticalBox] = useState([]);
  const [nonCriticalBox, setNonCriticalBox] = useState([]);
  const [result, setResult] = useState(null);

  const onDragStart = (e, item) => {
    e.dataTransfer.setData("item", JSON.stringify(item));
  };

  const onDrop = (e, dropTo) => {
    const droppedItem = JSON.parse(e.dataTransfer.getData("item"));

    // удаляем из списка
    setItems(prev => prev.filter(i => i.id !== droppedItem.id));

    // кладем в нужную коробку
    if (dropTo === "critical") {
      setCriticalBox(prev => [...prev, droppedItem]);
    } else {
      setNonCriticalBox(prev => [...prev, droppedItem]);
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const checkResult = () => {
    let errors = 0;

    criticalBox.forEach(i => { if (!i.critical) errors++; });
    nonCriticalBox.forEach(i => { if (i.critical) errors++; });

    setResult(errors);
  };

  const reset = () => {
    setItems(initialItems);
    setCriticalBox([]);
    setNonCriticalBox([]);
    setResult(null);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 30 }}>
        🧩 Раздели данные: критичные vs некритичные
      </h1>

      {/* Карточки */}
      <div
        style={{
          display: "flex",
          gap: 15,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 30,
        }}
      >
        {items.map(item => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            style={{
              padding: "10px 15px",
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              cursor: "grab",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Две зоны */}
      <div style={{ display: "flex", gap: 25, justifyContent: "center" }}>
        {/* Критичные */}
        <div
          onDrop={(e) => onDrop(e, "critical")}
          onDragOver={allowDrop}
          style={{
            width: 400,
            minHeight: 200,
            padding: 15,
            borderRadius: 12,
            border: "2px dashed #ff4d4f",
            background: "#fff1f0",
          }}
        >
          <h3 style={{ color: "#cf1322" }}>🟥 Критичные данные</h3>

          {criticalBox.map(i => (
            <div
              key={i.id}
              style={{
                padding: "10px 15px",
                marginTop: 8,
                background: "white",
                borderRadius: 8,
                border: "1px solid #ffccc7",
              }}
            >
              {i.text}
            </div>
          ))}
        </div>

        {/* Некритичные */}
        <div
          onDrop={(e) => onDrop(e, "nonCritical")}
          onDragOver={allowDrop}
          style={{
            width: 400,
            minHeight: 200,
            padding: 15,
            borderRadius: 12,
            border: "2px dashed #52c41a",
            background: "#f6ffed",
          }}
        >
          <h3 style={{ color: "#237804" }}>🟩 Некритичные данные</h3>

          {nonCriticalBox.map(i => (
            <div
              key={i.id}
              style={{
                padding: "10px 15px",
                marginTop: 8,
                background: "white",
                borderRadius: 8,
                border: "1px solid #b7eb8f",
              }}
            >
              {i.text}
            </div>
          ))}
        </div>
      </div>

      {/* Результат */}
      <div style={{ textAlign: "center", marginTop: 30 }}>
        {result !== null && (
          <h2>
            {result === 0
              ? "🔥 Всё идеально! Ты красавчик!"
              : `Ошибок: ${result}`}
          </h2>
        )}

        <button
          onClick={checkResult}
          style={{
            padding: "10px 25px",
            marginRight: 15,
            background: "#1890ff",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Проверить
        </button>

        <button
          onClick={reset}
          style={{
            padding: "10px 25px",
            background: "#8c8c8c",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Заново
        </button>
      </div>
    </div>
  );
}
