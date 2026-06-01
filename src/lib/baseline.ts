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
  metrics: CognitiveMetrics;
  language?: Language;
};

export type GeneratedBaselineProfile = BaselineSelfReport & {
  focusBaseline: number;
  stabilityBaseline: number;
  cognitiveLoadBaseline: number;
  stressBaseline: number;
  fatigueBaseline: number;
  collapseRiskBaseline: number;
  mouseStability?: number | null;
  eyeQuality?: number | null;
  voiceStability?: number | null;
  signalQuality: number;
  qualityScore: number;
  statusLabel: string;
  summary: string;
  createdAt: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
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

function getSummary(input: BaselineInput, qualityScore: number, statusLabel: string, language: Language) {
  const { metrics } = input;
  const isFa = language === "fa";

  if (isFa) {
    return `خط پایه شخصی با وضعیت ${statusLabel} ذخیره شد. تمرکز مرجع ${metrics.focus}٪، پایداری مرجع ${metrics.stability}٪ و کیفیت سیگنال ${metrics.signalQuality}٪ ثبت شد. این فقط یک مرجع پژوهشی غیرپزشکی برای مقایسه نشست‌های بعدی است.`;
  }

  return `Personal baseline saved with ${statusLabel.toLowerCase()} status. Reference focus is ${metrics.focus}%, reference stability is ${metrics.stability}%, and signal quality is ${metrics.signalQuality}%. This is a non-medical research reference for comparing later sessions.`;
}

export function generateBaselineProfile(input: BaselineInput): GeneratedBaselineProfile {
  const language = input.language === "fa" ? "fa" : "en";
  const selfReportAverage =
    ((input.focusSelfReport + input.energySelfReport + (6 - input.taskDifficulty) + (6 - input.distractionLevel)) / 20) * 100;
  const qualityScore = clamp(input.metrics.signalQuality * 0.65 + selfReportAverage * 0.35);
  const statusLabel = getStatusLabel(qualityScore, language);

  return {
    focusSelfReport: clamp(input.focusSelfReport, 1, 5),
    energySelfReport: clamp(input.energySelfReport, 1, 5),
    taskDifficulty: clamp(input.taskDifficulty, 1, 5),
    distractionLevel: clamp(input.distractionLevel, 1, 5),
    focusBaseline: clamp(input.metrics.focus),
    stabilityBaseline: clamp(input.metrics.stability),
    cognitiveLoadBaseline: clamp(input.metrics.cognitiveLoad),
    stressBaseline: clamp(input.metrics.stress),
    fatigueBaseline: clamp(input.metrics.fatigue),
    collapseRiskBaseline: clamp(input.metrics.collapseRisk),
    signalQuality: clamp(input.metrics.signalQuality),
    qualityScore,
    statusLabel,
    summary: sanitizeText(getSummary(input, qualityScore, statusLabel, language), 700),
    createdAt: new Date().toISOString(),
  };
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
