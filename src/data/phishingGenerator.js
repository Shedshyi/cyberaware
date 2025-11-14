// src/data/phishingGenerator.js

const phishingPatterns = [
  {
    id: "fake_link",
    generate: () => `http://kasp1-secure-${Math.floor(Math.random() * 999)}.com`,
    reason: "Поддельная ссылка, похожая на Kaspi, но с ошибками.",
  },
  {
    id: "fake_bank",
    generate: () => `Kaspь Bank`,
    reason: "Название банка написано с ошибкой — классика фишинга.",
  },
  {
    id: "fake_number",
    generate: () => `+7 707 ${Math.floor(1000000 + Math.random() * 9000000)}`,
    reason: "Левый номер — не официальный контакт банка.",
  },
  {
    id: "urgent",
    generate: () => `СРОЧНО`,
    reason: "Мошенники создают давление срочностью.",
  },
  {
    id: "block",
    generate: () => `Ваш аккаунт был заблокирован`,
    reason: "Угрозы блокировки — один из самых частых триггеров.",
  },
  {
    id: "request_code",
    generate: () => `Отправьте код подтверждения`,
    reason: "Ни один банк не просит прислать код — это 100% мошенники.",
  }
];

export function generatePhishingSMS() {
  const count = 3 + Math.floor(Math.random() * 2);

  const selected = phishingPatterns
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .map(p => ({
      id: p.id,
      text: p.generate(),   // <-- текст превращаем в строку сразу!
      reason: p.reason
    }));

  const messageLines = [
    `Kaspi Bank уведомляет:`,
    ...selected.map(p => p.text),
    `Спасибо за использование Kaspi.`,
  ];

  return {
    message: messageLines.join("\n"),
    traps: selected
  };
}
