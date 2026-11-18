import { useEffect, useRef } from "react";
import { logEvent } from "../lib/store";

/**
 * Общий журнал для тренажёров: факт открытия (trainer_open) и замер времени ответа.
 * mark() — начать отсчёт (новый раунд показан), elapsed() — сколько мс прошло.
 */
export function useTrainerLog(trainer) {
  const startedAt = useRef(Date.now());
  useEffect(() => { logEvent("trainer_open", { trainer }); }, [trainer]);
  return {
    mark: () => { startedAt.current = Date.now(); },
    elapsed: () => Date.now() - startedAt.current,
  };
}
