import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

const SCENARIOS_RU = [
  {
    id: 1,
    context: "📞 Входящий звонок",
    situation: "Вам звонит человек, представившийся сотрудником вашего банка. Он говорит, что зафиксирован подозрительный перевод с вашей карты и просит назвать CVC-код с обратной стороны карты для «отмены транзакции».",
    options: [
      { text: "Называю CVC-код — нужно быстро отменить перевод",               score: 0 },
      { text: "Прошу перезвонить позже, чтобы сначала проверить",               score: 1 },
      { text: "Кладу трубку и сам звоню в банк по номеру с карты или сайта",    score: 2 },
    ],
    correctIndex: 2,
    explanation: "Банки никогда не запрашивают CVC по телефону — этого не требует ни одна реальная процедура безопасности. Единственно верный ответ: положить трубку и позвонить самому на официальный номер. Просьба «перезвонить» не устраняет угрозу — мошенник может перезвонить снова.",
  },
  {
    id: 2,
    context: "✉️ Рабочий email",
    situation: "Вы получаете письмо с темой «⚠️ СРОЧНО» якобы от CEO вашей компании. Он просит срочно перевести 150 000 тенге поставщику, потому что сам сейчас в самолёте без связи. «Детали скажу после, просто сделай это сейчас.»",
    options: [
      { text: "Перевожу — это же директор, нужно помочь",                              score: 0 },
      { text: "Отвечаю на письмо с уточняющими вопросами",                             score: 1 },
      { text: "Проверяю реальный email отправителя и звоню CEO по его рабочему номеру", score: 2 },
    ],
    correctIndex: 2,
    explanation: "Business Email Compromise (BEC) — один из самых прибыльных видов мошенничества. Ключевые признаки: срочность, изоляция («в самолёте»), просьба обойти стандартные процедуры. Ответ на письмо бесполезен — почтовый адрес может быть подделан. Всегда проверяй по отдельному каналу (звонок).",
  },
  {
    id: 3,
    context: "🔌 Физическая угроза",
    situation: "В коридоре офиса вы нашли USB-флешку с наклейкой «ЗАРПЛАТЫ_СОТРУДНИКОВ_2024». Никого рядом нет. Вам интересно, чья она.",
    options: [
      { text: "Подключаю к рабочему ноутбуку — нужно выяснить владельца",   score: 0 },
      { text: "Оставляю на ресепшн или общем столе",                         score: 1 },
      { text: "Сдаю в IT-отдел или службу безопасности и не подключаю сам",  score: 2 },
    ],
    correctIndex: 2,
    explanation: "«Флешка-ловушка» — классическая техника атаки. Злоумышленники специально оставляют устройства с provocative-названиями. При подключении запускается скрипт автозапуска или эксплойт. Исследования показывают, что ~48% людей подключают найденные флешки. Оставить на ресепшн — тоже плохо: её может подключить кто-то другой.",
  },
  {
    id: 4,
    context: "💬 Сообщение в соцсети",
    situation: "Вам пишет в Facebook старый одноклассник: «Привет! Застрял в Турции, потерял кошелёк и телефон. Можешь кинуть 20 000 тенге? Карту скину в личку. Как вернусь — сразу верну, клянусь!»",
    options: [
      { text: "Перевожу — нужно помочь человеку в беде",                                  score: 0 },
      { text: "Прошу прислать фото с паспортом для подтверждения",                        score: 1 },
      { text: "Звоню одноклассникам напрямую по его реальному номеру, чтобы убедиться",   score: 2 },
    ],
    correctIndex: 2,
    explanation: "Взломанные аккаунты в соцсетях используются для мошенничества среди контактов жертвы — злоумышленник рассылает просьбы о деньгах от лица настоящего человека. Фото с паспортом могло быть скомпрометировано. Единственная надёжная проверка — живой звонок на номер, который вы знаете.",
  },
  {
    id: 5,
    context: "🖥️ Всплывающее окно",
    situation: "На экране браузера появляется большое красное окно: «⚠️ ВНИМАНИЕ! Ваш компьютер заражён 3 вирусами. Ваши данные в опасности! Позвоните НЕМЕДЛЕННО: +7-800-XXX-XX-XX или нажмите ОК для очистки.» Окно не закрывается.",
    options: [
      { text: "Звоню по номеру — лучше перестраховаться",                                    score: 0 },
      { text: "Нажимаю ОК — пусть очистит компьютер",                                        score: 0 },
      { text: "Закрываю браузер через диспетчер задач / Force Quit, игнорирую окно",          score: 2 },
    ],
    correctIndex: 2,
    explanation: "Это «scareware» — браузерная пугалка без каких-либо реальных сведений о вирусах. Легитимный антивирус не использует всплывающие окна браузера. Звонок — платный номер с псевдоподдержкой, кнопка ОК — установка malware. Жёсткое закрытие браузера (Ctrl+Shift+Esc → завершить процесс) — единственное правильное действие.",
  },
  {
    id: 6,
    context: "🔑 Просьба коллеги",
    situation: "Коллега подходит к вам: «Помоги, забыл пропуск в машине. Приложи свою карту на вход в серверную, мне нужно забрать там ноутбук. Я быстро». Вы его знаете лично.",
    options: [
      { text: "Прикладываю свою карту — ведь я его знаю, ничего страшного",    score: 0 },
      { text: "Сопровождаю его сам и прикладываю карту, не оставляя одного",    score: 1 },
      { text: "Объясняю, что не могу, и предлагаю обратиться к охране / IT",    score: 2 },
    ],
    correctIndex: 2,
    explanation: "Tailgating (следование по чужому пропуску) — распространённый вектор физического взлома. Даже если вы знаете этого человека, его аккаунт мог быть скомпрометирован или он действует под давлением. Системы доступа фиксируют, кто вошёл — ваша карта означает вашу ответственность. Стандартный протокол: перенаправить к охране.",
  },
];

