import { describe, expect, it } from "vitest";
import { compareToBaseline, generateBaselineProfile, getBaselineFreshness } from "./baseline";
import type { CognitiveMetrics } from "./mockData";

const base: CognitiveMetrics = {
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
  it("builds a strong baseline distribution (mean + spread) from a capture window", () => {
    const baseline = generateBaselineProfile({
      samples: [
        { ...base, focus: 80, stability: 84 },
        { ...base, focus: 82, stability: 86 },
        { ...base, focus: 84, stability: 88 },
      ],
      focusSelfReport: 5,
      energySelfReport: 4,
      taskDifficulty: 2,
      distractionLevel: 1,
      language: "en",
    });

    expect(baseline.statusLabel).toBe("Strong baseline");
    expect(baseline.qualityScore).toBeGreaterThanOrEqual(75);
    expect(baseline.focusBaseline).toBe(82); // mean of 80, 82, 84
    expect(baseline.focusSpread).not.toBeNull();
    expect(baseline.focusSpread).toBeGreaterThan(0);
    expect(baseline.sampleCount).toBe(3);
    expect(baseline.summary).toContain("Personal baseline saved");
  });

  it("reports a null spread for a single-sample window", () => {
    const baseline = generateBaselineProfile({
      samples: [base],
      focusSelfReport: 4,
      energySelfReport: 4,
      taskDifficulty: 2,
      distractionLevel: 2,
      language: "en",
    });

    expect(baseline.sampleCount).toBe(1);
    expect(baseline.focusSpread).toBeNull();
    expect(baseline.focusBaseline).toBe(82);
  });

  it("flags low quality baseline in Persian when signal quality is weak", () => {
    const baseline = generateBaselineProfile({
      samples: [{ ...base, signalQuality: 28, focus: 55, stability: 49 }],
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

describe("compareToBaseline", () => {
  const distributed = generateBaselineProfile({
    // focus window {80, 84} -> mean 82, population std 2.0; cognitiveLoad is flat -> spread 0
    samples: [
      { ...base, focus: 80 },
      { ...base, focus: 84 },
    ],
    focusSelfReport: 4,
    energySelfReport: 4,
    taskDifficulty: 2,
    distractionLevel: 2,
    language: "en",
  });

  it("expresses the gap as a z-score when spread is usable", () => {
    const comparisons = compareToBaseline({ ...base, focus: 78 }, distributed);
    const focus = comparisons.find((comparison) => comparison.key === "focus");

    expect(focus?.z).toBe(-2); // (78 - 82) / 2.0
    expect(focus?.direction).toBe("below");
  });

  it("falls back to a raw delta when the metric had no usable spread", () => {
    const comparisons = compareToBaseline({ ...base, cognitiveLoad: 60 }, distributed);
    const load = comparisons.find((comparison) => comparison.key === "cognitiveLoad");

    expect(load?.z).toBeNull(); // flat baseline window -> spread below threshold
    expect(load?.direction).toBe("above"); // delta of +12 still reads as above
  });
});
