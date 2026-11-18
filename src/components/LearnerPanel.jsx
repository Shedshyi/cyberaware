import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useExperience } from "../research/experience";
import { useLearner } from "../adaptive/useLearner";
import { adaptiveText } from "../adaptive/messages";
import { TOPIC_ORDER } from "../adaptive/items";
import { MIN_OBS_FOR_TOPIC } from "../adaptive/learner";
import lessonsRU from "../data/lessonsData";
import lessonsEN from "../data/lessonsData.en";
import "../adaptive/adaptive.css";

const LEVEL_CLASS = { Beginner: "lp-lv-beg", Intermediate: "lp-lv-int", Advanced: "lp-lv-adv" };

const PROFILE_HELP = {
  ru: {
    Consistent: "Отвечаешь ровно, без спешки и без опоры на подсказки.",
    Guessing: "На сложных вопросах ответы очень быстрые и часто неверные — стоит читать все варианты.",
    Fatigued: "К концу занятия время растёт, а точность падает — короткие сессии работают лучше.",
    "Hint-Dependent": "Подсказки берёшь чаще, чем отвечаешь верно сам — попробуй сначала без них.",
    Stagnating: "Результат держится на одном уровне — пора брать задания посложнее.",
  },
  en: {
    Consistent: "You answer steadily, without rushing or relying on hints.",
    Guessing: "Answers on hard questions are very fast and often wrong — read every option.",
    Fatigued: "Towards the end of a session you slow down and miss more — short sessions work better.",
    "Hint-Dependent": "You take hints more often than you answer correctly on your own — try without first.",
    Stagnating: "Your result has levelled off — time for harder tasks.",
  },
};

/** Прозрачность адаптивности: что модель знает о человеке. Только в экспериментальном режиме. */
export default function LearnerPanel() {
  const { features } = useExperience();
  const { lang } = useLanguage();
  const { model } = useLearner();
  if (!features.adaptive) return null;

  const en = lang === "en";
  const t = adaptiveText(lang);
  const lessons = en ? lessonsEN : lessonsRU;
  const name = (id) => (lessons.find(l => l.id === id)?.title || id).replace(/^\S+\s/, "");
  const g = model.global;

  return (
    <div className="lpn-card">
      <p className="lpn-title">🧭 {en ? "How the platform sees you" : "Как тебя видит платформа"}</p>
      {g ? (
        <div className="lpn-global">
          <span className={`lpn-chip ${LEVEL_CLASS[g.level]}`}>{t.level[g.level]}</span>
          <span className="lpn-chip lpn-chip-profile">{t.profile[g.profile]}</span>
          <p className="lpn-help">{PROFILE_HELP[en ? "en" : "ru"][g.profile]}</p>
          <p className="lpn-meta">
            {en ? `Based on your last ${Math.min(10, model.total)} answers · confidence ${Math.round(g.confidence * 100)}%`
                : `По последним ${Math.min(10, model.total)} ответам · уверенность оценки ${Math.round(g.confidence * 100)}%`}
          </p>
        </div>
      ) : (
        <p className="lpn-help">{en
          ? `Answer a few practice questions — after ${MIN_OBS_FOR_TOPIC} answers the platform starts tuning to you.`
          : `Ответь на несколько практических вопросов — после ${MIN_OBS_FOR_TOPIC} ответов платформа начнёт подстраиваться под тебя.`}</p>
      )}
      <div className="lpn-topics">
        {TOPIC_ORDER.map(id => {
          const tp = model.topics[id];
          return (
            <div className="lpn-topic" key={id}>
              <span className="lpn-topic-name">{name(id)}</span>
              {tp.level
                ? <span className={`lpn-chip ${LEVEL_CLASS[tp.level]}`}>{t.level[tp.level]}</span>
                : <span className="lpn-chip lpn-chip-none">{tp.n ? `${tp.n}/${MIN_OBS_FOR_TOPIC}` : "—"}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