const SCENARIOS_EN = [
  {
    id: 1,
    context: "📞 Incoming call",
    situation: "Someone calls claiming to be from your bank's fraud department. They say a suspicious transaction was detected on your card and ask you to confirm your card's CVV code to 'cancel the transfer'.",
    options: [
      { text: "Give the CVV — need to cancel the transfer quickly",                   score: 0 },
      { text: "Ask them to call back so you can verify first",                        score: 1 },
      { text: "Hang up and call the bank directly using the number on my card/website", score: 2 },
    ],
    correctIndex: 2,
    explanation: "Banks never ask for CVV codes over the phone — no legitimate security procedure requires it. The only correct action is to hang up and call the official number yourself. Asking them to call back doesn't remove the threat — the fraudster can call again.",
  },
  {
    id: 2,
    context: "✉️ Work email",
    situation: "You receive an email with the subject '⚠️ URGENT' apparently from your CEO. They ask you to wire $5,000 to a supplier immediately because they're on a flight without phone access. 'I'll explain details later, just do it now.'",
    options: [
      { text: "Send the wire — it's the CEO, I should help",                              score: 0 },
      { text: "Reply to the email asking for clarification",                              score: 1 },
      { text: "Check the actual sender's email and call the CEO directly on their office number", score: 2 },
    ],
    correctIndex: 2,
    explanation: "Business Email Compromise (BEC) is one of the most profitable scams. Key red flags: urgency, isolation ('on a flight'), and requests to bypass normal procedures. Replying to the email is useless — the sender address can be spoofed. Always verify via a separate channel (phone call).",
  },
  {
    id: 3,
    context: "🔌 Physical threat",
    situation: "You find a USB drive in the office hallway labeled 'EMPLOYEE_SALARIES_2024'. No one is around. You're curious whose it is.",
    options: [
      { text: "Plug it into my work laptop — need to find the owner",           score: 0 },
      { text: "Leave it at reception or on the common table",                   score: 1 },
      { text: "Hand it to IT security and don't plug it in myself",             score: 2 },
    ],
    correctIndex: 2,
    explanation: "'Baiting' with USB drives is a classic attack. Attackers intentionally leave devices with provocative labels. Plugging one in can execute an autorun script or exploit. Studies show ~48% of people plug in found USB drives. Leaving it at reception is also bad — someone else might plug it in.",
  },
  {
    id: 4,
    context: "💬 Social media message",
    situation: "An old friend messages you on Facebook: 'Hey! I'm stuck in Turkey — lost my wallet and phone. Can you send $200? I'll send you payment details in a PM. I'll pay you back the moment I'm home, I promise!'",
    options: [
      { text: "Send the money — need to help someone in trouble",                   score: 0 },
      { text: "Ask them to send a photo with their ID to confirm identity",         score: 1 },
      { text: "Call the friend directly on their real phone number to verify",      score: 2 },
    ],
    correctIndex: 2,
    explanation: "Compromised social media accounts are used to run scams against the victim's contacts — attackers send money requests posing as the real person. An ID photo could also have been compromised. The only reliable verification is a live phone call to a number you already know.",
  },
  {
    id: 5,
    context: "🖥️ Browser pop-up",
    situation: "A large red window appears in your browser: '⚠️ WARNING! Your computer is infected with 3 viruses. Your data is at risk! Call IMMEDIATELY: 1-800-XXX-XXXX or click OK to clean.' The window won't close.",
    options: [
      { text: "Call the number — better safe than sorry",                                   score: 0 },
      { text: "Click OK — let it clean the computer",                                       score: 0 },
      { text: "Force-close the browser via Task Manager / Force Quit and ignore the window", score: 2 },
    ],
    correctIndex: 2,
    explanation: "This is 'scareware' — a browser scare tactic with no real information about viruses. Legitimate antivirus doesn't use browser pop-ups. Calling connects you to a paid fake support line; clicking OK installs malware. Force-closing the browser (Ctrl+Shift+Esc → End task) is the only correct action.",
  },
  {
    id: 6,
    context: "🔑 Colleague's request",
    situation: "A colleague approaches you: 'Can you help? I left my badge in the car. Swipe your card to let me into the server room — I just need to grab a laptop. Won't take a second.' You know them personally.",
    options: [
      { text: "Swipe my card — I know them, it's fine",                        score: 0 },
      { text: "Accompany them and swipe my card, staying with them the whole time", score: 1 },
      { text: "Explain I can't and direct them to security / IT",               score: 2 },
    ],
    correctIndex: 2,
    explanation: "Tailgating (using someone else's badge) is a common physical security attack. Even if you know the person, their account may have been compromised, or they may be acting under pressure. Access systems log who entered — your card means your responsibility. Standard protocol: redirect to security.",
  },
];

