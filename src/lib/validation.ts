import { sanitizeText } from "./security";
import type { CognitiveMetrics } from "./mockData";
import { z } from "zod";
import type { Language } from "./i18n";

export type FeedbackInput = {
  name: string;
  email: string;
  message: string;
  rating: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const messages = {
  en: {
    name: "Name must be at least 2 characters.",
    email: "Enter a valid email address.",
    message: "Message must be at least 10 characters.",
    rating: "Rating must be a number from 1 to 5.",
    password: "Password must be at least 8 characters.",
    authName: "Full name must be at least 2 characters.",
  },
  fa: {
    name: "نام باید حداقل ۲ کاراکتر باشد.",
    email: "یک ایمیل معتبر وارد کنید.",
    message: "پیام باید حداقل ۱۰ کاراکتر باشد.",
    rating: "امتیاز باید عددی بین ۱ تا ۵ باشد.",
    password: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
    authName: "نام کامل باید حداقل ۲ کاراکتر باشد.",
  },
} as const;

function getFeedbackSchema(language: Language) {
  const text = messages[language];
  return z.object({
    name: z.string().trim().min(2, text.name).max(80),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((value) => value.length === 0 || emailPattern.test(value), text.email),
    message: z.string().trim().min(10, text.message).max(1000),
    rating: z.coerce
      .number()
      .int(text.rating)
      .min(1, text.rating)
      .max(5, text.rating),
  });
}

export function validateFeedback(input: Partial<FeedbackInput>, language: Language = "en") {
  const errors: Record<string, string> = {};
  const parsed = getFeedbackSchema(language).safeParse({
    name: sanitizeText(String(input.name ?? ""), 80),
    email: sanitizeText(String(input.email ?? ""), 120).toLowerCase(),
    message: sanitizeText(String(input.message ?? ""), 1000),
    rating: input.rating,
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] = issue.message;
    }
  }

  const data = parsed.success
    ? parsed.data
    : {
        name: sanitizeText(String(input.name ?? ""), 80),
        email: sanitizeText(String(input.email ?? ""), 120).toLowerCase(),
        message: sanitizeText(String(input.message ?? ""), 1000),
        rating: Number(input.rating),
      };

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data,
  };
}

export function isMetricsPayload(value: unknown): value is CognitiveMetrics {
  if (!value || typeof value !== "object") {
    return false;
  }

  const metrics = value as Record<string, unknown>;
  const hasNumbers = [
    "focus",
    "cognitiveLoad",
    "fatigue",
    "stress",
    "stability",
    "collapseRisk",
    "signalQuality",
  ].every((key) => typeof metrics[key] === "number");

  return hasNumbers && typeof metrics.timestamp === "string";
}

export const cognitiveMetricSchema = z.object({
  focus: z.coerce.number().int().min(0).max(100),
  cognitiveLoad: z.coerce.number().int().min(0).max(100),
  fatigue: z.coerce.number().int().min(0).max(100),
  stress: z.coerce.number().int().min(0).max(100),
  stability: z.coerce.number().int().min(0).max(100),
  collapseRisk: z.coerce.number().int().min(0).max(100),
  signalQuality: z.coerce.number().int().min(0).max(100),
  timestamp: z.string().datetime(),
});

export const sessionReviewSchema = z.object({
  sessionId: z.string().trim().min(1).max(80).optional(),
  metrics: cognitiveMetricSchema,
  history: z.array(cognitiveMetricSchema).max(80).default([]),
  language: z.enum(["en", "fa"]).default("en"),
  baselineComplete: z.boolean().default(false),
  startedAt: z.string().datetime().optional(),
});

export type SessionReviewPayload = z.infer<typeof sessionReviewSchema>;

export const baselineSchema = z.object({
  sessionId: z.string().trim().min(1).max(80).optional(),
  metrics: cognitiveMetricSchema,
  // Window of readings captured during the baseline countdown. Optional for
  // backward compatibility; the route falls back to [metrics] when absent.
  samples: z.array(cognitiveMetricSchema).max(60).optional(),
  language: z.enum(["en", "fa"]).default("en"),
  focusSelfReport: z.coerce.number().int().min(1).max(5),
  energySelfReport: z.coerce.number().int().min(1).max(5),
  taskDifficulty: z.coerce.number().int().min(1).max(5),
  distractionLevel: z.coerce.number().int().min(1).max(5),
});

export type BaselinePayload = z.infer<typeof baselineSchema>;

export const actionRecommendationSchema = z.object({
  sessionId: z.string().trim().min(1).max(80).optional(),
  metrics: cognitiveMetricSchema,
  language: z.enum(["en", "fa"]).default("en"),
});

export type ActionRecommendationPayload = z.infer<typeof actionRecommendationSchema>;

