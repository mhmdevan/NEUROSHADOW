export type VoiceAudioSample = {
  timestamp: number;
  rms: number;
  peak: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  highFrequencyRatio: number;
  noiseFloor: number;
};

export type VoiceAnalysisSnapshot = {
  volumeLevel: number;
  voiceStability: number;
  speechActivity: number;
  silenceRatio: number;
  clarityScore: number;
  noiseLevel: number;
  toneVariability: number;
  confidence: number;
  sampleCount: number;
  averageRms: number;
  spectralCentroid: number;
  timestamp: string;
};

export const emptyVoiceAnalysis: VoiceAnalysisSnapshot = {
  volumeLevel: 0,
  voiceStability: 0,
  speechActivity: 0,
  silenceRatio: 100,
  clarityScore: 0,
  noiseLevel: 0,
  toneVariability: 0,
  confidence: 0,
  sampleCount: 0,
  averageRms: 0,
  spectralCentroid: 0,
  timestamp: "2026-01-01T00:00:00.000Z",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

export function analyzeVoiceAudioSamples(samples: VoiceAudioSample[], now = Date.now()): VoiceAnalysisSnapshot {
  const ordered = samples.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp).slice(-80);

  if (ordered.length < 2) {
    return {
      ...emptyVoiceAnalysis,
      sampleCount: ordered.length,
      averageRms: ordered.length ? Math.round(ordered[0].rms * 1000) : 0,
      spectralCentroid: ordered.length ? Math.round(ordered[0].spectralCentroid) : 0,
      timestamp: new Date(now).toISOString(),
    };
  }

  const rmsValues = ordered.map((sample) => sample.rms);
  const peakValues = ordered.map((sample) => sample.peak);
  const centroidValues = ordered.map((sample) => sample.spectralCentroid);
  const zeroCrossingValues = ordered.map((sample) => sample.zeroCrossingRate);
  const highFrequencyValues = ordered.map((sample) => sample.highFrequencyRatio);
  const noiseFloorValues = ordered.map((sample) => sample.noiseFloor);

  const averageRms = average(rmsValues);
  const averagePeak = average(peakValues);
  const averageCentroid = average(centroidValues);
  const averageZeroCrossing = average(zeroCrossingValues);
  const averageHighFrequency = average(highFrequencyValues);
  const averageNoiseFloor = average(noiseFloorValues);
  const rmsVariance = standardDeviation(rmsValues);
  const centroidVariance = standardDeviation(centroidValues);
  const zeroCrossingVariance = standardDeviation(zeroCrossingValues);

  const activeSamples = ordered.filter((sample) => sample.rms > 0.018 || sample.peak > 0.06).length;
  const speechActivity = Math.round(clamp((activeSamples / ordered.length) * 100, 0, 100));
  const silenceRatio = 100 - speechActivity;
  const volumeLevel = Math.round(clamp(averageRms * 420 + averagePeak * 52, 0, 100));
  const noiseLevel = Math.round(clamp(averageNoiseFloor * 760 + averageHighFrequency * 44, 0, 100));
  const toneVariability = Math.round(clamp(centroidVariance / 34 + rmsVariance * 520 + zeroCrossingVariance * 160, 0, 100));
  const voiceStability = Math.round(
    clamp(100 - rmsVariance * 520 - centroidVariance / 42 - averageHighFrequency * 18 - noiseLevel * 0.18, 0, 100),
  );
  const clarityScore = Math.round(
    clamp(
      100 - noiseLevel * 0.58 - averageZeroCrossing * 72 - averageHighFrequency * 26 + volumeLevel * 0.16,
      0,
      100,
    ),
  );
  const confidence = Math.round(
    clamp(ordered.length * 1.5 + speechActivity * 0.28 + volumeLevel * 0.24 + clarityScore * 0.16 - silenceRatio * 0.14, 0, 100),
  );

  return {
    volumeLevel,
    voiceStability,
    speechActivity,
    silenceRatio,
    clarityScore,
    noiseLevel,
    toneVariability,
    confidence,
    sampleCount: ordered.length,
    averageRms: Math.round(averageRms * 1000),
    spectralCentroid: Math.round(averageCentroid),
    timestamp: new Date(now).toISOString(),
  };
}
