import type { CognitiveMetrics } from "./mockData";
import type { Language } from "./i18n";
import { sanitizeText } from "./security";

export const projectDisclaimer =
  "NeuroShadow is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.";

export const projectDisclaimerFa =
  "نورو شَدو یک نمونه آموزشی و پژوهشی است. این سامانه از داده‌های شبیه‌سازی‌شده استفاده می‌کند و تشخیص پزشکی، درمان یا توصیه سلامت ارائه نمی‌دهد.";

export function getProjectDisclaimer(language: Language) {
  return language === "fa" ? projectDisclaimerFa : projectDisclaimer;
}

export type GeneratedReport = {
  summary: string;
  riskLevel: "Low" | "Moderate" | "Elevated";
  keyIndicators: string[];
  recommendation: string;
  disclaimer: string;
  content: string;
  timestamp: string;
};

function getRiskLevel(metrics: CognitiveMetrics): GeneratedReport["riskLevel"] {
  if (metrics.collapseRisk >= 32 || metrics.stress >= 62 || metrics.stability < 58) {
    return "Elevated";
  }

  if (metrics.collapseRisk >= 20 || metrics.cognitiveLoad >= 70 || metrics.fatigue >= 55) {
    return "Moderate";
  }

  return "Low";
}

function formatPercent(value: number, language: Language) {
  return language === "fa" ? `${new Intl.NumberFormat("fa-IR").format(value)}٪` : `${value}%`;
}

function formatReportTimestamp(timestamp: string, language: Language) {
  return language === "fa" ? new Date(timestamp).toLocaleString("fa-IR") : timestamp;
}

export function generateReport(metrics: CognitiveMetrics): GeneratedReport {
  return generateLocalizedReport(metrics, "en");
}

export function generateLocalizedReport(metrics: CognitiveMetrics, language: Language = "en"): GeneratedReport {
  const timestamp = new Date().toISOString();
  const riskLevel = getRiskLevel(metrics);
  const isFa = language === "fa";
  const disclaimer = getProjectDisclaimer(language);
  const riskLabel = isFa
    ? riskLevel === "Low"
      ? "کم"
      : riskLevel === "Moderate"
        ? "متوسط"
        : "افزایش‌یافته"
    : riskLevel;
  const summary = isFa
    ? riskLevel === "Elevated"
      ? "نشست شبیه‌سازی‌شده فشار بار شناختی افزایش‌یافته و حاشیه پایداری کمتر را نشان می‌دهد."
      : riskLevel === "Moderate"
        ? "نشست شبیه‌سازی‌شده فشار کاری متوسط و شاخص‌های نیازمند توجه را نشان می‌دهد."
        : "نشست شبیه‌سازی‌شده در حال حاضر پایدار است و برآورد ریسک افت عملکرد پایین است."
    : riskLevel === "Elevated"
      ? "The simulated session shows elevated cognitive load pressure with reduced stability buffers."
      : riskLevel === "Moderate"
        ? "The simulated session shows moderate workload pressure with watchlist indicators."
        : "The simulated session is currently stable with low collapse-risk projection.";

  const keyIndicators = isFa
    ? [
        `سطح تمرکز: ${formatPercent(metrics.focus, language)}`,
        `بار شناختی: ${formatPercent(metrics.cognitiveLoad, language)}`,
        `خستگی ذهنی: ${formatPercent(metrics.fatigue, language)}`,
        `احتمال استرس: ${formatPercent(metrics.stress, language)}`,
        `پایداری شناختی: ${formatPercent(metrics.stability, language)}`,
        `ریسک افت عملکرد: ${formatPercent(metrics.collapseRisk, language)}`,
        `کیفیت سیگنال: ${formatPercent(metrics.signalQuality, language)}`,
      ]
    : [
        `Focus Level: ${metrics.focus}%`,
        `Cognitive Load: ${metrics.cognitiveLoad}%`,
        `Mental Fatigue: ${metrics.fatigue}%`,
        `Stress Probability: ${metrics.stress}%`,
        `Cognitive Stability: ${metrics.stability}%`,
        `Collapse Risk: ${metrics.collapseRisk}%`,
        `Signal Quality: ${metrics.signalQuality}%`,
      ];

  const recommendation = isFa
    ? riskLevel === "Elevated"
      ? "اقدام غیرپزشکی پیشنهادی: سناریوی دمو را متوقف کنید، شدت کار را کاهش دهید و شبیه‌سازی خط پایه را دوباره اجرا کنید."
      : riskLevel === "Moderate"
        ? "اقدام غیرپزشکی پیشنهادی: پایش را ادامه دهید، جابه‌جایی شبیه‌سازی‌شده بین وظایف را کاهش دهید و با خط پایه مقایسه کنید."
        : "اقدام غیرپزشکی پیشنهادی: بار کاری شبیه‌سازی‌شده فعلی را حفظ کنید و داده روند را ادامه دهید."
    : riskLevel === "Elevated"
      ? "Recommended non-medical action: pause the demo scenario, reduce task intensity, and re-run the baseline simulation."
      : riskLevel === "Moderate"
        ? "Recommended non-medical action: continue monitoring, reduce simulated task switching, and compare against baseline."
        : "Recommended non-medical action: maintain the current simulated workload and keep collecting trend data.";

  const content = isFa
    ? [
        "گزارش هوش مصنوعی نورو شَدو",
        `زمان تولید: ${formatReportTimestamp(timestamp, language)}`,
        "",
        `خلاصه: ${summary}`,
        `تفسیر ریسک: ${riskLabel}`,
        "",
        "شاخص‌های کلیدی:",
        ...keyIndicators.map((indicator) => `- ${indicator}`),
        "",
        recommendation,
        "",
        `سلب مسئولیت: ${disclaimer}`,
      ].join("\n")
    : [
        "NeuroShadow AI REPORT",
        `Generated: ${timestamp}`,
        "",
        `Summary: ${summary}`,
        `Risk interpretation: ${riskLabel}`,
        "",
        "Key indicators:",
        ...keyIndicators.map((indicator) => `- ${indicator}`),
        "",
        recommendation,
        "",
        `Disclaimer: ${disclaimer}`,
      ].join("\n");

  return {
    summary: sanitizeText(summary, 400),
    riskLevel,
    keyIndicators,
    recommendation,
    disclaimer,
    content: sanitizeText(content, 5000),
    timestamp,
  };
}
