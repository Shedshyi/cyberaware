import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RESEARCH } from "./config";

// Режим опыта определяет, что видит человек между входным и итоговым тестом.
//  full        — экспериментальная группа, гости, работа без Supabase: всё, включая
//                тренажёры, геймификацию и адаптивность;
//  traditional — контрольная группа: текст уроков и практические тесты с разбором.
// Входной и итоговый тест, анкета и сбор данных от режима не зависят.

const FEATURES = {
  full:        { trainers: true,  gamification: true,  adaptive: true,  hints: true  },
  traditional: { trainers: false, gamification: false, adaptive: false, hints: false },
};

const PREVIEW_KEY = "researcherPreview";
const ExperienceContext = createContext({ mode: "full", cohort: null, features: FEATURES.full });

function readPreview() {
  try { return localStorage.getItem(PREVIEW_KEY) || "full"; } catch { return "full"; }
}

export function ExperienceProvider({ children }) {
  const { enabled, user, profile } = useAuth();
  const [preview, setPreviewState] = useState(readPreview);

  const setPreview = useCallback((m) => {
    try { localStorage.setItem(PREVIEW_KEY, m); } catch { /* ignore */ }
    setPreviewState(m);
  }, []);

  const value = useMemo(() => {
    let mode = "full";
    let cohort = null;
    const researcher = profile?.role === "researcher";
    if (RESEARCH.enabled && enabled && user && profile) {
      if (researcher) mode = preview === "traditional" ? "traditional" : "full";
      else if (profile.consent && profile.cohort) {
        cohort = profile.cohort;
        mode = cohort === "control" ? "traditional" : "full";
      }
    }
    // Только в dev-сборке (npm run dev): принудительный режим для проверки без входа.
    // В опубликованном сайте import.meta.env.DEV = false, и эта ветка вырезается.
    if (import.meta.env.DEV) {
      try {
        const forced = localStorage.getItem("devExperience");
        if (forced === "full" || forced === "traditional") mode = forced;
      } catch { /* ignore */ }
    }
    return { mode, cohort, researcher, features: FEATURES[mode], preview, setPreview };
  }, [enabled, user, profile, preview, setPreview]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export const useExperience = () => useContext(ExperienceContext);

/** Обёртка маршрута: без нужной возможности — перенаправление к урокам. */
export function RequireFeature({ feature, children, to = "/lessons" }) {
  const { features } = useExperience();
  return features[feature] ? children : <Navigate to={to} replace />;
}

/** Показывает содержимое только при включённой возможности. */
export function IfFeature({ feature, children, otherwise = null }) {
  const { features } = useExperience();
  return features[feature] ? children : otherwise;
}
