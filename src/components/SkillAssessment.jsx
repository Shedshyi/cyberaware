import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { assess as fuzzyAssess } from "../adaptive/fuzzy";
import { logEvent, logInteraction } from "../lib/store";
import { record } from "../game/game";
import { useLanguage } from "../i18n/LanguageContext";

const DIFF_NUM = { Easy: 1, Medium: 2, Hard: 3 };

const QUESTIONS_RU = [
  { id:1, difficulty:"Easy",   text:"Что такое фишинг?", options:["Техника ловли рыбы в интернете","Мошенничество с целью кражи данных через поддельные сайты","Тип вируса, шифрующий файлы","Метод шифрования трафика"], correct:1, hint:"Злоумышленник 'ловит' жертву как рыбак — отсюда название (англ. fish = рыба)." },
  { id:2, difficulty:"Easy",   text:"Какой пароль является наиболее надёжным?", options:["password123","Vasya1990","X!k9@mP#2vQz","qwerty"], correct:2, hint:"Надёжный пароль длинный и содержит буквы разного регистра, цифры и символы." },
  { id:3, difficulty:"Easy",   text:"Что обозначает HTTPS в адресе браузера?", options:["Сайт принадлежит крупной компании","Соединение зашифровано","Сайт быстрее загружается","Сайт проверен на вирусы"], correct:1, hint:"S означает 'Secure' — безопасное, зашифрованное соединение." },
  { id:4, difficulty:"Medium", text:"Что такое двухфакторная аутентификация (2FA)?", options:["Использование двух разных паролей","Подтверждение личности двумя независимыми способами","Шифрование в два этапа","Двойная антивирусная проверка"], correct:1, hint:"Обычно это 'что знаешь' (пароль) + 'что имеешь' (телефон или токен)." },
  { id:5, difficulty:"Medium", text:"Какой тип вредоносного ПО шифрует файлы и требует выкуп?", options:["Spyware","Adware","Ransomware","Rootkit"], correct:2, hint:"Ransom по-английски — 'выкуп'." },
  { id:6, difficulty:"Medium", text:"Что происходит при атаке Man-in-the-Middle?", options:["Злоумышленник проникает в офис жертвы","Атакующий перехватывает и изменяет связь между сторонами","Хакер взламывает сервер через уязвимость","Мошенник рассылает спам от имени жертвы"], correct:1, hint:"Представь человека, стоящего между двумя собеседниками и читающего их переписку." },
  { id:7, difficulty:"Medium", text:"Что такое социальная инженерия в кибербезопасности?", options:["Использование ИИ для взлома","Манипуляция людьми для получения конфиденциальной информации","Программирование поведения в соцсетях","Разновидность DDoS-атаки"], correct:1, hint:"Это атака на людей, а не на программы — злоумышленник использует психологию." },
  { id:8, difficulty:"Hard",   text:"Что такое уязвимость нулевого дня (Zero-Day)?", options:["Уязвимость, существующая менее суток","Уязвимость, о которой разработчик не знает и нет патча","Новый тип вируса, появившийся в начале месяца","Атака, происходящая ровно в полночь"], correct:1, hint:"У разработчика было ноль дней на исправление — он ещё не знает о проблеме." },
  { id:9, difficulty:"Hard",   text:"Что описывает принцип наименьших привилегий (Least Privilege)?", options:["Пользователь должен иметь минимум прав, необходимых для работы","Администраторы не используют пароли при локальном входе","Системы работают с отключёнными функциями по умолчанию","Доступ к данным разрешён только в рабочее время"], correct:0, hint:"Зачем давать кладовщику ключи от всего здания, если ему нужна только кладовая?" },
  { id:10, difficulty:"Hard",  text:"Что представляет собой SQL-инъекция?", options:["Внедрение вредоносного SQL-кода в запрос к БД через незащищённые поля ввода","Заражение SQL-сервера через сетевую уязвимость","DDoS-атака на базу данных","Метод шифрования данных в реляционных базах"], correct:0, hint:"Злоумышленник 'вводит' свой SQL-код туда, где ожидается обычный текст от пользователя." },
];


