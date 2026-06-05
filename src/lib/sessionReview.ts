import type { Language } from "./i18n";
import type { CognitiveMetrics } from "./mockData";
import { getProjectDisclaimer } from "./reportGenerator";
import { sanitizeText } from "./security";

export type SensorKey = "mouse" | "eye" | "voice";

export type SessionReviewInput = {
  metrics: CognitiveMetrics;
  history: CognitiveMetrics[];
  language?: Language;
  baselineComplete?: boolean;
  startedAt?: string;
  // Sensors that actually contributed during the session (derived server-side).
  activeSensors?: SensorKey[];
};

export type GeneratedSessionReview = {
  summary: string;
  strongestSignal: string;
  bestWindow: string;
  weakestWindow: string;
  actionSuggested: string;
  signalQuality: number;
  statusLabel: string;
  activeSensors: string[];
  disclaimer: string;
  createdAt: string;
};

type MetricKey = keyof Pick<
  CognitiveMetrics,
  "focus" | "cognitiveLoad" | "fatigue" | "stress" | "stability" | "collapseRisk" | "signalQuality"
>;

const metricLabels: Record<Language, Record<MetricKey, string>> = {
  en: {
    focus: "Focus Level",
    cognitiveLoad: "Cognitive Load",
    fatigue: "Mental Fatigue",
    stress: "Stress Probability",
    stability: "Cognitive Stability",
    collapseRisk: "Collapse Risk",
    signalQuality: "Signal Quality",
  },
  fa: {
    focus: "سطح تمرکز",
    cognitiveLoad: "بار شناختی",
    fatigue: "خستگی ذهنی",
    stress: "احتمال استرس",
    stability: "پایداری شناختی",
    collapseRisk: "ریسک افت عملکرد",
    signalQuality: "کیفیت سیگنال",
  },
};

const keys: MetricKey[] = ["focus", "cognitiveLoad", "fatigue", "stress", "stability", "collapseRisk", "signalQuality"];

const sensorLabels: Record<Language, Record<SensorKey, string>> = {
  en: { mouse: "Mouse", eye: "Eye", voice: "Voice" },
  fa: { mouse: "ماوس", eye: "چشم", voice: "صدا" },
};

const sensorOrder: SensorKey[] = ["mouse", "eye", "voice"];

