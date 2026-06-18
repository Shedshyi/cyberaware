import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

const ALL_NEWS_RU = [
  { text: "Google официально покупает Казахстан за 10 миллиардов тенге", source: "news-info-kz.ru", isFake: true, explanation: "Государства не продаются компаниям. Кроме того, домен 'news-info-kz.ru' — не официальный казахстанский СМИ. Признаки фейка: абсурдное содержание + ненадёжный источник." },
  { text: "Учёные доказали: 5 часов сна в сутки вполне достаточно для здоровья", source: "healthfacts24.net", isFake: true, explanation: "ВОЗ рекомендует 7–9 часов для взрослых. Подобные 'открытия' — типичная приманка для кликов. Всегда проверяй: есть ли ссылка на оригинальное научное исследование?" },
  { text: "Новый вирус передаётся через сигнал Wi-Fi — учёные бьют тревогу", source: "viruswarning.info", isFake: true, explanation: "Биологические вирусы не могут передаваться через радиоволны — это физически невозможно. Такие заголовки создают панику. Домен '.info' без известного СМИ должен насторожить." },
  { text: "Хакеры научились читать мысли через камеру ноутбука", source: "cyberscream.org", isFake: true, explanation: "Камера не может записывать мозговую активность. Этот тип фейков пугает пользователей, чтобы они купили 'защитное ПО'. Проверяй источник — нет ни одного серьёзного СМИ." },
  { text: "В Алматы открылся новый IT-центр для подростков: 500 мест бесплатно", source: "nur.kz", isFake: false, explanation: "Реальная новость от известного казахстанского портала nur.kz. Тема правдоподобная, источник авторитетный. Это пример настоящей информации." },
  { text: "Казахстан вошёл в топ-20 стран по скорости интернета — отчёт Speedtest", source: "speedtest.net/global-index", isFake: false, explanation: "Speedtest Global Index — реальный ежемесячный рейтинг от Ookla. Проверить данные можно на официальном сайте. Источник авторитетный и известный." },
  { text: "WhatsApp начнёт делиться данными пользователей с Meta Ads — обновление политики", source: "techcrunch.com", isFake: false, explanation: "TechCrunch — авторитетное технологическое издание. Эта тема реальная и была широко освещена в 2021–2022 годах. Важно читать подобные обновления политики." },
  { text: "Съев 2 лимона в день, можно полностью вылечить диабет — врачи шокированы", source: "health-secret.ru", isFake: true, explanation: "Диабет не лечится фруктами. 'Врачи шокированы' — маркер медицинского фейка. Домен без репутации. Такие материалы опасны — они отвлекают от реального лечения." },
  { text: "Казахстан запускает цифровой тенге: пилот начинается в 2024 году", source: "nationalbank.kz", isFake: false, explanation: "Реальная инициатива Национального банка РК. Источник — официальный сайт регулятора. Цифровые валюты центральных банков (CBDC) активно тестируются по всему миру." },
  { text: "5G-вышки вызывают рак: исследование немецких учёных подтверждает опасность", source: "stopwave.net", isFake: true, explanation: "ВОЗ, ICNIRP и десятки независимых исследований не нашли связи между 5G и онкологией. 'Немецкие учёные' без конкретных имён и публикаций — красный флаг. Домен без репутации." },
];

