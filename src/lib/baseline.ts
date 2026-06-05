import type { Language } from "./i18n";
import type { CognitiveMetrics } from "./mockData";
import { sanitizeText } from "./security";

export type BaselineSelfReport = {
  focusSelfReport: number;
  energySelfReport: number;
  taskDifficulty: number;
  distractionLevel: number;
};

export type BaselineInput = BaselineSelfReport & {
  // A window of metric readings captured during the baseline countdown.
  // A single-element window is allowed; spread is then reported as null.
  samples: CognitiveMetrics[];
  language?: Language;
};

export type GeneratedBaselineProfile = BaselineSelfReport & {
  focusBaseline: number;
  stabilityBaseline: number;
  cognitiveLoadBaseline: number;
  stressBaseline: number;
  fatigueBaseline: number;
  collapseRiskBaseline: number;
  // Spread = standard deviation of each metric across the capture window.
  // null when the window was too short to form a distribution.
  focusSpread: number | null;
  stabilitySpread: number | null;
  cognitiveLoadSpread: number | null;
  stressSpread: number | null;
  fatigueSpread: number | null;
  collapseRiskSpread: number | null;
  sampleCount: number;
  mouseStability?: number | null;
  eyeQuality?: number | null;
  voiceStability?: number | null;
  signalQuality: number;
  qualityScore: number;
  statusLabel: string;
  summary: string;
  createdAt: string;
};

// Spreads below this are treated as "no usable distribution" so we never report a
// deviation by dividing by a tiny standard deviation.
export const MIN_BASELINE_SPREAD = 1.5;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Population standard deviation, rounded to one decimal. 0 for windows shorter than 2.
function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

function getStatusLabel(qualityScore: number, language: Language) {
  if (qualityScore >= 75) {
    return language === "fa" ? "خط پایه قوی" : "Strong baseline";
  }

  if (qualityScore >= 55) {
    return language === "fa" ? "خط پایه قابل استفاده" : "Usable baseline";
  }

  return language === "fa" ? "کیفیت پایین خط پایه" : "Low quality baseline";
}

function getSummary(
  means: { focus: number; stability: number; signalQuality: number },
  sampleCount: number,
  statusLabel: string,
  language: Language,
) {
  if (language === "fa") {
    return `خط پایه شخصی با وضعیت ${statusLabel} از ${sampleCount} نمونه ذخیره شد. تمرکز مرجع ${means.focus}٪، پایداری مرجع ${means.stability}٪ و کیفیت سیگنال ${means.signalQuality}٪ ثبت شد. این فقط یک مرجع پژوهشی غیرپزشکی برای مقایسه نشست‌های بعدی است.`;
  }

  return `Personal baseline saved with ${statusLabel.toLowerCase()} status from ${sampleCount} samples. Reference focus is ${means.focus}%, reference stability is ${means.stability}%, and signal quality is ${means.signalQuality}%. This is a non-medical research reference for comparing later sessions.`;
}

