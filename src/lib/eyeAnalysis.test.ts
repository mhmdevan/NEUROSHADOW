import { describe, expect, it } from "vitest";
import {
  analyzeEyeVisionSamples,
  classifyGlasses,
  emptyEyeAnalysis,
  estimateGlassesScore,
  type EyeVisionSample,
} from "./eyeAnalysis";

const baseSample: Omit<EyeVisionSample, "timestamp"> = {
  faceDetected: true,
  eyeOpenness: 0.95,
  gazeX: 0,
  gazeY: 0,
  headYaw: 0,
  headPitch: 0,
  glassesScore: 0,
  brightness: 125,
};

function visionSamples(rows: Array<Partial<EyeVisionSample>>, start = 1_000): EyeVisionSample[] {
  return rows.map((row, index) => ({ ...baseSample, timestamp: start + index * 130, ...row }));
}

describe("analyzeEyeVisionSamples", () => {
  it("reports a confident reading when a face is steadily present", () => {
    const result = analyzeEyeVisionSamples(
      visionSamples(Array.from({ length: 12 }, () => ({}))),
      1_000 + 12 * 130,
    );

    expect(result.faceDetected).toBe(true);
    expect(result.facePresence).toBe(100);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.trackingQuality).toBeGreaterThan(0);
    expect(result.frameCount).toBe(12);
  });

  it("collapses to zero confidence when the user leaves the frame (no face)", () => {
    const result = analyzeEyeVisionSamples(
      visionSamples(Array.from({ length: 8 }, () => ({ faceDetected: false }))),
      2_000,
    );

    expect(result.faceDetected).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.trackingQuality).toBe(0);
    expect(result.facePresence).toBe(0);
    expect(result.frameCount).toBe(0);
  });

  it("computes face presence as the fraction of frames containing a face", () => {
    const result = analyzeEyeVisionSamples(
      visionSamples([
        { faceDetected: true },
        { faceDetected: true },
        { faceDetected: false },
        { faceDetected: false },
      ]),
      3_000,
    );

    expect(result.facePresence).toBe(50);
    expect(result.faceDetected).toBe(true);
  });

  it("detects blink-like openness dips as blink activity", () => {
    const result = analyzeEyeVisionSamples(
      visionSamples([
        { eyeOpenness: 0.95 },
        { eyeOpenness: 0.2 },
        { eyeOpenness: 0.95 },
        { eyeOpenness: 0.2 },
        { eyeOpenness: 0.95 },
      ]),
      4_000,
    );

    expect(result.blinkProxy).toBeGreaterThan(0);
  });

  it("returns the empty snapshot for no samples at all", () => {
    const result = analyzeEyeVisionSamples([], 5_000);
    expect(result.faceDetected).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.frameCount).toBe(0);
  });
});

describe("estimateGlassesScore", () => {
  it("returns ~0 for a flat, edgeless region", () => {
    const width = 16;
    const height = 8;
    const gray = new Uint8ClampedArray(width * height).fill(128);
    expect(estimateGlassesScore(gray, width, height)).toBe(0);
  });

  it("returns a high score for a dense, high-contrast edge region", () => {
    const width = 16;
    const height = 8;
    const gray = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        gray[y * width + x] = (x + y) % 2 === 0 ? 0 : 255;
      }
    }
    expect(estimateGlassesScore(gray, width, height)).toBeGreaterThan(0.5);
  });
});

describe("classifyGlasses", () => {
  it("maps confidence bands to verdicts and reports unknown without a face", () => {
    expect(classifyGlasses({ ...emptyEyeAnalysis, faceDetected: true, glassesConfidence: 70 })).toBe("detected");
    expect(classifyGlasses({ ...emptyEyeAnalysis, faceDetected: true, glassesConfidence: 45 })).toBe("uncertain");
    expect(classifyGlasses({ ...emptyEyeAnalysis, faceDetected: true, glassesConfidence: 10 })).toBe("none");
    expect(classifyGlasses({ ...emptyEyeAnalysis, faceDetected: false, glassesConfidence: 90 })).toBe("unknown");
  });
});
