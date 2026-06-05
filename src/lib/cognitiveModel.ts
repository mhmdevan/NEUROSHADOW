import type { CognitiveMetrics } from "./mockData";

/**
 * cognitiveModel — turns the real, already-stored sensor aggregates (mouse / eye / voice)
 * into the dashboard's cognitive metrics.
 *
 * This is intentionally a transparent, rule-based blend, NOT machine learning. Every output
 * cites the inputs that produced it (see the comment above each metric). The weights are
 * plausible behavioral proxies, not validated cognitive measurements — the dashboard's
 * non-medical disclaimer still applies.
 *
 * Key honesty rules:
 *  - A sensor only contributes in proportion to its own reported confidence (0 confidence => ignored).
 *  - Metrics are clamped to a full, honest 0..100 range (no artificial simulation floor).
 *  - When no sensor informs a metric, we fall back to the previous value, then a neutral default.
 *  - collapseRisk is dampened when overall signal quality is too low to raise a real alarm.
 */

// Minimal input shapes. These are structural subsets of the Prisma sensor snapshot rows,
// so a full MouseSignalSnapshot / EyeSignalSnapshot / VoiceSignalSnapshot satisfies them.
export type MouseSignalInput = {
  stabilityScore: number;
  jitterScore: number;
  idleMs: number;
  directionChanges: number;
  actionsPerMinute: number;
  confidence: number;
};

export type EyeSignalInput = {
  focusConsistency: number;
  gazeStability: number;
  blinkProxy: number;
  motionVariance: number;
  trackingQuality: number;
  confidence: number;
};

export type VoiceSignalInput = {
  voiceStability: number;
  toneVariability: number;
  noiseLevel: number;
  speechActivity: number;
  clarityScore: number;
  confidence: number;
};

export type SensorInputs = {
  mouse?: MouseSignalInput | null;
  eye?: EyeSignalInput | null;
  voice?: VoiceSignalInput | null;
};

// Signal-quality thresholds (0..100). Below LOW the inputs are too weak to present as
// confident numbers, so the UI greys the metrics out and the model stops raising risk.
export const LOW_SIGNAL_QUALITY = 35;
export const FAIR_SIGNAL_QUALITY = 65;

export type SignalQualityLevel = "low" | "fair" | "good";

export function classifySignalQuality(signalQuality: number): SignalQualityLevel {
  if (signalQuality < LOW_SIGNAL_QUALITY) return "low";
  if (signalQuality < FAIR_SIGNAL_QUALITY) return "fair";
  return "good";
}

const NEUTRAL: Record<keyof Omit<CognitiveMetrics, "timestamp" | "source">, number> = {
  focus: 70,
  cognitiveLoad: 55,
  fatigue: 40,
  stress: 35,
  stability: 80,
  collapseRisk: 16,
  signalQuality: 0,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const score = (value: number) => clamp(value, 0, 100);

type Contribution = { value: number; weight: number };

// Weighted average of the contributions that actually carry weight; falls back when none do.
function combine(contributions: Array<Contribution | null>, fallback: number): number {
  const active = contributions.filter((c): c is Contribution => c !== null && c.weight > 0);
  const totalWeight = active.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) {
    return fallback;
  }
  const weighted = active.reduce((sum, c) => sum + score(c.value) * c.weight, 0);
  return weighted / totalWeight;
}

// A sensor's influence scales with its own confidence (0..1).
const confidenceWeight = (sensor: { confidence: number } | null) =>
  sensor ? clamp(sensor.confidence, 0, 100) / 100 : 0;

/**
 * Returns true if at least one sensor carries usable signal. The caller uses this to decide
 * between sensor-derived metrics and the explicit simulated fallback, so we never label
 * fallback numbers as "live".
 */
export function hasUsableSignal(inputs: SensorInputs): boolean {
  return [inputs.mouse, inputs.eye, inputs.voice].some(
    (sensor) => sensor != null && sensor.confidence > 0,
  );
}

