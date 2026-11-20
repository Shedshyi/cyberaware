// Метаданные обучающих заданий для адаптивной модели.
//
// Сложность (x₄ в модели ID137): 1 — Easy, 2 — Medium, 3 — Hard.
// У практических вопросов она хранится в самом банке (поле difficulty в src/data/testsData.js).
// Разметка выполнена разработчиком платформы по содержанию вопроса:
// Easy — узнать понятие или очевидное правило поведения; Medium — применить правило
// в ситуации или выбрать между похожими вариантами; Hard — понимать механизм атаки
// или защиты либо распознать хорошо замаскированный обман. Разметку стоит подтвердить
// у научного руководителя или экспертов. Итого 80 вопросов: 25 Easy, 27 Medium, 28 Hard.

import testsRU from "../data/testsData.js";

export const diffLevel = (testId, questionId) =>
  testsRU[testId]?.find(q => q.id === Number(questionId))?.difficulty ?? 2;

export const DIFF_FROM_WORD = { easy: 1, medium: 2, hard: 3 };

// Тема курса (id урока) по номеру практического теста
export const TOPIC_BY_TEST = {
  1: "basics", 2: "passwords", 3: "phishing", 4: "socials", 5: "malware",
  6: "wifi", 7: "updates", 8: "privacy", 9: "recovery", 10: "summary",
};
export const TEST_BY_TOPIC = Object.fromEntries(Object.entries(TOPIC_BY_TEST).map(([t, topic]) => [topic, Number(t)]));
export const TOPIC_ORDER = Object.values(TOPIC_BY_TEST);
