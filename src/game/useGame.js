import { useEffect, useMemo, useState } from "react";
import { STORE_EVENT } from "../lib/store";
import { getGameState } from "./game";
import { rankProgress, streak, dayKey, DAILY_GOAL_XP } from "./engine";

/** Состояние геймификации для интерфейса; обновляется при любом изменении данных. */
export function useGame() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV(x => x + 1);
    window.addEventListener(STORE_EVENT, bump);
    window.addEventListener("focus", bump);
    return () => { window.removeEventListener(STORE_EVENT, bump); window.removeEventListener("focus", bump); };
  }, []);
  return useMemo(() => {
    const state = getGameState();
    const today = dayKey();
    return {
      state,
      rank: rankProgress(state.xp),
      streak: streak(state, today),
      todayXp: state.days[today] || 0,
      goal: DAILY_GOAL_XP,
      goalMet: !!state.goalDays[today],
    };
  }, [v]);
}
