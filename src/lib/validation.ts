import { sanitizeText } from "./security";
import type { CognitiveMetrics } from "./mockData";
import { z } from "zod";

export type FeedbackInput = {
  name: string;
  email: string;
  message: string;
  rating: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value.length === 0 || emailPattern.test(value), "Enter a valid email address."),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(1000),
  rating: z.coerce
    .number()
    .int("Rating must be a number from 1 to 5.")
    .min(1, "Rating must be a number from 1 to 5.")
    .max(5, "Rating must be a number from 1 to 5."),
});

export function validateFeedback(input: Partial<FeedbackInput>) {
  const errors: Record<string, string> = {};
  const parsed = feedbackSchema.safeParse({
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
