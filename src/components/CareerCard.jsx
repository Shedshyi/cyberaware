import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../auth/AuthContext";
import { useExperience } from "../research/experience";
import { useGame } from "../game/useGame";
import { useLearner } from "../adaptive/useLearner";
import { BADGES, medal } from "../game/engine";
import { BADGE_TEXT, MEDAL, MEDAL_ICON, RANKS } from "../game/content";
import { teamProgress } from "../game/game";
import { TOPIC_ORDER } from "../adaptive/items";
import { getLessonRead } from "../lib/store";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import "../game/game.css";

function GoalRing({ value, goal }) {
  const r = 22, c = 2 * Math.PI * r, frac = Math.min(1, value / goal);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 28 28)" style={{ transition: "stroke-dashoffset .5s" }} />
    </svg>
  );
}

/** Карьера в центре киберзащиты: звание, дневная цель, серия, карта миссий, награды. */
export default function CareerCard() {
  const { features, cohort } = useExperience();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const game = useGame();
  const { model } = useLearner();
  const [team, setTeam] = useState(null);

  useEffect(() => {
    if (features.gamification && user && cohort === "experimental") teamProgress().then(setTeam);
  }, [features.gamification, user, cohort]);

  if (!features.gamification) return null;
  const en = lang === "en";
  const ranks = RANKS[lang] || RANKS.ru;
  const rank = ranks[game.rank.index];
  const nextRank = ranks[game.rank.index + 1];
  const lessons = en ? lessonsEN : lessonsRU;
  const read = getLessonRead();

  return (
    <div className="cc-card">
      <div className="cc-top">
        <div className="cc-rank">
          <p className="cc-eyebrow">{en ? "Your rank" : "Твоё звание"}</p>
          <p className="cc-rank-name">{rank.name}</p>
          <p className="cc-rank-line">{rank.line}</p>
          <div className="cc-xp-bar" aria-label={en ? "Progress to next rank" : "Прогресс до следующего звания"}>
            <div style={{ width: `${game.rank.pct}%` }} />
          </div>
          <p className="cc-xp-meta">
            {game.state.xp} {en ? "XP" : "опыта"}
            {nextRank ? ` · ${en ? "next" : "дальше"}: ${nextRank.name} (${game.rank.to})` : ""}
          </p>
        </div>
        <div className="cc-today">
          <div className="cc-ring">
            <GoalRing value={game.todayXp} goal={game.goal} />
            <span>{Math.min(game.todayXp, game.goal)}/{game.goal}</span>
          </div>
          <div>
            <p className="cc-today-title">{game.goalMet ? (en ? "Daily goal met" : "Цель на сегодня выполнена") : (en ? "Today's goal" : "Цель на сегодня")}</p>
            <p className="cc-today-sub">
              {game.streak > 0
                ? `🔥 ${game.streak} ${en ? (game.streak === 1 ? "day" : "days") : "дн."} ${en ? "in a row" : "подряд"}`
                : (en ? "One lesson and one test is enough" : "Хватит одного урока и одного теста")}
            </p>
          </div>
        </div>
      </div>

      <p className="cc-section">{en ? "Missions" : "Миссии"}</p>
      <div className="cc-missions">
        {TOPIC_ORDER.map((id, i) => {
          const m = medal(game.state, id, { lessonRead: !!read[id], topicLevel: model.topics[id]?.level });
          const title = (lessons.find(l => l.id === id)?.title || id).replace(/^\S+\s/, "");
          return (
            <Link key={id} to={`/lessons/${id}`} className={`cc-mission cc-m-${m || "none"}`} title={m ? MEDAL[lang][m] : ""}>
              <span className="cc-mission-num">{i + 1}</span>
              <span className="cc-mission-name">{title}</span>
              <span className="cc-mission-medal">{m ? `${MEDAL_ICON[m]} ${MEDAL[lang][m]}` : "—"}</span>
            </Link>
          );
        })}
      </div>

      <p className="cc-section">{en ? "Badges" : "Награды"} · {Object.keys(game.state.badges).length}/{BADGES.length}</p>
      <div className="cc-badges">
        {BADGES.map(b => {
          const t = BADGE_TEXT[lang][b.id];
          const got = !!game.state.badges[b.id];
          return (
            <div key={b.id} className={`cc-badge${got ? " got" : ""}`}>
              <span className="cc-badge-icon">{t.icon}</span>
              <span className="cc-badge-title">{t.title}</span>
              <span className="cc-badge-desc">{t.desc}</span>
            </div>
          );
        })}
      </div>

      {team && team.members > 1 && (
        <p className="cc-team">
          🤝 {en
            ? `Your team of ${team.members} interns has passed ${team.topics_passed} topics together.`
            : `Команда из ${team.members} стажёров вместе сдала ${team.topics_passed} тем.`}
        </p>
      )}
    </div>
  );
}
