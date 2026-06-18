import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
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

// ── Algorithm ──────────────────────────────────────────────────────────────
function computeWA(s) {
  const W = { Easy:1, Medium:2, Hard:3 };
  const num = s.reduce((a,q) => a+(q.correct?W[q.difficulty]:0), 0);
  const den = s.reduce((a,q) => a+W[q.difficulty], 0);
  return den ? +(num/den).toFixed(3) : 0;
}
function computeGS(s) {
  const hard = s.filter(q => q.difficulty==="Hard");
  if (!hard.length) return 0;
  return +(hard.filter(q => q.correct && q.response_time_seconds<30 && !q.hint_used).length / hard.length).toFixed(3);
}
function computeHP(s) {
  const hints   = s.filter(q=>q.hint_used).length;
  const correct = s.filter(q=>q.correct).length;
  return +Math.min(hints/(correct+0.01), 1.0).toFixed(3);
}
function computeFI(s) {
  const w = s.slice(-5);
  if (w.length<2) return 0;
  let count=0;
  for (let i=1;i<w.length;i++) {
    if (w[i].response_time_seconds>w[i-1].response_time_seconds && !w[i].correct && w[i-1].correct) count++;
  }
  return +(count/(w.length-1)).toFixed(3);
}
function computeSS(s) {
  const w = s.slice(-5);
  if (w.length<2) return 0;
  const vals = w.map(q=>q.correct?1:0);
  const mean = vals.reduce((a,v)=>a+v,0)/vals.length;
  const variance = vals.reduce((a,v)=>a+(v-mean)**2,0)/vals.length;
  return +Math.max(0,1-variance).toFixed(3);
}
function fuzzyRule(wa,gs,hp,fi,ss) {
  const WA_H=wa>=0.7, WA_M=wa>=0.4&&wa<0.7, WA_L=wa<0.4;
  const GS_H=gs>=0.3, HP_H=hp>=0.4, FI_H=fi>=0.4, SS_H=ss>=0.6;
  if (WA_H&&!GS_H&&!HP_H&&!FI_H&&!SS_H) return "Advanced";
  if (WA_H&&GS_H&&!HP_H&&!FI_H)         return "Intermediate";
  if (WA_H&&!GS_H&&HP_H&&!FI_H)         return "Intermediate";
  if (WA_H&&!GS_H&&!HP_H&&FI_H)         return "Intermediate";
  if (WA_H&&!GS_H&&!HP_H&&!FI_H&&SS_H)  return "Intermediate";
  if (WA_M&&!GS_H&&!HP_H&&!FI_H)        return "Intermediate";
  if (WA_M&&GS_H)                        return "Beginner";
  if (WA_M&&HP_H)                        return "Beginner";
  if (WA_M&&FI_H)                        return "Intermediate";
  if (WA_L)                              return "Beginner";
  if (WA_H&&GS_H&&HP_H)                 return "Intermediate";
  return "Intermediate";
}
function getRec(level,profile) {
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
function assess(session) {
  const wa=computeWA(session), gs=computeGS(session), hp=computeHP(session),
        fi=computeFI(session), ss=computeSS(session);
  const c = +Math.max(0.1,Math.min(1.0,1-0.6*gs-0.4*fi)).toFixed(2);
  let consec=0, maxConsec=0;
  for (const q of session) { consec=q.correct?0:consec+1; if(consec>maxConsec) maxConsec=consec; }
  const rawResult = fuzzyRule(wa,gs,hp,fi,ss);
  const rawScore  = {Advanced:85,Intermediate:55,Beginner:20}[rawResult];
  const adjScore  = +(rawScore*c).toFixed(1);
  const level = maxConsec>=3?"Beginner":adjScore>=65?"Advanced":adjScore>=35?"Intermediate":"Beginner";
  const profile = gs>=0.5?"Guessing":fi>=0.5?"Fatigued":hp>=0.6?"Hint-Dependent":(ss>=0.8&&wa<0.7)?"Stagnating":"Consistent";
  return { signals:{wa,gs,hp,fi,ss}, confidence:c, raw_score:rawScore, adjusted_score:adjScore,
           skill_level:level, behavior_profile:profile, recommendation:getRec(level,profile) };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SkillAssessment() {
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
    setTimeout(()=>{
      const next = [...sessRef.current, entry];
      sessRef.current = next;
      if (qIdx+1>=QUESTIONS.length) { setResult(assess(next)); setPhase("result"); }
      else { setQIdx(i=>i+1); setAnswered(null); setHintOn(false); setHintUsed(false); setElapsed(0); }
    }, 900);
  };

  const handleHint = () => { if(!hintOn){ setHintOn(true); setHintUsed(true); } };

  // ── Idle ──
  if (phase==="idle") return (
    <section className="sa-section">
      <div className="sa-idle-inner">
        <p className="sa-eyebrow">AI-оценка навыков</p>
        <h2 className="sa-title">Оцени свой уровень</h2>
        <p className="sa-desc">10 вопросов по кибербезопасности — адаптивная модель анализирует точность, скорость и поведение, и выдаёт персональный результат с рекомендацией.</p>
        <div className="sa-pills">
          <span>🧠 10 вопросов</span>
          <span>⏱ ~3 минуты</span>
          <span>📊 Адаптивная оценка</span>
          <span>🎯 Easy → Hard</span>
        </div>
        <button className="sa-start-btn" onClick={handleStart}>Начать оценку →</button>
      </div>
    </section>
  );

  // ── Result ──
  if (phase==="result"&&result) {
    const lm = LEVEL[result.skill_level];
    return (
      <section className="sa-section">
        <div className="sa-result-outer">
          <p className="sa-eyebrow">Результат оценки</p>
          <h2 className="sa-title">Твой уровень кибербезопасности</h2>
          <motion.div className="sa-result-card" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>

            <div className="sa-level-row">
              <div className="sa-level-badge" style={{background:lm.bg,color:lm.color}}>
                <span className="sa-level-emoji">{lm.emoji}</span>
                <div>
                  <div className="sa-level-sub">Уровень</div>
                  <div className="sa-level-name">{lm.label}</div>
                </div>
              </div>
              <div className="sa-score-block">
                <div className="sa-score-num" style={{color:lm.color}}>{result.adjusted_score}</div>
                <div className="sa-score-den">/ 85</div>
                <div className="sa-score-lbl">Итоговый балл</div>
              </div>
            </div>

            <div className="sa-profile-row">
              <span className="sa-profile-lbl">Профиль:</span>
              <span className="sa-profile-chip">{PROFILE_RU[result.behavior_profile]}</span>
              <span className="sa-conf-lbl">Уверенность: <strong>{Math.round(result.confidence*100)}%</strong></span>
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
                    <span className="sa-sig-lbl">{label}</span>
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
              <Link to="/lessons" className="t-btn t-btn-primary t-btn-lg">Начать обучение →</Link>
              <button className="t-btn t-btn-outline" onClick={handleStart}>Пройти снова</button>
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
        <p className="sa-eyebrow">Вопрос {qIdx+1} / {QUESTIONS.length}</p>
        <div className="sa-prog-bg">
          <motion.div className="sa-prog-fill" animate={{width:`${(qIdx/QUESTIONS.length)*100}%`}} transition={{duration:0.4}}/>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={qIdx} className="sa-q-card"
            initial={{opacity:0,x:32}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-32}}
            transition={{duration:0.28,ease:[0.22,1,0.36,1]}}>

            <div className="sa-q-meta">
              <span className="sa-diff" style={{background:d.bg,color:d.color}}>{d.label}</span>
              <span className="sa-elapsed">⏱ {elapsed}с</span>
            </div>

            <h3 className="sa-q-text">{q.text}</h3>

            {!answered && (
              <div className="sa-hint-wrap">
                {!hintOn
                  ? <button className="sa-hint-btn" onClick={handleHint}>💡 Подсказка</button>
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
                {answered.correct ? "✓ Верно!" : `✗ Неверно — правильный: ${q.options[q.correct]}`}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
