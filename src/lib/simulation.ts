import type { CognitiveMetrics } from "./mockData";

export const metricRanges = {
  focus: [55, 95],
  cognitiveLoad: [35, 90],
  fatigue: [20, 75],
  stress: [15, 70],
  stability: [45, 95],
  collapseRisk: [5, 45],
  signalQuality: [74, 99],
} as const;

export type MetricKey = keyof typeof metricRanges;

export function clampMetric(key: MetricKey, value: number) {
  const [min, max] = metricRanges[key];
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function smoothStep(current: number, target: number, factor = 0.28) {
  return Math.round(current + (target - current) * factor);
}

export function smoothMetrics(current: CognitiveMetrics, target: CognitiveMetrics, factor = 0.28): CognitiveMetrics {
  return {
    focus: clampMetric("focus", smoothStep(current.focus, target.focus, factor)),
    cognitiveLoad: clampMetric("cognitiveLoad", smoothStep(current.cognitiveLoad, target.cognitiveLoad, factor)),
    fatigue: clampMetric("fatigue", smoothStep(current.fatigue, target.fatigue, factor)),
    stress: clampMetric("stress", smoothStep(current.stress, target.stress, factor)),
    stability: clampMetric("stability", smoothStep(current.stability, target.stability, factor)),
    collapseRisk: clampMetric("collapseRisk", smoothStep(current.collapseRisk, target.collapseRisk, factor)),
    signalQuality: clampMetric("signalQuality", smoothStep(current.signalQuality, target.signalQuality, factor)),
    timestamp: target.timestamp,
  };
}

// NOTE: This is a deterministic, date-seeded display token for the demo UI only.
// It is NOT cryptographically secure and must never be used for auth or sessions.
// Real auth tokens are generated with crypto.randomBytes in lib/auth.ts.
export function generateDemoToken(seed = "NS") {
  const suffix = Math.abs(
    Array.from(`${seed}-${new Date().toISOString().slice(0, 10)}`).reduce(
      (total, character) => total + character.charCodeAt(0) * 17,
      0,
    ),
  )
    .toString(16)
    .toUpperCase()
    .slice(0, 6);

  return `NS-${suffix}`;
}

export function getThemeIntensityLabel(intensity: number) {
  if (intensity >= 90) return "Holographic";
  if (intensity >= 70) return "High";
  if (intensity >= 45) return "Balanced";
  return "Calm";
}
