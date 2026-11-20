#!/usr/bin/env node
// Синтетические выгрузки в формате страницы исследователя — чтобы проверить анализ до сбора данных.
// Запуск:  npm run analyze:demo -- <папка> [эффект в п.п., по умолчанию 12]
// ВНИМАНИЕ: данные выдуманы, в диссертацию их не включать.
import fs from "node:fs";
import path from "node:path";
import { ASSESSMENT } from "../src/research/assessmentData.js";
import { rng } from "./stats.js";

export function makeDemo({ nPerGroup = 10, effect = 12, dropouts = 1, seed = 7 } = {}) {
  const rand = rng(seed);
  const normal = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
  const qs = ASSESSMENT.ru;
  const participants = [], answers = [];
  const total = 2 * (nPerGroup + dropouts);
  for (let i = 0; i < total; i++) {
    const cohort = i % 2 ? "control" : "experimental";
    const code = `P${String(i + 1).padStart(3, "0")}`;
    const ability = 50 + 15 * normal();
    const gain = 10 + (cohort === "experimental" ? effect : 0) + 8 * normal();
    const dropped = i >= 2 * nPerGroup;
    const take = (phase, level) => {
      let score = 0;
      for (const q of qs) {
        const p = Math.min(0.97, Math.max(0.03, level / 100 + 0.15 * (rand() - 0.5)));
        const correct = rand() < p ? 1 : 0;
        score += correct;
        answers.push({ participant: code, cohort, phase, question_id: q.id, topic: q.topic, selected: 0, correct, response_ms: Math.round(4000 + 9000 * rand()) });
      }
      return score;
    };
    const pre = take("pre", ability);
    const post = dropped ? null : take("post", ability + gain);
    const exp = cohort === "experimental";
    participants.push({
      code, cohort, age: 18 + Math.floor(rand() * 8), occupation: "student", study_group: "",
      prior_training: rand() < 0.3, self_rating: 1 + Math.floor(rand() * 5),
      pre_score: pre, pre_pct: (pre / qs.length) * 100, post_score: post, post_pct: post == null ? null : (post / qs.length) * 100,
      gain_pct: post == null ? null : ((post - pre) / qs.length) * 100,
      practice_tests_done: 5 + Math.floor(rand() * 5), lessons_opened: 5 + Math.floor(rand() * 5),
      games_played: exp ? Math.floor(rand() * 6) : 0, days_pre_to_post: 7 + Math.floor(rand() * 10),
      active_days: 3 + Math.floor(rand() * 8), interactions_n: 40 + Math.floor(rand() * 80),
      interactions_correct_pct: 60 + Math.floor(rand() * 30),
      recs_shown: exp ? 5 + Math.floor(rand() * 20) : 0, recs_clicked: exp ? Math.floor(rand() * 8) : 0,
      xp_total: exp ? 200 + Math.floor(rand() * 600) : 0, badges: exp ? Math.floor(rand() * 6) : 0,
    });
  }
  return { participants, answers };
}

export function toCSV(rows) {
  const cols = Object.keys(rows[0]);
  const esc = (v) => (v == null ? "" : /[;"\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c])).join(";"))].join("\r\n");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const dir = process.argv[2] || "analysis/demo";
  const effect = Number(process.argv[3] ?? 12);
  fs.mkdirSync(dir, { recursive: true });
  const { participants, answers } = makeDemo({ effect });
  fs.writeFileSync(path.join(dir, "participants_demo.csv"), toCSV(participants));
  fs.writeFileSync(path.join(dir, "answers_pre_post_demo.csv"), toCSV(answers));
  console.log(`Синтетические данные (эффект ${effect} п.п.) записаны в ${dir}`);
}
