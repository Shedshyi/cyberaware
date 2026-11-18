import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useExperience } from "../research/experience";
import { useLearner } from "../adaptive/useLearner";
import { describeStep, adaptiveText } from "../adaptive/messages";
import { logEvent } from "../lib/store";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import "../adaptive/adaptive.css";

const ICON = { lesson: "📘", test: "✍️", retest: "🔁", review: "📘", slow: "🐢", no_hints: "💪", break: "☕", post: "🏁", challenge: "🎯" };

const stepKey = (s) => `${s.kind}:${s.topic || ""}:${s.reason?.key || ""}`;

/** Один понятный следующий шаг с причиной. Только в режиме с адаптивностью. */
export default function NextStepCard({ placement = "home", compact = false }) {
  const { features } = useExperience();
  const { lang } = useLanguage();
  const { step, model } = useLearner();
  const navigate = useNavigate();

  const lessons = lang === "en" ? lessonsEN : lessonsRU;
  const topicName = step?.topic ? (lessons.find(l => l.id === step.topic)?.title || "").replace(/^\S+\s/, "") : "";
  const key = step ? stepKey(step) : null;

  // В журнал — каждый показ рекомендации (не чаще раза за сессию на место показа)
  useEffect(() => {
    if (!features.adaptive || !step) return;
    const seen = `rec:${placement}:${key}`;
    try { if (sessionStorage.getItem(seen)) return; sessionStorage.setItem(seen, "1"); } catch { /* ignore */ }
    logEvent("rec_shown", {
      placement, kind: step.kind, topic: step.topic ?? null, reason: step.reason?.key,
      globalLevel: model.global?.level ?? null, globalProfile: model.global?.profile ?? null,
    });
  }, [features.adaptive, key, placement]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!features.adaptive || !step) return null;
  const t = adaptiveText(lang);
  const { action, reason } = describeStep(step, lang, topicName);

  const go = () => {
    logEvent("rec_clicked", { placement, kind: step.kind, topic: step.topic ?? null, reason: step.reason?.key });
    try { sessionStorage.setItem("lastRec", JSON.stringify({ ...step, placement, at: Date.now() })); } catch { /* ignore */ }
    navigate(step.to);
  };

  return (
    <motion.div
      className={`ns-card${compact ? " ns-compact" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ns-icon" aria-hidden="true">{ICON[step.kind] || "➡️"}</div>
      <div className="ns-body">
        <p className="ns-eyebrow">{t.title}</p>
        <p className="ns-action">{action}</p>
        <p className="ns-reason"><span>{t.why}: </span>{reason}</p>
      </div>
      <button className="ns-go" onClick={go}>{t.go} →</button>
    </motion.div>
  );
}