export default function SocialEngineeringPage() {
  const { lang } = useLanguage();
  const scenarios = lang === "en" ? SCENARIOS_EN : SCENARIOS_RU;

  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore]       = useState(0);
  const [finished, setFinished] = useState(false);

  const current = scenarios[idx];

  const handleSelect = (optIdx) => {
    if (selected !== null) return;
    setSelected(optIdx);
    setScore((s) => s + current.options[optIdx].score);
  };

  const handleNext = () => {
    if (idx + 1 >= scenarios.length) setFinished(true);
    else { setIdx((i) => i + 1); setSelected(null); }
  };

  const handleRestart = () => {
    setIdx(0); setSelected(null); setScore(0); setFinished(false);
  };

  const maxScore = scenarios.length * 2;
  const pct = Math.round((score / maxScore) * 100);

  if (finished) {
    const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
    const msg = lang === "en"
      ? pct >= 70 ? "Excellent awareness! You're resistant to manipulation."
        : pct >= 40 ? "Not bad, but some scenarios need more work."
        : "Study social engineering techniques in more depth."
      : pct >= 70 ? "Отличная осведомлённость! Ты устойчив к манипуляциям."
        : pct >= 40 ? "Неплохо, но есть сценарии, над которыми стоит поработать."
        : "Стоит изучить техники социальной инженерии подробнее.";
    return (
      <div className="trainer-page">
        <div className="trainer-header">
          <p className="trainer-eyebrow">{lang === "en" ? "Result" : "Результат"}</p>
          <h1 className="trainer-title">{lang === "en" ? "Social Engineering" : "Социальная инженерия"}</h1>
        </div>
        <motion.div className="trainer-card" style={{ textAlign: "center" }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{pct}%</div>
          <p style={{ margin: "10px 0 6px", fontSize: 16, color: "#374151" }}>{msg}</p>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#9ca3af" }}>
            {lang === "en" ? `Points: ${score} of ${maxScore}` : `Баллов: ${score} из ${maxScore}`}
          </p>
          <div style={{ height: 10, background: "#f3f4f6", borderRadius: 100, marginBottom: 28, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
              style={{ height: "100%", background: color, borderRadius: 100 }} />
          </div>
          <button className="t-btn t-btn-primary t-btn-lg" onClick={handleRestart}>
            {lang === "en" ? "Play again" : "Пройти снова"}
          </button>
        </motion.div>
        <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
      </div>
    );
  }

  return (
    <div className="trainer-page">
      <div className="trainer-header">
        <p className="trainer-eyebrow">{lang === "en" ? "Trainer" : "Тренажёр"} · {idx + 1} / {scenarios.length}</p>
        <h1 className="trainer-title">{lang === "en" ? "Social Engineering" : "Социальная инженерия"}</h1>
        <p className="trainer-subtitle">
          {lang === "en" ? "Real manipulation scenarios. Choose the right response." : "Реальные сценарии манипуляции. Выбери правильную реакцию."}
        </p>
      </div>

      <div style={{ height: 4, background: "#f3f4f6", borderRadius: 100, marginBottom: 28, overflow: "hidden" }}>
        <motion.div animate={{ width: `${(idx / scenarios.length) * 100}%` }} transition={{ duration: 0.4 }}
          style={{ height: "100%", background: "#6366f1", borderRadius: 100 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
          <div className="trainer-card" style={{ marginBottom: 16 }}>
            <span style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 100,
              background: "#ede9fe", color: "#6d28d9",
              fontSize: 13, fontWeight: 700, marginBottom: 14,
            }}>
              {current.context}
            </span>
            <p style={{ margin: 0, fontSize: 16, color: "#1f2937", lineHeight: 1.7, fontWeight: 500 }}>
              {current.situation}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {current.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect  = i === current.correctIndex;
              const showState  = selected !== null;
              let bg = "#fff", border = "#e5e7eb", color = "#374151";
              if (showState && isCorrect)  { bg = "#f0fdf4"; border = "#86efac"; color = "#166534"; }
              if (showState && isSelected && !isCorrect) { bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b"; }
              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={selected !== null}
                  whileHover={selected === null ? { y: -2, boxShadow: "0 6px 16px rgba(0,0,0,0.08)" } : {}}
                  style={{
                    width: "100%", textAlign: "left", padding: "16px 18px",
                    borderRadius: 14, border: `1.5px solid ${border}`,
                    background: bg, color, cursor: selected !== null ? "default" : "pointer",
                    fontSize: 15, fontWeight: 500, lineHeight: 1.5,
                    transition: "all 0.2s", fontFamily: "inherit",
                    display: "flex", alignItems: "flex-start", gap: 12,
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: showState && isCorrect ? "#10b981" : showState && isSelected ? "#ef4444" : "#f3f4f6",
                    color: (showState && (isCorrect || isSelected)) ? "#fff" : "#9ca3af",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {showState && isCorrect ? "✓" : showState && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  {opt.text}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {selected !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="trainer-card" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1e40af" }}>
                  💡 {lang === "en" ? "Explanation" : "Разбор"}
                </p>
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "#1e3a8a", lineHeight: 1.65 }}>
                  {current.explanation}
                </p>
                <button className="t-btn t-btn-primary" onClick={handleNext}>
                  {idx + 1 < scenarios.length
                    ? (lang === "en" ? "Next scenario →" : "Следующий сценарий →")
                    : (lang === "en" ? "Results" : "Результаты")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
    </div>
  );
}
