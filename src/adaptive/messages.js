// Тексты для адаптивности: что сделать и почему. Тон поддерживающий, без оценок личности.

const T = {
  ru: {
    action: {
      lesson: "Открой урок «{topic}»",
      test: "Пройди практический тест «{topic}»",
      retest: "Пересдай практический тест «{topic}»",
      review: "Вернись к уроку «{topic}»",
      slow: "Тест «{topic}» — в спокойном темпе",
      no_hints: "Тест «{topic}» — попробуй без подсказок",
      break: "Сделай короткий перерыв",
      post: "Пройди итоговый тест",
      challenge: "Hacker Game на повышенной сложности",
    },
    reason: {
      pre_weak: "Во входном тесте по этой теме было сложно — начнём с неё, тут больше всего пользы.",
      pre_partial: "Во входном тесте эта тема получилась наполовину — урок закроет пробелы.",
      pre_unknown: "Следующая тема курса.",
      pre_known: "Во входном тесте ты справился с этой темой — урок пройдёт быстро и закрепит знания.",
      lesson_done: "Урок уже прочитан — проверь себя, пока материал свежий.",
      weak_score: "Последний результат {pct}% — до зачёта 75% совсем немного.",
      weak_consistent: "Модель видит, что эта тема пока даётся труднее остальных — повторение поможет.",
      weak_guessing: "На сложных вопросах этой темы ответы были очень быстрыми — разберём материал ещё раз.",
      "weak_hint-dependent": "В этой теме часто нужны подсказки — повторим основы, чтобы справляться самостоятельно.",
      weak_fatigued: "К концу занятия по этой теме точность падала — повтори на свежую голову.",
      weak_stagnating: "Результат по теме держится на одном уровне — новый заход по уроку поможет сдвинуться.",
      guessing: "На сложных вопросах ты отвечаешь за несколько секунд и часто промахиваешься. Читай все варианты — это сразу добавит баллов.",
      hints: "Подсказки помогают, но ты справишься и без них — проверь себя.",
      fatigued: "Время ответа растёт, а точность падает — так бывает к концу занятия. 5–10 минут отдыха вернут фокус.",
      post_ready: "Ты прошёл достаточно практики — можно посмотреть, насколько вырос результат.",
      stagnating: "Обычные задания уже не дают роста — попробуй сложные.",
      all_done: "Все темы пройдены. Сложные раунды помогут удержать навык.",
    },
    title: "Следующий шаг",
    why: "Почему",
    go: "Перейти",
    profile: {
      Consistent: "Ровный темп", Guessing: "Спешка на сложных", Fatigued: "Усталость",
      "Hint-Dependent": "Опора на подсказки", Stagnating: "Плато",
    },
    level: { Beginner: "Начальный", Intermediate: "Средний", Advanced: "Продвинутый" },
  },
  en: {
    action: {
      lesson: "Open the “{topic}” lesson",
      test: "Take the “{topic}” practice test",
      retest: "Retake the “{topic}” practice test",
      review: "Go back to the “{topic}” lesson",
      slow: "“{topic}” test — at a calm pace",
      no_hints: "“{topic}” test — try without hints",
      break: "Take a short break",
      post: "Take the final test",
      challenge: "Hacker Game on a harder level",
    },
    reason: {
      pre_weak: "This topic was hard in the entry test — starting here helps the most.",
      pre_partial: "You got half of this topic in the entry test — the lesson will close the gaps.",
      pre_unknown: "The next topic of the course.",
      pre_known: "You handled this topic in the entry test — the lesson will be quick and lock it in.",
      lesson_done: "You've read the lesson — check yourself while it's fresh.",
      weak_score: "Your last result was {pct}% — the 75% pass mark is close.",
      weak_consistent: "This topic is harder for you than the others so far — a review will help.",
      weak_guessing: "Answers on the hard questions of this topic were very fast — let's go over it again.",
      "weak_hint-dependent": "Hints were often needed here — let's review the basics so you can do it on your own.",
      weak_fatigued: "Accuracy dropped towards the end of this topic — review it with a fresh mind.",
      weak_stagnating: "Your result here has levelled off — a fresh pass through the lesson will move it.",
      guessing: "On hard questions you answer in a few seconds and often miss. Reading every option will add points right away.",
      hints: "Hints help, but you can do it without them — check yourself.",
      fatigued: "Your answers are getting slower and less accurate — that happens late in a session. 5–10 minutes of rest will restore focus.",
      post_ready: "You've practised enough — time to see how much your result has grown.",
      stagnating: "Regular tasks no longer move you forward — try the hard ones.",
      all_done: "All topics done. Hard rounds will keep the skill sharp.",
    },
    title: "Next step",
    why: "Why",
    go: "Go",
    profile: {
      Consistent: "Steady pace", Guessing: "Rushing hard questions", Fatigued: "Fatigue",
      "Hint-Dependent": "Relying on hints", Stagnating: "Plateau",
    },
    level: { Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced" },
  },
};

const fill = (s, params = {}) => s.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");

export const adaptiveText = (lang) => T[lang] || T.ru;

export function describeStep(step, lang, topicName) {
  const t = adaptiveText(lang);
  const params = { ...(step.reason?.params || {}), topic: topicName || "" };
  return {
    action: fill(t.action[step.kind] || "", params),
    reason: fill(t.reason[step.reason?.key] || t.reason.pre_unknown, params),
  };
}