const ALL_NEWS_EN = [
  { text: "NASA confirms extraterrestrial life found on Mars — world governments in emergency session", source: "breakingnews-daily.net", isFake: true, explanation: "NASA announcements always come from nasa.gov with named scientists and peer-reviewed papers. 'Emergency sessions' are not how governments respond to scientific findings. The domain has no recognized media affiliation." },
  { text: "Scientists prove: just 5 hours of sleep is enough for a healthy adult", source: "healthsecrets24.net", isFake: true, explanation: "The WHO and sleep medicine experts recommend 7–9 hours for adults. Headlines that contradict consensus are clickbait. Always ask: is there a link to the original peer-reviewed study?" },
  { text: "New virus spreads through Wi-Fi signals — scientists raise alarm", source: "viruswatch.info", isFake: true, explanation: "Biological viruses cannot travel via radio waves — it is physically impossible. Such headlines are designed to create panic. An unfamiliar '.info' domain with no recognized publisher is a red flag." },
  { text: "Hackers can now read your thoughts through your laptop camera", source: "cyberthreat-alert.org", isFake: true, explanation: "Cameras cannot record brain activity. This type of fake scares users into buying 'protective software.' No credible outlet reported this — always cross-check with a known publication." },
  { text: "Google removes 2.5 billion bad ads in 2023, annual report shows", source: "blog.google", isFake: false, explanation: "This is from Google's own blog, a primary source. The figure is consistent with Google's annual Ads Safety Report, which is published regularly and widely covered by tech media." },
  { text: "Eating 2 lemons a day completely cures diabetes — doctors shocked", source: "health-miracle.ru", isFake: true, explanation: "Diabetes is not cured by fruit. 'Doctors shocked' is a classic medical misinformation phrase. The domain has no medical credibility. Such content diverts patients from real treatment." },
  { text: "WhatsApp will share user data with Meta Ads — policy update", source: "techcrunch.com", isFake: false, explanation: "TechCrunch is a reputable technology outlet. This topic is real and was widely covered in 2021–2022. Always read platform policy updates — they affect your privacy." },
  { text: "5G towers cause cancer — German scientist study confirms danger", source: "stop5g-truth.net", isFake: true, explanation: "The WHO, ICNIRP, and dozens of independent studies found no link between 5G and cancer. 'German scientists' with no names or publication details is a red flag. The domain has no credibility." },
  { text: "Tesla recalls 120,000 vehicles over seat belt issue, NHTSA confirms", source: "reuters.com", isFake: false, explanation: "Reuters is a global news agency. Vehicle recalls are public records filed with the NHTSA and can be verified at nhtsa.gov. This is a verifiable fact from a credible primary and secondary source." },
  { text: "Elon Musk giving away $10,000 to every Twitter follower who retweets this", source: "elonrewards-official.com", isFake: true, explanation: "'Free money' giveaways from celebrity accounts are among the most common social media scams. The domain is not twitter.com or any verified outlet. No legitimate platform announces giveaways this way." },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const TOTAL_ROUNDS = 7;

export default function FakeNews() {
  const { lang } = useLanguage();
  const ALL_NEWS = lang === "en" ? ALL_NEWS_EN : ALL_NEWS_RU;

  const [queue, setQueue] = useState(() => shuffle(ALL_NEWS).slice(0, TOTAL_ROUNDS));
  const [index, setIndex]       = useState(0);
  const [answered, setAnswered] = useState(null);
  const [score, setScore]       = useState(0);
  const [finished, setFinished] = useState(false);

  const current = queue[index];

  const handleAnswer = useCallback((userSaysFake) => {
    if (answered !== null) return;
    const correct = userSaysFake === current.isFake;
    setAnswered({ correct, userSaysFake });
    if (correct) setScore((s) => s + 1);
  }, [answered, current]);

  const handleNext = () => {
    if (index + 1 >= TOTAL_ROUNDS) setFinished(true);
    else { setIndex((i) => i + 1); setAnswered(null); }
  };

  const handleRestart = () => {
    setQueue(shuffle(ALL_NEWS).slice(0, TOTAL_ROUNDS));
    setIndex(0);
    setAnswered(null);
    setScore(0);
    setFinished(false);
  };

  const pct = Math.round((score / TOTAL_ROUNDS) * 100);

  if (finished) {
    const resultColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
    const resultMsg = lang === "en"
      ? pct >= 70 ? "Excellent critical thinking!" : pct >= 40 ? "Not bad, but watch your sources more carefully." : "Study source verification before next time."
      : pct >= 70 ? "Отличное критическое мышление!" : pct >= 40 ? "Неплохо, но стоит быть внимательнее к источникам." : "Поучись различать источники перед следующим разом.";
    return (
      <div className="trainer-page">
        <div className="trainer-header">
          <p className="trainer-eyebrow">{lang === "en" ? "Result" : "Результат"}</p>
          <h1 className="trainer-title">Fake News</h1>
        </div>
        <motion.div className="trainer-card" style={{ textAlign: "center" }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: resultColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {score}/{TOTAL_ROUNDS}
          </div>
          <p style={{ color: "#6b7280", marginTop: 8, fontSize: 15 }}>{resultMsg}</p>
          <div style={{ height: 10, background: "#f3f4f6", borderRadius: 100, margin: "24px 0", overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
              style={{ height: "100%", background: resultColor, borderRadius: 100 }} />
          </div>
          <button className="t-btn t-btn-primary t-btn-lg" onClick={handleRestart}>
            {lang === "en" ? "Play again" : "Пройти ещё раз"}
          </button>
        </motion.div>
        <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
      </div>
    );
  }

  return (
    <div className="trainer-page">
      <div className="trainer-header">
        <p className="trainer-eyebrow">{lang === "en" ? "Trainer" : "Тренажёр"} · {index + 1} / {TOTAL_ROUNDS}</p>
        <h1 className="trainer-title">Fake News</h1>
        <p className="trainer-subtitle">
          {lang === "en" ? "Fake or real? Check the headline and source." : "Фейк или реальная новость? Проверяй заголовок и источник."}
        </p>
      </div>

      <div style={{ height: 4, background: "#f3f4f6", borderRadius: 100, marginBottom: 28, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${(index / TOTAL_ROUNDS) * 100}%` }}
          transition={{ duration: 0.4 }}
          style={{ height: "100%", background: "#6366f1", borderRadius: 100 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="trainer-card"
        >
          <div style={{ background: "#f9fafb", borderRadius: 14, padding: "20px 22px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 10px", fontWeight: 600 }}>
              🌐 {current.source}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#0f0f14", margin: 0, lineHeight: 1.45, letterSpacing: "-0.01em" }}>
              {current.text}
            </p>
          </div>

          {answered === null && (
            <div style={{ display: "flex", gap: 12 }}>
              <button className="t-btn t-btn-danger t-btn-lg" style={{ flex: 1 }} onClick={() => handleAnswer(true)}>
                ❌ {lang === "en" ? "Fake" : "Фейк"}
              </button>
              <button className="t-btn t-btn-success t-btn-lg" style={{ flex: 1 }} onClick={() => handleAnswer(false)}>
                ✅ {lang === "en" ? "Real" : "Реально"}
              </button>
            </div>
          )}

          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 20, padding: "16px 20px", borderRadius: 14,
                  background: answered.correct ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${answered.correct ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: answered.correct ? "#166534" : "#991b1b" }}>
                  {answered.correct
                    ? (lang === "en" ? "✅ Correct!" : "✅ Верно!")
                    : (lang === "en"
                        ? `❌ Wrong — this is ${current.isFake ? "fake" : "real news"}`
                        : `❌ Неверно — это ${current.isFake ? "фейк" : "реальная новость"}`)}
                </p>
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                  {current.explanation}
                </p>
                <button className="t-btn t-btn-primary" onClick={handleNext}>
                  {index + 1 < TOTAL_ROUNDS
                    ? (lang === "en" ? "Next →" : "Следующая →")
                    : (lang === "en" ? "Results" : "Результаты")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div style={{ textAlign: "center", marginTop: 16, color: "#9ca3af", fontSize: 14 }}>
        {lang === "en" ? "Score:" : "Счёт:"} <strong style={{ color: "#0f0f14" }}>{score}</strong> {lang === "en" ? `of ${index}` : `из ${index}`} {index > 0 ? (lang === "en" ? "correct" : "правильно") : ""}
      </div>

      <Link to="/fun" className="trainer-back">← {lang === "en" ? "All Trainers" : "Все тренажёры"}</Link>
    </div>
  );
}
