import { describe, expect, it } from "vitest";
import { analyzeEyeFrameSamples, type EyeFrameSample } from "./eyeAnalysis";

function frameSamples(values: Array<[number, number, number, number]>, start = 1_000): EyeFrameSample[] {
  return values.map(([luminance, contrast, motion, darkRatio], index) => ({
    luminance,
    contrast,
    motion,
    darkRatio,
    timestamp: start + index * 650,
  }));
}

describe("analyzeEyeFrameSamples", () => {
  it("returns aggregate camera-frame indicators for stable lighting", () => {
    const result = analyzeEyeFrameSamples(
      frameSamples([
        [124, 31, 4, 0.14],
        [128, 33, 5, 0.13],
        [126, 32, 4, 0.14],
        [129, 34, 6, 0.12],
      ]),
      4_000,
    );

    expect(result.trackingQuality).toBeGreaterThan(60);
    expect(result.lightingQuality).toBeGreaterThan(70);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.frameCount).toBe(4);
  });

  it("estimates blink-like dark drops without exposing video frames", () => {
    const result = analyzeEyeFrameSamples(
      frameSamples([
        [132, 34, 4, 0.12],
        [128, 33, 5, 0.13],
        [88, 31, 8, 0.36],
        [130, 34, 6, 0.14],
        [126, 32, 5, 0.15],
      ]),
      5_000,
    );

    expect(result.blinkProxy).toBeGreaterThan(0);
    expect(result).not.toHaveProperty("frames");
    expect(result).not.toHaveProperty("imageData");
  });
});
