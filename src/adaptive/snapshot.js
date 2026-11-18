// Снимок состояния модели в журнал событий — чтобы потом анализировать,
// что модель «думала» об участнике в каждый момент и какие решения из этого следовали.
import { buildLearnerModel } from "./learner";
import { getInteractions, getLessonRead, getPreTopics, getTestResults, logEvent } from "../lib/store";

const r2 = (x) => (Number.isFinite(x) ? +x.toFixed(2) : x);

export function logModelSnapshot(context) {
  const model = buildLearnerModel({
    interactions: getInteractions(), testResults: getTestResults(),
    lessonRead: getLessonRead(), preTopics: getPreTopics(),
  });
  const g = model.global;
  const topics = {};
  for (const [t, v] of Object.entries(model.topics)) {
    if (v.assessment) topics[t] = { level: v.level, profile: v.profile, S_adj: v.assessment.S_adj, n: v.n };
  }
  logEvent("model_assessment", {
    context,
    n: model.total,
    global: g ? {
      level: g.level, profile: g.profile, S: g.S, C: g.confidence, S_adj: g.S_adj, override: g.override,
      signals: Object.fromEntries(Object.entries(g.signals).map(([k, v]) => [k, r2(v)])),
      rules: g.firedRules.map(r => r.id),
    } : null,
    topics,
  });
  return model;
}
