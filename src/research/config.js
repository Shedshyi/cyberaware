// Настройки эксперимента. Меняются здесь, без правки кода страниц.

export const RESEARCH = {
  // Включает обязательный поток для вошедших участников:
  // анкета и согласие → входной тест → обучение → итоговый тест.
  enabled: true,

  // Итоговый тест открывается, когда участник прошёл столько разных практических тестов.
  postTestMinPracticeTests: 5,

  // …и не раньше, чем через столько дней после входного теста: иначе итоговый тест
  // проверяет кратковременную память на те же вопросы, а не усвоение (в пилоте человек
  // прошёл весь курс за 30 минут). Тестовых аккаунтов (is_test) это не касается.
  // Та же проверка есть в базе (миграция 007) с запасом 12 часов на расхождение часов.
  postMinDaysAfterPre: 3,
};

/**
 * Открыт ли итоговый тест.
 * @param {object} p
 * @param {object} p.research     { pre: {date}|null, post }
 * @param {number} p.practiceDone число разных пройденных практических тестов
 * @param {boolean} [p.isTest]    тестовый аккаунт — без ожидания
 */
export function postGate({ research, practiceDone, isTest = false, now = Date.now() }) {
  const need = RESEARCH.postTestMinPracticeTests;
  const days = isTest ? 0 : RESEARCH.postMinDaysAfterPre;
  const preAt = research?.pre?.date ? Date.parse(research.pre.date) : null;
  const unlockAt = preAt != null ? preAt + days * 864e5 : null;
  const practiceOk = practiceDone >= need;
  const timeOk = unlockAt == null || now >= unlockAt;   // без даты проверяет только база
  return {
    need, days, practiceOk, timeOk, unlockAt,
    daysLeft: unlockAt != null ? Math.max(0, Math.ceil((unlockAt - now) / 864e5)) : 0,
    unlocked: !!research?.pre && practiceOk && timeOk,
  };
}