function formatTime(timestamp: string | undefined, language: Language) {
  if (!timestamp) return language === "fa" ? "اکنون" : "now";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return language === "fa" ? "اکنون" : "now";
  return date.toLocaleTimeString(language === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" });
}

function getStatus(metrics: CognitiveMetrics, language: Language) {
  if (metrics.signalQuality < 55) {
    return language === "fa" ? "کیفیت سیگنال پایین" : "Low signal quality";
  }

  if (metrics.collapseRisk >= 32 || metrics.stability < 58) {
    return language === "fa" ? "نیازمند مکث" : "Needs break";
  }

  if (metrics.collapseRisk >= 22 || metrics.cognitiveLoad >= 70 || metrics.fatigue >= 58) {
    return language === "fa" ? "زیر نظر" : "Watch";
  }

  return language === "fa" ? "پایدار" : "Stable";
}

function getAction(metrics: CognitiveMetrics, baselineComplete: boolean, language: Language) {
  const isFa = language === "fa";

  if (!baselineComplete) {
    return isFa
      ? "اقدام غیرپزشکی پیشنهادی: خط پایه کوتاه را اجرا کنید تا مقایسه نشست‌های بعدی شخصی‌تر شود."
      : "Recommended non-medical action: run a short baseline so future session comparisons are more personal.";
  }

  if (metrics.signalQuality < 55) {
    return isFa
      ? "اقدام غیرپزشکی پیشنهادی: سیگنال‌ها را دوباره کالیبره کنید یا سنسورهای کم‌کیفیت را خاموش کنید."
      : "Recommended non-medical action: recalibrate signals or disable low-quality sensors.";
  }

  if (metrics.collapseRisk >= 32 || metrics.stability < 58) {
    return isFa
      ? "اقدام غیرپزشکی پیشنهادی: پنج دقیقه مکث کنید، چندوظیفگی را کاهش دهید و سپس نشست را ادامه دهید."
      : "Recommended non-medical action: take a five minute pause, reduce multitasking, then continue the session.";
  }

  if (metrics.cognitiveLoad >= 70 || metrics.fatigue >= 58) {
    return isFa
      ? "اقدام غیرپزشکی پیشنهادی: کار فعلی را به یک قدم کوچک‌تر تقسیم کنید و اعلان‌ها را کم کنید."
      : "Recommended non-medical action: split the current task into a smaller step and reduce notifications.";
  }

  return isFa
    ? "اقدام غیرپزشکی پیشنهادی: همین ریتم کاری را حفظ کنید و بعد از چند دقیقه دوباره بررسی کنید."
    : "Recommended non-medical action: keep the current work rhythm and check again in a few minutes.";
}

function getStrongestSignal(history: CognitiveMetrics[], metrics: CognitiveMetrics, language: Language) {
  const first = history.length > 1 ? history[0] : metrics;
  const latest = history.length > 0 ? history.at(-1)! : metrics;
  const strongest = keys
    .map((key) => ({ key, change: latest[key] - first[key], magnitude: Math.abs(latest[key] - first[key]) }))
    .sort((a, b) => b.magnitude - a.magnitude)[0];

  const direction =
    strongest.change === 0
      ? language === "fa"
        ? "بدون تغییر قابل توجه"
        : "no meaningful change"
      : strongest.change > 0
        ? language === "fa"
          ? "افزایش"
          : "increased"
        : language === "fa"
          ? "کاهش"
          : "decreased";

  const label = metricLabels[language][strongest.key];
  const amount = Math.round(Math.abs(strongest.change));
  return language === "fa" ? `${label}: ${direction} ${amount}٪` : `${label}: ${direction} ${amount}%`;
}

export function generateSessionReview(input: SessionReviewInput): GeneratedSessionReview {
  const language = input.language === "fa" ? "fa" : "en";
  const history = input.history.length > 0 ? input.history.slice(-40) : [input.metrics];
  const latest = input.metrics;
  const isFa = language === "fa";
  const best = [...history].sort((a, b) => b.focus - a.focus || b.stability - a.stability)[0];
  const weakest = [...history].sort((a, b) => b.collapseRisk - a.collapseRisk || a.stability - b.stability)[0];
  const statusLabel = getStatus(latest, language);
  const strongestSignal = getStrongestSignal(history, latest, language);
  const bestWindow = isFa
    ? `${formatTime(best.timestamp, language)} با تمرکز ${best.focus}٪ و پایداری ${best.stability}٪`
    : `${formatTime(best.timestamp, language)} with ${best.focus}% focus and ${best.stability}% stability`;
  const weakestWindow = isFa
    ? `${formatTime(weakest.timestamp, language)} با ریسک افت ${weakest.collapseRisk}٪ و پایداری ${weakest.stability}٪`
    : `${formatTime(weakest.timestamp, language)} with ${weakest.collapseRisk}% decline risk and ${weakest.stability}% stability`;
  const summary = isFa
    ? `این بازبینی نشست وضعیت ${statusLabel} را نشان می‌دهد. کیفیت سیگنال ${latest.signalQuality}٪ است و مهم‌ترین تغییر ثبت‌شده ${strongestSignal} بود.`
    : `This session review shows a ${statusLabel.toLowerCase()} state. Signal quality is ${latest.signalQuality}% and the strongest recorded change was ${strongestSignal}.`;
  const activeSensors = sensorOrder
    .filter((key) => (input.activeSensors ?? []).includes(key))
    .map((key) => sensorLabels[language][key]);

  return {
    summary: sanitizeText(summary, 500),
    strongestSignal: sanitizeText(strongestSignal, 160),
    bestWindow: sanitizeText(bestWindow, 180),
    weakestWindow: sanitizeText(weakestWindow, 180),
    actionSuggested: sanitizeText(getAction(latest, Boolean(input.baselineComplete), language), 500),
    signalQuality: latest.signalQuality,
    statusLabel,
    activeSensors,
    disclaimer: getProjectDisclaimer(language),
    createdAt: new Date().toISOString(),
  };
}