const QUESTIONS_EN = [
  { id:1, difficulty:"Easy",   text:"What is phishing?", options:["A technique for catching fish online","Fraud that steals data through fake websites","A type of virus that encrypts files","A traffic encryption method"], correct:1, hint:"The attacker 'fishes' for victims — hence the name." },
  { id:2, difficulty:"Easy",   text:"Which password is the strongest?", options:["password123","Vasya1990","X!k9@mP#2vQz","qwerty"], correct:2, hint:"A strong password is long and mixes upper and lower case, digits and symbols." },
  { id:3, difficulty:"Easy",   text:"What does HTTPS in the address bar mean?", options:["The site belongs to a large company","The connection is encrypted","The site loads faster","The site has been scanned for viruses"], correct:1, hint:"S stands for 'Secure' — an encrypted connection." },
  { id:4, difficulty:"Medium", text:"What is two-factor authentication (2FA)?", options:["Using two different passwords","Confirming identity in two independent ways","Two-stage encryption","A double antivirus scan"], correct:1, hint:"Usually 'something you know' (password) + 'something you have' (phone or token)." },
  { id:5, difficulty:"Medium", text:"Which type of malware encrypts files and demands payment?", options:["Spyware","Adware","Ransomware","Rootkit"], correct:2, hint:"A 'ransom' is a payment demanded to release something." },
  { id:6, difficulty:"Medium", text:"What happens in a Man-in-the-Middle attack?", options:["The attacker breaks into the victim's office","The attacker intercepts and alters communication between two parties","A hacker breaks into a server through a vulnerability","A scammer sends spam on the victim's behalf"], correct:1, hint:"Picture someone standing between two people and reading their messages." },
  { id:7, difficulty:"Medium", text:"What is social engineering in cybersecurity?", options:["Using AI for hacking","Manipulating people to obtain confidential information","Programming behaviour on social networks","A kind of DDoS attack"], correct:1, hint:"It targets people, not programs — the attacker uses psychology." },
  { id:8, difficulty:"Hard",   text:"What is a zero-day vulnerability?", options:["A vulnerability that existed for less than a day","A vulnerability unknown to the developer, with no patch","A new virus that appeared at the start of the month","An attack that happens exactly at midnight"], correct:1, hint:"The developer had zero days to fix it — they don't know about it yet." },
  { id:9, difficulty:"Hard",   text:"What does the principle of least privilege describe?", options:["A user should have only the minimum rights needed for their work","Administrators don't use passwords for local sign-in","Systems run with features disabled by default","Data access is allowed only during working hours"], correct:0, hint:"Why give the storekeeper keys to the whole building if they only need the storeroom?" },
  { id:10, difficulty:"Hard",  text:"What is SQL injection?", options:["Inserting malicious SQL code into a database query through unprotected input fields","Infecting an SQL server through a network vulnerability","A DDoS attack on a database","A method of encrypting data in relational databases"], correct:0, hint:"The attacker 'injects' their own SQL code where plain user text is expected." },
];

