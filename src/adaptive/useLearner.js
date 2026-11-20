import { useEffect, useMemo, useState } from "react";
import { getInteractions, getLessonRead, getPreTopics, getTestResults, STORE_EVENT } from "../lib/store";
import { useAuth } from "../auth/AuthContext";
import { postGate } from "../research/config";
import { buildLearnerModel, nextStep } from "./learner";

/** Текущая модель ученика и следующий шаг; пересчитываются при любом изменении данных. */
export function useLearner() {
  const { research, profile } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener(STORE_EVENT, bump);
    window.addEventListener("focus", bump);
    return () => { window.removeEventListener(STORE_EVENT, bump); window.removeEventListener("focus", bump); };
  }, []);

  return useMemo(() => {
    const testResults = getTestResults();
    const model = buildLearnerModel({
      interactions: getInteractions(),
      testResults,
      lessonRead: getLessonRead(),
      preTopics: getPreTopics(),
    });
    const postUnlocked = postGate({ research, practiceDone: Object.keys(testResults).length, isTest: !!profile?.is_test }).unlocked;
    const step = nextStep(model, { postUnlocked, postDone: !!research?.post });
    return { model, step };
    // version меняется при изменении данных в хранилище
  }, [version, research, profile?.is_test]); // eslint-disable-line react-hooks/exhaustive-deps
}