export function generateBaselineProfile(input: BaselineInput): GeneratedBaselineProfile {
  const language = input.language === "fa" ? "fa" : "en";
  const samples = input.samples;
  const sampleCount = samples.length;
  const hasDistribution = sampleCount >= 2;

  const valuesOf = (key: keyof Pick<
    CognitiveMetrics,
    "focus" | "stability" | "cognitiveLoad" | "stress" | "fatigue" | "collapseRisk" | "signalQuality"
  >) => samples.map((sample) => sample[key]);

  const focusBaseline = clamp(mean(valuesOf("focus")));
  const stabilityBaseline = clamp(mean(valuesOf("stability")));
  const cognitiveLoadBaseline = clamp(mean(valuesOf("cognitiveLoad")));
  const stressBaseline = clamp(mean(valuesOf("stress")));
  const fatigueBaseline = clamp(mean(valuesOf("fatigue")));
  const collapseRiskBaseline = clamp(mean(valuesOf("collapseRisk")));
  const signalQuality = clamp(mean(valuesOf("signalQuality")));

  const selfReportAverage =
    ((input.focusSelfReport + input.energySelfReport + (6 - input.taskDifficulty) + (6 - input.distractionLevel)) / 20) * 100;
  const qualityScore = clamp(signalQuality * 0.65 + selfReportAverage * 0.35);
  const statusLabel = getStatusLabel(qualityScore, language);

  return {
    focusSelfReport: clamp(input.focusSelfReport, 1, 5),
    energySelfReport: clamp(input.energySelfReport, 1, 5),
    taskDifficulty: clamp(input.taskDifficulty, 1, 5),
    distractionLevel: clamp(input.distractionLevel, 1, 5),
    focusBaseline,
    stabilityBaseline,
    cognitiveLoadBaseline,
    stressBaseline,
    fatigueBaseline,
    collapseRiskBaseline,
    focusSpread: hasDistribution ? standardDeviation(valuesOf("focus")) : null,
    stabilitySpread: hasDistribution ? standardDeviation(valuesOf("stability")) : null,
    cognitiveLoadSpread: hasDistribution ? standardDeviation(valuesOf("cognitiveLoad")) : null,
    stressSpread: hasDistribution ? standardDeviation(valuesOf("stress")) : null,
    fatigueSpread: hasDistribution ? standardDeviation(valuesOf("fatigue")) : null,
    collapseRiskSpread: hasDistribution ? standardDeviation(valuesOf("collapseRisk")) : null,
    sampleCount,
    signalQuality,
    qualityScore,
    statusLabel,
    summary: sanitizeText(
      getSummary({ focus: focusBaseline, stability: stabilityBaseline, signalQuality }, sampleCount, statusLabel, language),
      700,
    ),
    createdAt: new Date().toISOString(),
  };
}

export type BaselineComparisonKey = "focus" | "stability" | "cognitiveLoad" | "collapseRisk";
export type BaselineComparisonDirection = "above" | "below" | "normal";

export type BaselineComparison = {
  key: BaselineComparisonKey;
  current: number;
  mean: number;
  delta: number;
  spread: number | null;
  // Standard deviations away from the user's own baseline mean. null when the
  // baseline has no usable spread (then only the raw delta is meaningful).
  z: number | null;
  direction: BaselineComparisonDirection;
};

/**
 * Compares the current reading against the user's stored baseline distribution.
 * When spread is available it expresses the gap as a z-score (e.g. "1.4σ below");
 * otherwise it falls back to the raw delta. This is the heart of "below your baseline"
 * being a true statement about this user's own measured normal.
 */
export function compareToBaseline(
  current: CognitiveMetrics,
  baseline: GeneratedBaselineProfile,
): BaselineComparison[] {
  const specs: Array<[BaselineComparisonKey, number, number | null | undefined]> = [
    ["focus", baseline.focusBaseline, baseline.focusSpread],
    ["stability", baseline.stabilityBaseline, baseline.stabilitySpread],
    ["cognitiveLoad", baseline.cognitiveLoadBaseline, baseline.cognitiveLoadSpread],
    ["collapseRisk", baseline.collapseRiskBaseline, baseline.collapseRiskSpread],
  ];

  return specs.map(([key, meanValue, spreadRaw]) => {
    const currentValue = clamp(current[key]);
    const spread = spreadRaw ?? null;
    const delta = currentValue - meanValue;
    const z = spread !== null && spread >= MIN_BASELINE_SPREAD ? delta / spread : null;

    let direction: BaselineComparisonDirection;
    if (z !== null) {
      direction = Math.abs(z) < 1 ? "normal" : z > 0 ? "above" : "below";
    } else {
      direction = Math.abs(delta) < 3 ? "normal" : delta > 0 ? "above" : "below";
    }

    return {
      key,
      current: currentValue,
      mean: meanValue,
      delta: Math.round(delta),
      spread,
      z: z !== null ? Math.round(z * 10) / 10 : null,
      direction,
    };
  });
}

export function getBaselineFreshness(createdAt: string | null | undefined, language: Language = "en") {
  if (!createdAt) {
    return language === "fa" ? "خط پایه وجود ندارد" : "Missing baseline";
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return language === "fa" ? "خط پایه نامعتبر" : "Invalid baseline";
  }

  const ageHours = (Date.now() - created.getTime()) / 3_600_000;
  if (ageHours > 24) {
    return language === "fa" ? "خط پایه قدیمی" : "Stale baseline";
  }

  return language === "fa" ? "خط پایه فعال" : "Active baseline";
}
