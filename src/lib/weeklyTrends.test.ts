import { describe, expect, it } from "vitest";
import { generateWeeklyTrends } from "./weeklyTrends";

describe("generateWeeklyTrends", () => {
  it("summarizes weekly snapshots and useful actions", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const trends = generateWeeklyTrends({
      now,
      language: "en",
      sessions: [{ createdAt: "2026-05-30T10:00:00.000Z" }, { createdAt: "2026-05-28T10:00:00.000Z" }],
      snapshots: [
        {
          focus: 80,
          stability: 76,
          signalQuality: 90,
          cognitiveLoad: 42,
          fatigue: 30,
          stress: 25,
          collapseRisk: 10,
          createdAt: "2026-05-30T10:00:00.000Z",
        },
        {
          focus: 60,
          stability: 52,
          signalQuality: 70,
          cognitiveLoad: 64,
          fatigue: 48,
          stress: 44,
          collapseRisk: 24,
          createdAt: "2026-05-31T10:00:00.000Z",
        },
      ],
      actions: [
        {
          title: "Reduce multitasking for 10 minutes",
          actionType: "reduce_multitasking",
          status: "helpful",
          helpful: true,
          respondedAt: "2026-05-31T11:00:00.000Z",
        },
      ],
    });

    expect(trends.averageFocusScore).toBe(70);
    expect(trends.averageStabilityScore).toBe(64);
    expect(trends.sessionsCompleted).toBe(2);
    expect(trends.mostCommonAlertType.type).toBe("stability");
    expect(trends.mostUsefulAction?.title).toBe("Reduce multitasking for 10 minutes");
    expect(trends.signalQualityTrend).toHaveLength(7);
    expect(trends.empty).toBe(false);
  });

  it("returns an empty state when there is no weekly data", () => {
    const trends = generateWeeklyTrends({
      now: new Date("2026-06-01T12:00:00.000Z"),
      language: "fa",
      sessions: [],
      snapshots: [],
      actions: [],
    });

    expect(trends.empty).toBe(true);
    expect(trends.averageFocusScore).toBeNull();
    expect(trends.mostCommonAlertType.type).toBe("none");
    expect(trends.summary).toContain("داده کافی");
  });
});
