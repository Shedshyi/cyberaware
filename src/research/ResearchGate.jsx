import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RESEARCH } from "./config";
import { assignCohort, logEvent } from "../lib/store";

// Направляет вошедшего участника по шагам исследования:
// анкета и согласие → входной тест → свободное обучение.
// Гости (без входа) и исследователи не затрагиваются.
const ALWAYS_ALLOWED = ["/login", "/research/start", "/research/pre"];

export function researchStep(profile, research) {
  if (!profile) return "loading";
  if (profile.role === "researcher") return "researcher";
  if (!profile.consent) return "onboarding";
  if (!research?.pre) return "pre";
  return "learning";
}

export default function ResearchGate({ children }) {
  const { enabled, loading, user, profile, research, refreshProfile } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const assignTried = useRef(false);

  // Участник с согласием, но без группы (например, назначение не прошло из-за сети) —
  // одна повторная попытка за сессию.
  useEffect(() => {
    if (!RESEARCH.enabled || !enabled || !profile || assignTried.current) return;
    if (profile.role !== "participant" || !profile.consent || profile.cohort_assigned_at) return;
    // Анкета уже назначила группу в этой сессии — профиль просто ещё не обновился
    try { if (sessionStorage.getItem("cohortAssigned")) return; } catch { /* ignore */ }
    assignTried.current = true;
    assignCohort().then(cohort => {
      if (cohort) { logEvent("cohort_assigned", { cohort, retry: true }); refreshProfile(); }
    });
  }, [enabled, profile, refreshProfile]);

  useEffect(() => {
    if (!RESEARCH.enabled || !enabled || loading || !user || !profile) return;
    if (ALWAYS_ALLOWED.includes(pathname)) return;
    const step = researchStep(profile, research);
    if (step === "onboarding") navigate("/research/start", { replace: true });
    else if (step === "pre") navigate("/research/pre", { replace: true });
  }, [enabled, loading, user, profile, research, pathname, navigate]);

  // Пока участнику нужна анкета или входной тест, другие страницы не отрисовываются вовсе:
  // иначе они успевают записать события (открытие урока и т.п.) до перенаправления.
  if (RESEARCH.enabled && enabled && user && !ALWAYS_ALLOWED.includes(pathname)) {
    if (loading) return null;
    if (!profile) return children ?? null; // профиль не загрузился — страница в урезанном режиме
    const step = researchStep(profile, research);
    if (step === "onboarding" || step === "pre") return null;
  }
  return children ?? null;
}
