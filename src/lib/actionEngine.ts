import type { ActionTypeOutcome } from "./actionFollowUp";
import type { Language } from "./i18n";
import type { CognitiveMetrics } from "./mockData";
import { getProjectDisclaimer } from "./reportGenerator";
import { sanitizeText } from "./security";

export type ActionBaseline = {
  focusBaseline: number;
  stabilityBaseline: number;
  collapseRiskBaseline: number;
  signalQuality: number;
  qualityScore: number;
  mouseStability?: number | null;
  eyeQuality?: number | null;
  voiceStability?: number | null;
  createdAt?: string;
} | null;

export type ActionSensorContext = {
  mouseStability?: number | null;
  eyeQuality?: number | null;
  voiceStability?: number | null;
  noiseLevel?: number | null;
};

export type RecommendedActionStatus = "suggested" | "accepted" | "dismissed" | "not_useful" | "helpful" | "not_sure";

export type GeneratedRecommendedAction = {
  id?: string;
  actionType: string;
  title: string;
  reason: string;
  status: RecommendedActionStatus;
  priority: "low" | "medium" | "high";
  followUpMinutes: number;
  followUpAt: string;
  // Transparent, plain-language note when the user's own history influenced this pick.
  historyNote: string | null;
  disclaimer: string;
  createdAt: string;
};

export type ActionEngineInput = {
  metrics: CognitiveMetrics;
  baseline?: ActionBaseline;
  sensors?: ActionSensorContext;
  language?: Language;
  // The user's prior helpful/not-useful history per action type (Phase 4).
  outcomesByType?: Record<string, ActionTypeOutcome>;
};

type ActionRule = {
  actionType: string;
  priority: GeneratedRecommendedAction["priority"];
  followUpMinutes: number;
  when: (input: Required<Pick<ActionEngineInput, "metrics">> & Pick<ActionEngineInput, "baseline" | "sensors">) => boolean;
  copy: Record<Language, { title: string; reason: string }>;
};

const rules: ActionRule[] = [
  {
    actionType: "recalibrate_signals",
    priority: "high",
    followUpMinutes: 5,
    when: ({ metrics, baseline }) => metrics.signalQuality < 45 || Boolean(baseline && baseline.qualityScore < 55),
    copy: {
      en: {
        title: "Recalibrate the input signals",
        reason: "Signal quality is low, so the dashboard should improve input confidence before interpreting the session.",
      },
      fa: {
        title: "سیگنال‌های ورودی را دوباره کالیبره کنید",
        reason: "کیفیت سیگنال پایین است؛ بهتر است قبل از تفسیر نشست، اطمینان ورودی بهتر شود.",
      },
    },
  },
  {
    actionType: "five_minute_break",
    priority: "high",
    followUpMinutes: 10,
    when: ({ metrics, baseline }) =>
      metrics.collapseRisk >= 34 ||
      metrics.stability < 55 ||
      Boolean(baseline && metrics.focus <= baseline.focusBaseline - 16 && metrics.stability <= baseline.stabilityBaseline - 10),
    copy: {
      en: {
        title: "Take a 5 minute cognitive break",
        reason: "Stability is under pressure and the simulated decline risk is elevated compared with the current session pattern.",
      },
      fa: {
        title: "یک مکث شناختی ۵ دقیقه‌ای بگیرید",
        reason: "پایداری تحت فشار است و ریسک افت شبیه‌سازی‌شده نسبت به الگوی نشست افزایش یافته است.",
      },
    },
  },
  {
    actionType: "reduce_multitasking",
    priority: "medium",
    followUpMinutes: 10,
    when: ({ metrics, baseline }) =>
      metrics.cognitiveLoad >= 74 || Boolean(baseline && metrics.collapseRisk >= baseline.collapseRiskBaseline + 14),
    copy: {
      en: {
        title: "Reduce multitasking for 10 minutes",
        reason: "Cognitive load is high, so narrowing attention to one task may make the next window easier to sustain.",
      },
      fa: {
        title: "برای ۱۰ دقیقه چندوظیفگی را کم کنید",
        reason: "بار شناختی بالاست؛ تمرکز روی یک کار می‌تواند حفظ پنجره بعدی را ساده‌تر کند.",
      },
    },
  },
  {
    actionType: "quiet_environment",
    priority: "medium",
    followUpMinutes: 10,
    when: ({ baseline, sensors }) =>
      Boolean(
        baseline?.voiceStability &&
          sensors?.voiceStability &&
          sensors.voiceStability <= baseline.voiceStability - 18 &&
          (sensors.noiseLevel ?? 0) >= 58,
      ),
    copy: {
      en: {
        title: "Move to a quieter environment",
        reason: "Voice stability appears lower than your baseline while noise is elevated, so the audio signal may be harder to interpret.",
      },
      fa: {
        title: "به محیط آرام‌تری بروید",
        reason: "پایداری صدا نسبت به خط پایه پایین‌تر است و نویز بالاتر دیده می‌شود؛ بنابراین تفسیر سیگنال صدا سخت‌تر می‌شود.",
      },
    },
  },
  {
    actionType: "smaller_task_step",
    priority: "medium",
    followUpMinutes: 10,
    when: ({ metrics }) => metrics.fatigue >= 62 || (metrics.focus < 62 && metrics.cognitiveLoad >= 64),
    copy: {
      en: {
        title: "Switch to a smaller task step",
        reason: "Fatigue or attention drift is rising, so a smaller step can reduce friction without stopping the whole session.",
      },
      fa: {
        title: "کار را به قدم کوچک‌تری تبدیل کنید",
        reason: "خستگی یا انحراف توجه در حال افزایش است؛ یک قدم کوچک‌تر می‌تواند اصطکاک را کم کند بدون اینکه کل نشست متوقف شود.",
      },
    },
  },
  {
    actionType: "turn_off_notifications",
    priority: "low",
    followUpMinutes: 10,
    when: ({ metrics }) => metrics.stress >= 58 || (metrics.focus < 68 && metrics.stability < 66),
    copy: {
      en: {
        title: "Turn off notifications briefly",
        reason: "Focus and stability are softer than ideal, so reducing interruptions may help the next monitoring window.",
      },
      fa: {
        title: "اعلان‌ها را موقتاً خاموش کنید",
        reason: "تمرکز و پایداری کمتر از حالت ایده‌آل هستند؛ کم کردن مزاحمت‌ها می‌تواند پنجره پایش بعدی را بهتر کند.",
      },
    },
  },
  {
    actionType: "run_personal_baseline",
    priority: "low",
    followUpMinutes: 5,
    when: ({ baseline }) => !baseline,
    copy: {
      en: {
        title: "Run a personal baseline",
        reason: "The action engine can explain changes better after it has a user-owned baseline for comparison.",
      },
      fa: {
        title: "خط پایه شخصی را اجرا کنید",
        reason: "موتور اقدام بعد از داشتن خط پایه مخصوص همین کاربر، تغییرات را بهتر توضیح می‌دهد.",
      },
    },
  },
];

