import { describe, expect, it } from "vitest";
import { analyzeVoiceAudioSamples, type VoiceAudioSample } from "./voiceAnalysis";

function makeSample(index: number, overrides: Partial<VoiceAudioSample> = {}): VoiceAudioSample {
  return {
    timestamp: 1_800_000_000_000 + index * 250,
    rms: 0.07,
    peak: 0.16,
    zeroCrossingRate: 0.06,
    spectralCentroid: 820 + Math.sin(index / 3) * 22,
    highFrequencyRatio: 0.12,
    noiseFloor: 0.012,
    ...overrides,
  };
}

describe("voice analysis", () => {
  it("scores stable speech-like audio with strong confidence", () => {
    const result = analyzeVoiceAudioSamples(Array.from({ length: 28 }, (_, index) => makeSample(index)));

    expect(result.speechActivity).toBeGreaterThan(90);
    expect(result.voiceStability).toBeGreaterThan(70);
    expect(result.clarityScore).toBeGreaterThan(70);
    expect(result.confidence).toBeGreaterThan(70);
  });

  it("detects silence-heavy microphone input", () => {
    const result = analyzeVoiceAudioSamples(
      Array.from({ length: 24 }, (_, index) =>
        makeSample(index, {
          rms: index % 8 === 0 ? 0.03 : 0.004,
          peak: index % 8 === 0 ? 0.08 : 0.012,
          spectralCentroid: 220,
          noiseFloor: 0.006,
        }),
      ),
    );

    expect(result.silenceRatio).toBeGreaterThan(70);
    expect(result.speechActivity).toBeLessThan(30);
  });

  it("returns aggregate features without raw audio data", () => {
    const result = analyzeVoiceAudioSamples(Array.from({ length: 8 }, (_, index) => makeSample(index)));

    expect("audioData" in result).toBe(false);
    expect("waveform" in result).toBe(false);
  });
});
