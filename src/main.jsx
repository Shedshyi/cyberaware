import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "antd/dist/reset.css";
import "./styles.css";
import { MotionGlobalConfig } from "framer-motion";

// Только для разработки: localStorage.devNoMotion = "1" мгновенно завершает анимации
// (нужно для автоматической проверки в фоновой вкладке, где кадры почти не рисуются).
if (import.meta.env.DEV) {
  try { if (localStorage.getItem("devNoMotion") === "1") MotionGlobalConfig.skipAnimations = true; } catch { /* ignore */ }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
