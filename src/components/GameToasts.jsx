import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { GAME_EVENT } from "../game/game";
import { BADGE_TEXT, GAIN_TEXT, RANKS } from "../game/content";
import "../game/game.css";

let seq = 0;

/** Короткие поддерживающие уведомления: опыт, новая награда, новое звание, дневная цель. */
export default function GameToasts() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onGame = (e) => {
      const r = e.detail;
      const next = [];
      const total = r.gains.filter(g => g.reason !== "daily_goal").reduce((a, g) => a + g.amount, 0);
      if (total > 0) {
        const main = [...r.gains].sort((a, b) => b.amount - a.amount)[0];
        next.push({ id: ++seq, kind: "xp", text: `+${total} ${en ? "XP" : "опыта"}`, sub: GAIN_TEXT[lang]?.[main.reason] });
      }
      if (r.goalMet) next.push({ id: ++seq, kind: "goal", text: en ? "Daily goal met" : "Дневная цель выполнена", sub: r.streak > 1 ? (en ? `${r.streak} days in a row` : `${r.streak} дн. подряд`) : (en ? "See you tomorrow!" : "До завтра!") });
      if (r.levelUp !== null) next.push({ id: ++seq, kind: "rank", text: `${en ? "New rank" : "Новое звание"}: ${RANKS[lang][r.levelUp].name}`, sub: RANKS[lang][r.levelUp].line });
      for (const b of r.newBadges) {
        const t = BADGE_TEXT[lang][b];
        next.push({ id: ++seq, kind: "badge", icon: t.icon, text: `${en ? "New badge" : "Новая награда"}: ${t.title}`, sub: t.desc });
      }
      if (!next.length) return;
      setItems(cur => [...cur, ...next].slice(-3));
      for (const n of next) setTimeout(() => setItems(cur => cur.filter(x => x.id !== n.id)), n.kind === "xp" ? 2800 : 4500);
    };
    window.addEventListener(GAME_EVENT, onGame);
    return () => window.removeEventListener(GAME_EVENT, onGame);
  }, [lang, en]);

  return (
    <div className="gt-stack" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map(it => (
          <motion.div
            key={it.id}
            className={`gt-toast gt-${it.kind}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <span className="gt-icon" aria-hidden="true">{it.icon || { xp: "✨", goal: "🎯", rank: "⭐", badge: "🏅" }[it.kind]}</span>
            <span className="gt-text"><b>{it.text}</b>{it.sub && <small>{it.sub}</small>}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