export function deriveMetrics(
  inputs: SensorInputs,
  previous?: CognitiveMetrics | null,
): CognitiveMetrics {
  const mouse = inputs.mouse ?? null;
  const eye = inputs.eye ?? null;
  const voice = inputs.voice ?? null;

  const mouseW = confidenceWeight(mouse);
  const eyeW = confidenceWeight(eye);
  const voiceW = confidenceWeight(voice);

  const prev = previous ?? null;

  // FOCUS <- steady, low-jitter pointer control (mouse) + consistent gaze (eye).
  const focus = combine(
    [
      mouse ? { value: 0.6 * mouse.stabilityScore + 0.4 * (100 - mouse.jitterScore), weight: mouseW } : null,
      eye ? { value: eye.focusConsistency, weight: eyeW * 0.9 } : null,
    ],
    prev?.focus ?? NEUTRAL.focus,
  );

  // COGNITIVE LOAD <- frequent direction changes / jittery pointer (mouse) + unstable gaze (eye).
  const cognitiveLoad = combine(
    [
      mouse ? { value: score(mouse.directionChanges * 5 + mouse.jitterScore * 0.4), weight: mouseW } : null,
      eye ? { value: eye.motionVariance, weight: eyeW * 0.7 } : null,
    ],
    prev?.cognitiveLoad ?? NEUTRAL.cognitiveLoad,
  );

  // FATIGUE <- more blinking + less steady gaze (eye), longer idle gaps (mouse), falling speech (voice).
  const fatigue = combine(
    [
      eye ? { value: 0.8 * eye.blinkProxy + 0.2 * (100 - eye.gazeStability), weight: eyeW } : null,
      mouse ? { value: score(mouse.idleMs / 120), weight: mouseW * 0.6 } : null,
      voice ? { value: 100 - voice.speechActivity, weight: voiceW * 0.3 } : null,
    ],
    prev?.fatigue ?? NEUTRAL.fatigue,
  );

  // STRESS <- tone variability + background noise (voice) and pointer jitter (mouse).
  const stress = combine(
    [
      voice ? { value: 0.6 * voice.toneVariability + 0.4 * voice.noiseLevel, weight: voiceW } : null,
      mouse ? { value: mouse.jitterScore, weight: mouseW * 0.6 } : null,
    ],
    prev?.stress ?? NEUTRAL.stress,
  );

  // STABILITY <- each sensor's own stability signal, blended.
  const stability = combine(
    [
      mouse ? { value: mouse.stabilityScore, weight: mouseW } : null,
      eye ? { value: eye.gazeStability, weight: eyeW } : null,
      voice ? { value: voice.voiceStability, weight: voiceW * 0.6 } : null,
    ],
    prev?.stability ?? NEUTRAL.stability,
  );

  // SIGNAL QUALITY <- how much we should trust the above, from each present sensor's own quality.
  const signalQuality = combine(
    [
      mouse ? { value: mouse.confidence, weight: 1 } : null,
      eye ? { value: 0.5 * eye.confidence + 0.5 * eye.trackingQuality, weight: 1 } : null,
      voice ? { value: 0.5 * voice.confidence + 0.5 * voice.clarityScore, weight: 1 } : null,
    ],
    prev?.signalQuality ?? NEUTRAL.signalQuality,
  );

  // COLLAPSE RISK <- composite pressure (load, fatigue, stress) minus protective focus/stability.
  // Only meaningful with enough signal quality; otherwise we refuse to raise alarms on noise.
  const rawRisk = score(
    0.22 * cognitiveLoad +
      0.24 * fatigue +
      0.2 * stress +
      0.12 * (100 - focus) +
      0.1 * (100 - stability) -
      18,
  );
  const collapseRisk = signalQuality < LOW_SIGNAL_QUALITY ? Math.min(rawRisk, 22) : rawRisk;

  return {
    focus: Math.round(score(focus)),
    cognitiveLoad: Math.round(score(cognitiveLoad)),
    fatigue: Math.round(score(fatigue)),
    stress: Math.round(score(stress)),
    stability: Math.round(score(stability)),
    collapseRisk: Math.round(collapseRisk),
    signalQuality: Math.round(score(signalQuality)),
    timestamp: new Date().toISOString(),
    source: "sensors",
  };
}
