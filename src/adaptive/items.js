// Метаданные обучающих заданий для адаптивной модели.
//
// Сложность (x₄ в модели ID137): 1 — Easy, 2 — Medium, 3 — Hard.
// Разметка практических тестов выполнена разработчиком платформы по содержанию вопроса:
// Easy — узнать понятие или очевидное правило поведения; Medium — применить правило
// в ситуации или выбрать между похожими вариантами; Hard — понимать механизм атаки
// или защиты (SSL stripping, WEP, fileless, деанонимизация). Разметку стоит подтвердить
// у научного руководителя или экспертов. Итого: 17 Easy, 21 Medium, 12 Hard.

export const PRACTICE_DIFFICULTY = {
  1:  { 1: 2, 2: 1, 3: 1, 4: 2, 5: 1 },
  2:  { 1: 2, 2: 2, 3: 3, 4: 2, 5: 3 },
  3:  { 1: 1, 2: 1, 3: 2, 4: 1, 5: 2 },
  4:  { 1: 2, 2: 3, 3: 3, 4: 1, 5: 2 },
  5:  { 1: 2, 2: 1, 3: 2, 4: 3, 5: 2 },
  6:  { 1: 3, 2: 2, 3: 1, 4: 3, 5: 1 },
  7:  { 1: 2, 2: 1, 3: 1, 4: 3, 5: 1 },
  8:  { 1: 3, 2: 3, 3: 2, 4: 2, 5: 1 },
  9:  { 1: 1, 2: 2, 3: 2, 4: 1, 5: 3 },
  10: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 2 },
};

export const diffLevel = (testId, questionId) => PRACTICE_DIFFICULTY[testId]?.[questionId] ?? 2;

export const DIFF_FROM_WORD = { easy: 1, medium: 2, hard: 3 };

// Тема курса (id урока) по номеру практического теста
export const TOPIC_BY_TEST = {
  1: "basics", 2: "passwords", 3: "phishing", 4: "socials", 5: "malware",
  6: "wifi", 7: "updates", 8: "privacy", 9: "recovery", 10: "summary",
};
export const TEST_BY_TOPIC = Object.fromEntries(Object.entries(TOPIC_BY_TEST).map(([t, topic]) => [topic, Number(t)]));
export const TOPIC_ORDER = Object.values(TOPIC_BY_TEST);
