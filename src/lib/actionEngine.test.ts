import { describe, expect, it } from "vitest";
import { generateRecommendedAction } from "./actionEngine";
import type { CognitiveMetrics } from "./mockData";

const stableMetrics: CognitiveMetrics = {
  focus: 82,
  cognitiveLoad: 48,
  fatigue: 32,
  stress: 24,
  stability: 86,
  collapseRisk: 12,
  signalQuality: 92,
  timestamp: "2026-05-31T12:00:00.000Z",
};

describe("action engine", () => {
  it("prioritizes signal recalibration when signal quality is low", () => {
    const action = generateRecommendedAction({
      metrics: { ...stableMetrics, signalQuality: 38 },
      baseline: null,
      language: "en",
    });

    expect(action.actionType).toBe("recalibrate_signals");
    expect(action.priority).toBe("high");
    expect(action.reason).toContain("Signal quality");
  });

  it("suggests a break when decline risk and stability are under pressure", () => {
    const action = generateRecommendedAction({
      metrics: { ...stableMetrics, stability: 51, collapseRisk: 36 },
      baseline: { focusBaseline: 84, stabilityBaseline: 88, collapseRiskBaseline: 10, signalQuality: 90, qualityScore: 88 },
      language: "en",
    });

    expect(action.actionType).toBe("five_minute_break");
    expect(action.title).toContain("5 minute");
    expect(action.disclaimer).toContain("does not provide medical diagnosis");
  });

  it("returns Persian copy for stable keep-rhythm action", () => {
    const action = generateRecommendedAction({
      metrics: stableMetrics,
      baseline: { focusBaseline: 80, stabilityBaseline: 82, collapseRiskBaseline: 12, signalQuality: 92, qualityScore: 90 },
      language: "fa",
    });

    expect(action.actionType).toBe("keep_current_rhythm");
    expect(action.title).toContain("ریتم");
    expect(action.disclaimer).toContain("تشخیص پزشکی");
  });
});
