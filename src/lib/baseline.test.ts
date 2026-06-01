import { describe, expect, it } from "vitest";
import { generateBaselineProfile, getBaselineFreshness } from "./baseline";
import type { CognitiveMetrics } from "./mockData";

const metrics: CognitiveMetrics = {
  focus: 82,
  cognitiveLoad: 48,
  fatigue: 33,
  stress: 24,
  stability: 86,
  collapseRisk: 12,
  signalQuality: 94,
  timestamp: "2026-05-31T10:00:00.000Z",
};

describe("baseline profile", () => {
  it("creates a strong user baseline from self report and current metrics", () => {
    const baseline = generateBaselineProfile({
      metrics,
      focusSelfReport: 5,
      energySelfReport: 4,
      taskDifficulty: 2,
      distractionLevel: 1,
      language: "en",
    });

    expect(baseline.statusLabel).toBe("Strong baseline");
    expect(baseline.qualityScore).toBeGreaterThanOrEqual(75);
    expect(baseline.focusBaseline).toBe(82);
    expect(baseline.summary).toContain("Personal baseline saved");
  });

  it("flags low quality baseline in Persian when signal quality is weak", () => {
    const baseline = generateBaselineProfile({
      metrics: { ...metrics, signalQuality: 28, focus: 55, stability: 49 },
      focusSelfReport: 2,
      energySelfReport: 2,
      taskDifficulty: 5,
      distractionLevel: 5,
      language: "fa",
    });

    expect(baseline.statusLabel).toBe("کیفیت پایین خط پایه");
    expect(baseline.qualityScore).toBeLessThan(55);
    expect(baseline.summary).toContain("غیرپزشکی");
  });

  it("reports missing and active freshness states", () => {
    expect(getBaselineFreshness(null, "en")).toBe("Missing baseline");
    expect(getBaselineFreshness(new Date().toISOString(), "fa")).toBe("خط پایه فعال");
  });
});