const UI = {
  ru: {
    diff: { Easy: "Лёгкий", Medium: "Средний", Hard: "Сложный" },
    level: { Beginner: "Начинающий", Intermediate: "Средний уровень", Advanced: "Продвинутый" },
    profile: { Consistent: "Стабильный", Guessing: "Угадывание", Fatigued: "Усталость", "Hint-Dependent": "Зависимость от подсказок", Stagnating: "Стагнация" },
    sigs: { wa: "Взвешенная точность", gs: "Угадывание", hp: "Давление подсказок", fi: "Индекс усталости", ss: "Стагнация" },
    eyebrow: "Оценка уровня по модели ID137", title: "Оцени свой уровень",
    desc: "10 вопросов по кибербезопасности — нечёткая модель анализирует точность, скорость, подсказки и поведение и выдаёт персональный результат с рекомендацией.",
    pills: ["🧠 10 вопросов", "⏱ ~3 минуты", "📊 Нечёткая модель", "🎯 Easy → Hard"],
    start: "Начать оценку →", resultEyebrow: "Результат оценки", resultTitle: "Твой уровень кибербезопасности",
    levelLbl: "Уровень", scoreLbl: "Итоговый балл", profileLbl: "Профиль:", confLbl: "Уверенность",
    learn: "Начать обучение →", again: "Пройти снова", question: "Вопрос", hint: "💡 Подсказка", sec: "с",
    correct: "✓ Верно!", wrong: "✗ Неверно — правильный:",
  },
  en: {
    diff: { Easy: "Easy", Medium: "Medium", Hard: "Hard" },
    level: { Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced" },
    profile: { Consistent: "Consistent", Guessing: "Guessing", Fatigued: "Fatigue", "Hint-Dependent": "Hint-dependent", Stagnating: "Plateau" },
    sigs: { wa: "Weighted accuracy", gs: "Guessing", hp: "Hint pressure", fi: "Fatigue index", ss: "Stagnation" },
    eyebrow: "Skill check · model ID137", title: "Check your level",
    desc: "10 cybersecurity questions — a fuzzy model analyses accuracy, speed, hints and behaviour and gives a personal result with a recommendation.",
    pills: ["🧠 10 questions", "⏱ ~3 minutes", "📊 Fuzzy model", "🎯 Easy → Hard"],
    start: "Start the check →", resultEyebrow: "Your result", resultTitle: "Your cybersecurity level",
    levelLbl: "Level", scoreLbl: "Final score", profileLbl: "Profile:", confLbl: "Confidence",
    learn: "Start learning →", again: "Try again", question: "Question", hint: "💡 Hint", sec: "s",
    correct: "✓ Correct!", wrong: "✗ Wrong — the answer is:",
  },
};

const REC_EN = {
  Beginner: { Guessing: "Slow down and read every option. Start with the basics: passwords and phishing.", Fatigued: "Take a break every 20 minutes — fatigue gets in the way of memory. Use short sessions.", "Hint-Dependent": "Try answering without hints — your own answers build long-term memory.", _: "Start with the basics: the passwords and phishing lessons lay a solid foundation." },
  Advanced: { _: "Great knowledge! Keep practising — try the social engineering and URL inspection trainers." },
  Intermediate: { Guessing: "Slow down on hard questions and weigh each option — it turns intuition into knowledge.", Fatigued: "Split learning into 20-minute sessions — your base is good, don't let fatigue hide it.", "Hint-Dependent": "Answer on your own first, then check — gradually drop the hints.", Stagnating: "Move on to harder topics — your level has flattened and needs a new challenge.", _: "Good base! Practise more: the phishing and social engineering trainers will take you to Advanced." },
};

const DIFF = {
  Easy:   { color:"#10b981", bg:"#d1fae5", label:"Лёгкий"  },
  Medium: { color:"#f59e0b", bg:"#fef3c7", label:"Средний" },
  Hard:   { color:"#ef4444", bg:"#fee2e2", label:"Сложный" },
};
const LEVEL = {
  Beginner:     { emoji:"🌱", color:"#ef4444", bg:"#fee2e2", label:"Начинающий"      },
  Intermediate: { emoji:"⚡", color:"#f59e0b", bg:"#fef3c7", label:"Средний уровень" },
  Advanced:     { emoji:"🛡️", color:"#10b981", bg:"#d1fae5", label:"Продвинутый"     },
};
const PROFILE_RU = {
  Consistent:"Стабильный", Guessing:"Угадывание",
  Fatigued:"Усталость", "Hint-Dependent":"Зависимость от подсказок", Stagnating:"Стагнация",
};
const SIGS = [
  { key:"wa", label:"Взвешенная точность", invert:false },
  { key:"gs", label:"Угадывание",          invert:true  },
  { key:"hp", label:"Давление подсказок",  invert:true  },
  { key:"fi", label:"Индекс усталости",    invert:true  },
  { key:"ss", label:"Стагнация",           invert:true  },
];

// Алгоритм — модель из статьи ID137 (src/adaptive/fuzzy.js); здесь только адаптер.
function getRec(level,profile,en) {
  if (en) { const r = REC_EN[level] || REC_EN.Intermediate; return r[profile] || r._; }
  if (level==="Beginner") {
    if (profile==="Guessing")       return "Не торопись — читай каждый вариант внимательно. Начни с уроков по основам: паролям и фишингу.";
    if (profile==="Fatigued")       return "Делай перерывы каждые 20 минут — усталость мешает запоминанию. Проходи уроки короткими сессиями.";
    if (profile==="Hint-Dependent") return "Попробуй отвечать без подсказок — самостоятельные ответы укрепляют долгосрочную память.";
    return "Начни с основ: пройди уроки по паролям и фишингу — они заложат надёжный фундамент знаний.";
  }
  if (level==="Advanced") return "Отличные знания! Закрепи практику — пройди тренажёры по социальной инженерии и URL-инспекции.";
  if (profile==="Guessing")       return "Замедлись на сложных вопросах и анализируй каждый вариант — это переведёт интуицию в знание.";
  if (profile==="Fatigued")       return "Разбей обучение на 20-минутные сессии — твоя база хорошая, не дай усталости её скрыть.";
  if (profile==="Hint-Dependent") return "Сначала отвечай самостоятельно, потом проверяй — постепенно откажись от подсказок.";
  if (profile==="Stagnating")     return "Переходи к сложным темам — уровень выровнялся, нужен новый вызов через Hard-вопросы.";
  return "Хорошая база! Углубись в практику: тренажёры по фишингу и социальной инженерии помогут перейти на Advanced.";
}
function assess(session, en) {
  const r = fuzzyAssess(session.map(q => ({
    correct: q.correct,
    timeSec: q.response_time_seconds,
    hint: q.hint_used,
    difficulty: DIFF_NUM[q.difficulty],
  })));
  return {
    signals: { wa: r.signals.WA, gs: r.signals.GS, hp: Math.min(1, r.signals.HP), fi: r.signals.FI, ss: r.signals.SS },
    confidence: r.confidence, raw_score: r.S, adjusted_score: r.S_adj,
    skill_level: r.level, behavior_profile: r.profile, rules: r.firedRules,
    recommendation: getRec(r.level, r.profile, en),
  };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SkillAssessment() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const L = UI[en ? "en" : "ru"];
  const QUESTIONS = en ? QUESTIONS_EN : QUESTIONS_RU;
  const [phase,    setPhase]    = useState("idle");
  const [qIdx,     setQIdx]     = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const [answered, setAnswered] = useState(null);
  const [hintOn,   setHintOn]   = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [result,   setResult]   = useState(null);
  const sessRef = useRef([]);
  const q = QUESTIONS[qIdx];

  useEffect(() => {
    if (phase!=="quiz"||answered!==null) return;
    const iv = setInterval(()=>setElapsed(e=>e+1),1000);
    return ()=>clearInterval(iv);
  }, [phase,qIdx,answered]);

  const handleStart = () => {
    sessRef.current=[];
    setPhase("quiz"); setQIdx(0); setElapsed(0);
    setAnswered(null); setHintOn(false); setHintUsed(false); setResult(null);
  };

  const handleSelect = (optIdx) => {
    if (answered) return;
    const correct = optIdx===q.correct;
    setAnswered({correct,selectedIdx:optIdx});
    const entry = { question_id:q.id, difficulty:q.difficulty, correct, response_time_seconds:elapsed, hint_used:hintUsed };
    logInteraction({ source: "skill_check", topic: null, itemId: q.id, correct, responseMs: elapsed * 1000, hintUsed, difficulty: DIFF_NUM[q.difficulty] });
    setTimeout(()=>{
      const next = [...sessRef.current, entry];
      sessRef.current = next;
      if (qIdx+1>=QUESTIONS.length) {
        const res = assess(next, en);
        logEvent("model_assessment", { context: "skill_check", level: res.skill_level, profile: res.behavior_profile,
          S: res.raw_score, C: res.confidence, S_adj: res.adjusted_score, rules: res.rules.map(x => x.id),
          signals: Object.fromEntries(Object.entries(res.signals).map(([k, v]) => [k, +v.toFixed(2)])) });
        record({ type: "skill_check" });
        setResult(res); setPhase("result");
      }
      else { setQIdx(i=>i+1); setAnswered(null); setHintOn(false); setHintUsed(false); setElapsed(0); }
    }, 900);
  };

  const handleHint = () => { if(!hintOn){ setHintOn(true); setHintUsed(true); } };

  // ── Idle ──
  if (phase==="idle") return (
    <section className="sa-section">
      <div className="sa-idle-inner">
        <p className="sa-eyebrow">{L.eyebrow}</p>
        <h2 className="sa-title">{L.title}</h2>
        <p className="sa-desc">{L.desc}</p>
        <div className="sa-pills">
          {L.pills.map(p => <span key={p}>{p}</span>)}
        </div>
        <button className="sa-start-btn" onClick={handleStart}>{L.start}</button>
      </div>
    </section>
  );

  // ── Result ──
  if (phase==="result"&&result) {
    const lm = LEVEL[result.skill_level];
    return (
      <section className="sa-section">
        <div className="sa-result-outer">
          <p className="sa-eyebrow">{L.resultEyebrow}</p>
          <h2 className="sa-title">{L.resultTitle}</h2>
          <motion.div className="sa-result-card" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>

            <div className="sa-level-row">
              <div className="sa-level-badge" style={{background:lm.bg,color:lm.color}}>
                <span className="sa-level-emoji">{lm.emoji}</span>
                <div>
                  <div className="sa-level-sub">{L.levelLbl}</div>
                  <div className="sa-level-name">{L.level[result.skill_level]}</div>
                </div>
              </div>
              <div className="sa-score-block">
                <div className="sa-score-num" style={{color:lm.color}}>{result.adjusted_score}</div>
                <div className="sa-score-den">/ 100</div>
                <div className="sa-score-lbl">{L.scoreLbl}</div>
              </div>
            </div>

            <div className="sa-profile-row">
              <span className="sa-profile-lbl">{L.profileLbl}</span>
              <span className="sa-profile-chip">{L.profile[result.behavior_profile]}</span>
              <span className="sa-conf-lbl">{L.confLbl}: <strong>{Math.round(result.confidence*100)}%</strong></span>
            </div>

            <div className="sa-signals">
              {SIGS.map(({key,label,invert})=>{
                const val = result.signals[key];
                const pct = Math.round(val*100);
                const color = invert
                  ? (val<0.3?"#10b981":val<0.6?"#f59e0b":"#ef4444")
                  : (val>0.7?"#10b981":val>0.4?"#f59e0b":"#ef4444");
                return (
                  <div key={key} className="sa-sig-row">
                    <span className="sa-sig-lbl">{L.sigs[key]}</span>
                    <div className="sa-sig-bar-bg">
                      <motion.div className="sa-sig-bar-fill" style={{background:color}}
                        initial={{width:0}} animate={{width:`${pct}%`}}
                        transition={{duration:0.7,delay:0.2,ease:[0.22,1,0.36,1]}} />
                    </div>
                    <span className="sa-sig-val" style={{color}}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="sa-rec-box">
              <span className="sa-rec-ico">💡</span>
              <p>{result.recommendation}</p>
            </div>

            <div className="sa-res-actions">
              <Link to="/lessons" className="t-btn t-btn-primary t-btn-lg">{L.learn}</Link>
              <button className="t-btn t-btn-outline" onClick={handleStart}>{L.again}</button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Quiz ──
  const d = DIFF[q.difficulty];
  return (
    <section className="sa-section">
      <div className="sa-quiz-outer">
        <p className="sa-eyebrow">{L.question} {qIdx+1} / {QUESTIONS.length}</p>
        <div className="sa-prog-bg">
          <motion.div className="sa-prog-fill" animate={{width:`${(qIdx/QUESTIONS.length)*100}%`}} transition={{duration:0.4}}/>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={qIdx} className="sa-q-card"
            initial={{opacity:0,x:32}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-32}}
            transition={{duration:0.28,ease:[0.22,1,0.36,1]}}>

            <div className="sa-q-meta">
              <span className="sa-diff" style={{background:d.bg,color:d.color}}>{L.diff[q.difficulty]}</span>
              <span className="sa-elapsed">⏱ {elapsed}{L.sec}</span>
            </div>

            <h3 className="sa-q-text">{q.text}</h3>

            {!answered && (
              <div className="sa-hint-wrap">
                {!hintOn
                  ? <button className="sa-hint-btn" onClick={handleHint}>{L.hint}</button>
                  : <motion.div className="sa-hint-box" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}>
                      💡 {q.hint}
                    </motion.div>
                }
              </div>
            )}

            <div className="sa-options">
              {q.options.map((opt,i)=>{
                let cls="sa-opt";
                if (answered) {
                  if (i===q.correct)                cls+=" sa-opt-ok";
                  else if (i===answered.selectedIdx) cls+=" sa-opt-no";
                  else                               cls+=" sa-opt-dim";
                }
                return (
                  <motion.button key={i} className={cls} onClick={()=>handleSelect(i)} disabled={!!answered}
                    whileHover={!answered?{scale:1.008}:{}} whileTap={!answered?{scale:0.995}:{}}>
                    <span className="sa-opt-letter">{String.fromCharCode(65+i)}</span>
                    <span>{opt}</span>
                  </motion.button>
                );
              })}
            </div>

            {answered && (
              <motion.p className={`sa-fb ${answered.correct?"sa-fb-ok":"sa-fb-no"}`}
                initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
                {answered.correct ? L.correct : `${L.wrong} ${q.options[q.correct]}`}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
