import { describe, expect, it } from "vitest";
import { generateSessionReview } from "./sessionReview";
import type { CognitiveMetrics } from "./mockData";

const base: CognitiveMetrics = {
  focus: 80,
  cognitiveLoad: 50,
  fatigue: 35,
  stress: 30,
  stability: 84,
  collapseRisk: 14,
  signalQuality: 92,
  timestamp: "2026-05-30T09:00:00.000Z",
};

describe("session review", () => {
  it("creates an explainable English review with best and weakest windows", () => {
    const review = generateSessionReview({
      metrics: { ...base, focus: 62, cognitiveLoad: 76, fatigue: 60, stability: 63, collapseRisk: 28 },
      history: [
        base,
        { ...base, focus: 88, stability: 90, timestamp: "2026-05-30T09:05:00.000Z" },
        { ...base, focus: 62, stability: 63, collapseRisk: 28, timestamp: "2026-05-30T09:10:00.000Z" },
      ],
      baselineComplete: true,
      language: "en",
    });

    expect(review.summary).toContain("Signal quality");
    expect(review.bestWindow).toContain("88% focus");
    expect(review.weakestWindow).toContain("28% decline risk");
    expect(review.actionSuggested).toContain("Recommended non-medical action");
  });

  it("creates a Persian review and recommends baseline when missing", () => {
    const review = generateSessionReview({
      metrics: base,
      history: [base],
      baselineComplete: false,
      language: "fa",
    });

    expect(review.summary).toContain("کیفیت سیگنال");
    expect(review.actionSuggested).toContain("خط پایه");
    expect(review.disclaimer).toContain("تشخیص پزشکی");
  });

  it("lists active sensors in a fixed order and the requested language", () => {
    const en = generateSessionReview({
      metrics: base,
      history: [base],
      activeSensors: ["voice", "mouse"],
      language: "en",
    });
    expect(en.activeSensors).toEqual(["Mouse", "Voice"]);

    const fa = generateSessionReview({ metrics: base, history: [base], activeSensors: ["eye"], language: "fa" });
    expect(fa.activeSensors).toEqual(["چشم"]);
  });

  it("returns an empty active-sensor list when none contributed", () => {
    const review = generateSessionReview({ metrics: base, history: [base] });
    expect(review.activeSensors).toEqual([]);
  });
});
