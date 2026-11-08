import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { RESEARCH } from "./config";

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

export default function ResearchGate() {
  const { enabled, loading, user, profile, research } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!RESEARCH.enabled || !enabled || loading || !user || !profile) return;
    if (ALWAYS_ALLOWED.includes(pathname)) return;
    const step = researchStep(profile, research);
    if (step === "onboarding") navigate("/research/start", { replace: true });
    else if (step === "pre") navigate("/research/pre", { replace: true });
  }, [enabled, loading, user, profile, research, pathname, navigate]);

  return null;
}
