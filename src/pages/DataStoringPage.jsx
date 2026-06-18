import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

const ALL_ITEMS_RU = [
  { id: 1, text: "Паспортные данные",      critical: true,  why: "Используется для кражи личности и мошенничества с документами." },
  { id: 2, text: "Email-адрес",            critical: false, why: "Менее критичен, но может использоваться для спама и фишинга." },
  { id: 3, text: "Номер банковской карты", critical: true,  why: "Прямой доступ к финансам. Никогда не передавайте третьим лицам." },
  { id: 4, text: "Любимый фильм",          critical: false, why: "Публичная информация без финансовых или юридических рисков." },
  { id: 5, text: "Номер телефона",         critical: true,  why: "Позволяет обходить SMS-2FA и получать коды подтверждения." },
  { id: 6, text: "Город проживания",       critical: false, why: "Общедоступная информация, риски минимальны в отрыве от других данных." },
  { id: 7, text: "Фото с документами",     critical: true,  why: "Достаточно для оформления кредитов и услуг мошенниками." },
  { id: 8, text: "Интересы / хобби",       critical: false, why: "Используется для персонализации рекламы, но прямых рисков нет." },
  { id: 9, text: "Геолокация в реальном времени", critical: true, why: "Показывает, когда вас нет дома. Риск физической безопасности." },
  { id: 10, text: "Никнейм в игре",        critical: false, why: "Не связан с реальной личностью. Риск минимален." },
];

const ALL_ITEMS_EN = [
  { id: 1, text: "Passport / ID data",       critical: true,  why: "Used for identity theft and document fraud." },
  { id: 2, text: "Email address",            critical: false, why: "Lower risk, but can be used for spam and phishing." },
  { id: 3, text: "Bank card number",         critical: true,  why: "Direct access to finances. Never share with third parties." },
  { id: 4, text: "Favorite movie",           critical: false, why: "Public information with no financial or legal risk." },
  { id: 5, text: "Phone number",             critical: true,  why: "Can be used to bypass SMS-2FA and intercept one-time codes." },
  { id: 6, text: "City of residence",        critical: false, why: "Publicly available info — minimal risk in isolation." },
  { id: 7, text: "Photo with ID document",   critical: true,  why: "Enough for fraudsters to apply for loans or services." },
  { id: 8, text: "Interests / hobbies",      critical: false, why: "Used for ad targeting, no direct security risk." },
  { id: 9, text: "Real-time GPS location",   critical: true,  why: "Reveals when you're away from home. Physical safety risk." },
  { id: 10, text: "Game username",           critical: false, why: "Not linked to real identity. Minimal risk." },
];

