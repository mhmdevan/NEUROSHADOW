import { describe, expect, it } from "vitest";
import { analyzeMouseSamples, type MouseSample } from "./mouseAnalysis";

function samplePath(points: Array<[number, number]>, start = 1_000): MouseSample[] {
  return points.map(([x, y], index) => ({
    x,
    y,
    timestamp: start + index * 250,
  }));
}

describe("analyzeMouseSamples", () => {
  it("converts browser pointer samples into aggregate movement indicators", () => {
    const result = analyzeMouseSamples(samplePath([[10, 10], [60, 10], [110, 15], [150, 25]]), {
      clickCount: 1,
      wheelCount: 0,
      now: 2_200,
    });

    expect(result.distancePx).toBeGreaterThan(130);
    expect(result.actionsPerMinute).toBeGreaterThan(0);
    expect(result.averageVelocity).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.sampleCount).toBe(4);
  });

  it("detects directional instability without storing raw coordinates in the output", () => {
    const result = analyzeMouseSamples(
      samplePath([[10, 10], [80, 10], [25, 70], [95, 75], [35, 20], [120, 25]]),
      {
        clickCount: 0,
        wheelCount: 2,
        now: 2_800,
      },
    );

    expect(result.directionChanges).toBeGreaterThan(0);
    expect(result.jitterScore).toBeGreaterThan(0);
    expect(result.stabilityScore).toBeLessThan(100);
    expect(result).not.toHaveProperty("samples");
    expect(result).not.toHaveProperty("x");
    expect(result).not.toHaveProperty("y");
  });
});
