import { describe, expect, it } from "vitest";
import {
  classifySignalQuality,
  deriveMetrics,
  hasUsableSignal,
  type MouseSignalInput,
  type VoiceSignalInput,
} from "./cognitiveModel";
import type { CognitiveMetrics } from "./mockData";

const focusedMouse: MouseSignalInput = {
  stabilityScore: 92,
  jitterScore: 8,
  idleMs: 300,
  directionChanges: 1,
  actionsPerMinute: 40,
  confidence: 80,
};

const jitteryMouse: MouseSignalInput = {
  stabilityScore: 50,
  jitterScore: 80,
  idleMs: 300,
  directionChanges: 12,
  actionsPerMinute: 160,
  confidence: 80,
};

const noisyVoice: VoiceSignalInput = {
  voiceStability: 10,
  toneVariability: 95,
  noiseLevel: 95,
  speechActivity: 10,
  clarityScore: 10,
  confidence: 20,
};

describe("deriveMetrics", () => {
  it("turns a steady, low-jitter mouse signal into high focus tagged as sensor-derived", () => {
    const result = deriveMetrics({ mouse: focusedMouse });

    expect(result.source).toBe("sensors");
    expect(result.focus).toBeGreaterThan(70);
    expect(result.focus).toBeLessThanOrEqual(100);
  });

  it("lowers focus when the same sensor reports more jitter (monotonic behavior)", () => {
    const steady = deriveMetrics({ mouse: focusedMouse }).focus;
    const jittery = deriveMetrics({ mouse: jitteryMouse }).focus;

    expect(jittery).toBeLessThan(steady);
  });

  it("reflects sensor confidence in signal quality", () => {
    const high = deriveMetrics({ mouse: { ...focusedMouse, confidence: 95 } }).signalQuality;
    const low = deriveMetrics({ mouse: { ...focusedMouse, confidence: 20 } }).signalQuality;

    expect(high).toBeGreaterThan(low);
  });

  it("falls back to previous values for metrics no sensor can inform", () => {
    const previous: CognitiveMetrics = {
      focus: 12,
      cognitiveLoad: 88,
      fatigue: 90,
      stress: 77,
      stability: 33,
      collapseRisk: 40,
      signalQuality: 50,
      timestamp: "2026-01-01T00:00:00.000Z",
      source: "simulated",
    };

    const result = deriveMetrics({}, previous);

    expect(result.focus).toBe(previous.focus);
    expect(result.signalQuality).toBe(previous.signalQuality);
  });

  it("does not raise collapse risk when overall signal quality is too low to trust", () => {
    const damped = deriveMetrics({ mouse: { ...jitteryMouse, confidence: 20 }, voice: noisyVoice });
    const trusted = deriveMetrics({
      mouse: { ...jitteryMouse, confidence: 95 },
      voice: { ...noisyVoice, confidence: 95 },
    });

    expect(damped.signalQuality).toBeLessThan(35);
    expect(damped.collapseRisk).toBeLessThanOrEqual(22);
    expect(trusted.collapseRisk).toBeGreaterThan(22);
  });
});

describe("hasUsableSignal", () => {
  it("is true when at least one sensor carries confidence", () => {
    expect(hasUsableSignal({ mouse: focusedMouse })).toBe(true);
  });

  it("is false when no sensors are present or all report zero confidence", () => {
    expect(hasUsableSignal({})).toBe(false);
    expect(hasUsableSignal({ mouse: { ...focusedMouse, confidence: 0 } })).toBe(false);
  });
});

describe("classifySignalQuality", () => {
  it("classifies weak input as low, mid as fair, and strong as good", () => {
    expect(classifySignalQuality(10)).toBe("low");
    expect(classifySignalQuality(34)).toBe("low");
    expect(classifySignalQuality(35)).toBe("fair");
    expect(classifySignalQuality(64)).toBe("fair");
    expect(classifySignalQuality(65)).toBe("good");
    expect(classifySignalQuality(95)).toBe("good");
  });
});