const fallbackCopy: Record<Language, { title: string; reason: string }> = {
  en: {
    title: "Keep the current work rhythm",
    reason: "The current simulated indicators look stable, so the best next step is to continue and review again shortly.",
  },
  fa: {
    title: "ریتم کاری فعلی را حفظ کنید",
    reason: "شاخص‌های شبیه‌سازی‌شده فعلی پایدار به نظر می‌رسند؛ بهترین قدم بعدی ادامه دادن و بازبینی کوتاه بعدی است.",
  },
};

const priorityWeight: Record<GeneratedRecommendedAction["priority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// Base priority, nudged by the user's own history with this action type. A strong helpful
// history adds up to +1; a poor one subtracts up to -1. Priority stays dominant, so safety
// rules are not silenced by history, but a well-liked action can win among equal matches.
function scoreCandidate(
  rule: { actionType: string; priority: GeneratedRecommendedAction["priority"] },
  outcomesByType?: Record<string, ActionTypeOutcome>,
) {
  const base = priorityWeight[rule.priority];
  const outcome = outcomesByType?.[rule.actionType];
  if (!outcome || outcome.answered === 0) {
    return base;
  }
  return base + (outcome.helpfulRate - 0.5) * 2;
}

function buildHistoryNote(
  actionType: string,
  outcomesByType: Record<string, ActionTypeOutcome> | undefined,
  language: Language,
) {
  const outcome = outcomesByType?.[actionType];
  if (!outcome || outcome.helpfulCount <= 0) {
    return null;
  }
  const note =
    language === "fa"
      ? `متناسب با شما: این اقدام پیش از این ${outcome.helpfulCount} بار از ${outcome.answered} بار کمک کرده است.`
      : `Adapted to you: this action helped ${outcome.helpfulCount} of ${outcome.answered} times before.`;
  return sanitizeText(note, 200);
}

export function generateRecommendedAction(input: ActionEngineInput): GeneratedRecommendedAction {
  const language = input.language === "fa" ? "fa" : "en";
  const context = { metrics: input.metrics, baseline: input.baseline ?? null, sensors: input.sensors };
  const candidates = rules.filter((rule) => rule.when(context));
  const matchedRule =
    candidates.length > 0
      ? candidates.reduce((best, rule) =>
          scoreCandidate(rule, input.outcomesByType) > scoreCandidate(best, input.outcomesByType) ? rule : best,
        )
      : null;
  const selected = matchedRule ?? {
    actionType: "keep_current_rhythm",
    priority: "low" as const,
    followUpMinutes: 10,
    copy: fallbackCopy,
  };
  const now = new Date();
  const followUpAt = new Date(now.getTime() + selected.followUpMinutes * 60_000);
  const copy = selected.copy[language];

  return {
    actionType: selected.actionType,
    title: sanitizeText(copy.title, 160),
    reason: sanitizeText(copy.reason, 500),
    status: "suggested",
    priority: selected.priority,
    followUpMinutes: selected.followUpMinutes,
    followUpAt: followUpAt.toISOString(),
    historyNote: buildHistoryNote(selected.actionType, input.outcomesByType, language),
    disclaimer: getProjectDisclaimer(language),
    createdAt: now.toISOString(),
  };
}