export default function DataStoringPage() {
  const { lang } = useLanguage();
  const ALL_ITEMS = lang === "en" ? ALL_ITEMS_EN : ALL_ITEMS_RU;

  const [items, setItems]             = useState(ALL_ITEMS);
  const [criticalBox, setCriticalBox] = useState([]);
  const [safeBox, setSafeBox]         = useState([]);
  const [result, setResult]           = useState(null);
  const [dragOver, setDragOver]       = useState(null);

  // reset when language changes
  React.useEffect(() => {
    setItems(ALL_ITEMS);
    setCriticalBox([]);
    setSafeBox([]);
    setResult(null);
    setDragOver(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const onDragStart = (e, item) => {
    e.dataTransfer.setData("item", JSON.stringify(item));
  };
  const onDrop = (e, zone) => {
    e.preventDefault();
    setDragOver(null);
    const item = JSON.parse(e.dataTransfer.getData("item"));
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (zone === "critical") setCriticalBox((prev) => [...prev, item]);
    else setSafeBox((prev) => [...prev, item]);
  };
  const onDragOver = (e, zone) => {
    e.preventDefault();
    setDragOver(zone);
  };
  const checkResult = () => {
    const errors = [
      ...criticalBox.filter((i) => !i.critical),
      ...safeBox.filter((i) => i.critical),
    ];
    setResult(errors);
  };
  const reset = () => {
    setItems(ALL_ITEMS);
    setCriticalBox([]);
    setSafeBox([]);
    setResult(null);
    setDragOver(null);
  };

  const allPlaced = items.length === 0;

  const ZoneItem = ({ item, zone }) => {
    const isWrong = result && (
      (zone === "critical" && !item.critical) ||
      (zone === "safe" && item.critical)
    );
    const isRight = result && !isWrong;
    return (
      <div style={{
        padding: "10px 14px", borderRadius: 10,
        background: isRight ? "#f0fdf4" : isWrong ? "#fef2f2" : "#fff",
        border: `1px solid ${isRight ? "#bbf7d0" : isWrong ? "#fecaca" : "#e5e7eb"}`,
        fontSize: 14, fontWeight: 500, color: "#374151",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {result && (isRight ? "✅" : "❌")}
        {item.text}
        {result && isWrong && (
          <span style={{ color: "#9ca3af", fontSize: 12, display: "block", marginTop: 2 }}>
            — {item.why}
          </span>
        )}
      </div>
    );
  };

  const ZONES = lang === "en"
    ? [
        { key: "critical", label: "🔴 Sensitive data",     border: "#fca5a5", bg: "#fef2f2", activeBg: "#fee2e2", title: "Passport, card, phone…" },
        { key: "safe",     label: "🟢 Non-sensitive data",  border: "#86efac", bg: "#f0fdf4", activeBg: "#dcfce7", title: "Hobbies, username, city…" },
      ]
    : [
        { key: "critical", label: "🔴 Критичные данные",   border: "#fca5a5", bg: "#fef2f2", activeBg: "#fee2e2", title: "Паспорт, карта, телефон…" },
        { key: "safe",     label: "🟢 Некритичные данные", border: "#86efac", bg: "#f0fdf4", activeBg: "#dcfce7", title: "Хобби, никнейм, город…" },
      ];

  return (
    <div className="trainer-page-wide">
      <div className="trainer-header">
        <p className="trainer-eyebrow">{lang === "en" ? "Trainer" : "Тренажёр"}</p>
        <h1 className="trainer-title">{lang === "en" ? "Data Sorting" : "Сортировка данных"}</h1>
        <p className="trainer-subtitle">
          {lang === "en"
            ? "Drag cards to the correct zones — which is sensitive data and which is not?"
            : "Перетащи карточки в правильные зоны — что является критичными данными, а что нет?"}
        </p>
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 28 }}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
              style={{
                padding: "10px 18px", background: "#fff",
                borderRadius: 10, border: "1.5px solid #e5e7eb",
                cursor: "grab", fontSize: 14, fontWeight: 600,
                color: "#374151", boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                userSelect: "none",
              }}
            >
              {item.text}
            </motion.div>
          ))}
        </div>
      )}

      {items.length === 0 && !result && (
        <p style={{ textAlign: "center", color: "#10b981", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
          ✓ {lang === "en" ? "All cards placed! Click «Check»." : "Все карточки распределены! Нажми «Проверить»."}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {ZONES.map(({ key, label, border, bg, activeBg, title }) => (
          <div
            key={key}
            onDrop={(e) => onDrop(e, key)}
            onDragOver={(e) => onDragOver(e, key)}
            onDragLeave={() => setDragOver(null)}
            style={{
              minHeight: 200, padding: 20, borderRadius: 16,
              border: `2px dashed ${border}`,
              background: dragOver === key ? activeBg : bg,
              transition: "background 0.2s",
            }}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#0f0f14" }}>{label}</p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9ca3af" }}>{title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AnimatePresence>
                {(key === "critical" ? criticalBox : safeBox).map((item) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <ZoneItem item={item} zone={key} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="trainer-card"
            style={{ marginBottom: 16 }}
          >
            {result.length === 0 ? (
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#166534" }}>
                🎉 {lang === "en" ? "Perfect! All data sorted correctly." : "Идеально! Все данные распределены правильно."}
              </p>
            ) : (
              <>
                <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#991b1b" }}>
                  {lang === "en" ? `Errors: ${result.length}. Here's what to fix:` : `Ошибок: ${result.length}. Вот что нужно исправить:`}
                </p>
                {result.map((item) => (
                  <div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <strong style={{ fontSize: 14, color: "#0f0f14" }}>{item.text}</strong>
                    <span style={{ fontSize: 13, color: "#6b7280", display: "block", marginTop: 3 }}>
                      {lang === "en"
                        ? `Should be in "${item.critical ? "Sensitive" : "Non-sensitive"}" — ${item.why}`
                        : `Должно быть в «${item.critical ? "Критичные" : "Некритичные"}» — ${item.why}`}
                    </span>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", gap: 12 }}>
        {!result && (
          <button
            className="t-btn t-btn-primary t-btn-lg"
            onClick={checkResult}
            disabled={!allPlaced}
          >
            {lang === "en" ? "Check" : "Проверить"}
          </button>
        )}
        <button className="t-btn t-btn-outline t-btn-lg" onClick={reset}>
          🔄 {lang === "en" ? "Reset" : "Сбросить"}
        </button>
      </div>

      <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
    </div>
  );
}