export const actionFeedbackSchema = z.object({
  actionId: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["accepted", "dismissed", "not_useful", "helpful", "not_sure"]),
  focusAfter: z.coerce.number().int().min(1).max(5).optional(),
  energyAfter: z.coerce.number().int().min(1).max(5).optional(),
});

export type ActionFeedbackPayload = z.infer<typeof actionFeedbackSchema>;

export const actionFollowUpSchema = z.object({
  actionId: z.string().trim().min(1).max(120),
  outcome: z.enum(["helpful", "not_useful", "not_sure"]),
  focusAfter: z.coerce.number().int().min(1).max(5),
  energyAfter: z.coerce.number().int().min(1).max(5),
  language: z.enum(["en", "fa"]).default("en"),
});

export type ActionFollowUpPayload = z.infer<typeof actionFollowUpSchema>;

export const mouseAnalysisSchema = z.object({
  sessionId: z.string().trim().min(1).max(80).optional(),
  actionsPerMinute: z.coerce.number().int().min(0).max(5000),
  distancePx: z.coerce.number().int().min(0).max(2_000_000),
  averageVelocity: z.coerce.number().min(0).max(5000),
  idleMs: z.coerce.number().int().min(0).max(3_600_000),
  jitterScore: z.coerce.number().int().min(0).max(100),
  directionChanges: z.coerce.number().int().min(0).max(20_000),
  stabilityScore: z.coerce.number().int().min(0).max(100),
  confidence: z.coerce.number().int().min(0).max(100),
  sampleCount: z.coerce.number().int().min(0).max(5000),
  clickCount: z.coerce.number().int().min(0).max(5000),
  wheelCount: z.coerce.number().int().min(0).max(5000),
  timestamp: z.string().datetime().optional(),
});

export type MouseAnalysisPayload = z.infer<typeof mouseAnalysisSchema>;

export const eyeAnalysisSchema = z.object({
  sessionId: z.string().trim().min(1).max(80).optional(),
  trackingQuality: z.coerce.number().int().min(0).max(100),
  gazeStability: z.coerce.number().int().min(0).max(100),
  blinkProxy: z.coerce.number().int().min(0).max(100),
  lightingQuality: z.coerce.number().int().min(0).max(100),
  motionVariance: z.coerce.number().int().min(0).max(100),
  focusConsistency: z.coerce.number().int().min(0).max(100),
  confidence: z.coerce.number().int().min(0).max(100),
  frameCount: z.coerce.number().int().min(0).max(5000),
  averageLuminance: z.coerce.number().int().min(0).max(255),
  contrastLevel: z.coerce.number().int().min(0).max(255),
  // Real face-detection outputs. Optional so older clients and the mock path still validate.
  faceDetected: z.coerce.boolean().optional(),
  facePresence: z.coerce.number().int().min(0).max(100).optional(),
  glassesConfidence: z.coerce.number().int().min(0).max(100).optional(),
  glassesDetected: z.coerce.boolean().optional(),
  timestamp: z.string().datetime().optional(),
});

export type EyeAnalysisPayload = z.infer<typeof eyeAnalysisSchema>;

export const voiceAnalysisSchema = z.object({
  sessionId: z.string().trim().min(1).max(80).optional(),
  volumeLevel: z.coerce.number().int().min(0).max(100),
  voiceStability: z.coerce.number().int().min(0).max(100),
  speechActivity: z.coerce.number().int().min(0).max(100),
  silenceRatio: z.coerce.number().int().min(0).max(100),
  clarityScore: z.coerce.number().int().min(0).max(100),
  noiseLevel: z.coerce.number().int().min(0).max(100),
  toneVariability: z.coerce.number().int().min(0).max(100),
  confidence: z.coerce.number().int().min(0).max(100),
  sampleCount: z.coerce.number().int().min(0).max(5000),
  averageRms: z.coerce.number().int().min(0).max(1000),
  spectralCentroid: z.coerce.number().int().min(0).max(24_000),
  timestamp: z.string().datetime().optional(),
});

export type VoiceAnalysisPayload = z.infer<typeof voiceAnalysisSchema>;

function getAuthSchema(language: Language, mode: "login" | "register") {
  const text = messages[language];
  return z.object({
    name: mode === "register" ? z.string().trim().min(2, text.authName).max(80) : z.string().optional(),
    email: z.string().trim().email(text.email).max(120),
    password: z.string().min(8, text.password).max(128),
  });
}

export function validateAuthInput(input: Record<string, unknown>, language: Language = "en", mode: "login" | "register") {
  const parsed = getAuthSchema(language, mode).safeParse({
    name: sanitizeText(String(input.name ?? ""), 80),
    email: sanitizeText(String(input.email ?? ""), 120).toLowerCase(),
    password: String(input.password ?? ""),
  });

  if (parsed.success) {
    return { valid: true as const, data: parsed.data, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    errors[String(issue.path[0] ?? "form")] = issue.message;
  }

  return {
    valid: false as const,
    data: null,
    errors,
  };
}
