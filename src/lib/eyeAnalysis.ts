export type EyeFrameSample = {
  timestamp: number;
  luminance: number;
  contrast: number;
  motion: number;
  darkRatio: number;
};

export type EyeAnalysisSnapshot = {
  trackingQuality: number;
  gazeStability: number;
  blinkProxy: number;
  lightingQuality: number;
  motionVariance: number;
  focusConsistency: number;
  confidence: number;
  frameCount: number;
  averageLuminance: number;
  contrastLevel: number;
  timestamp: string;
};

export const emptyEyeAnalysis: EyeAnalysisSnapshot = {
  trackingQuality: 0,
  gazeStability: 0,
  blinkProxy: 0,
  lightingQuality: 0,
  motionVariance: 0,
  focusConsistency: 0,
  confidence: 0,
  frameCount: 0,
  averageLuminance: 0,
  contrastLevel: 0,
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

function lightingScore(luminance: number, contrast: number) {
  const idealLuminance = 126;
  const luminancePenalty = Math.abs(luminance - idealLuminance) * 0.68;
  const contrastBonus = clamp(contrast * 1.9, 0, 36);
  return Math.round(clamp(100 - luminancePenalty + contrastBonus, 0, 100));
}

export function analyzeEyeFrameSamples(samples: EyeFrameSample[], now = Date.now()): EyeAnalysisSnapshot {
  const ordered = samples.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp).slice(-40);

  if (ordered.length < 2) {
    return {
      ...emptyEyeAnalysis,
      frameCount: ordered.length,
      averageLuminance: ordered.length ? Math.round(ordered[0].luminance) : 0,
      contrastLevel: ordered.length ? Math.round(ordered[0].contrast) : 0,
      timestamp: new Date(now).toISOString(),
    };
  }

  const luminanceValues = ordered.map((sample) => sample.luminance);
  const contrastValues = ordered.map((sample) => sample.contrast);
  const motionValues = ordered.map((sample) => sample.motion);
  const darkValues = ordered.map((sample) => sample.darkRatio);

  const averageLuminance = average(luminanceValues);
  const averageContrast = average(contrastValues);
  const averageMotion = average(motionValues);
  const motionVariance = standardDeviation(motionValues);
  const luminanceVariance = standardDeviation(luminanceValues);
  const lightingQuality = lightingScore(averageLuminance, averageContrast);
  const contrastScore = clamp(averageContrast * 2.1, 0, 100);

  let blinkEvents = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous.luminance - current.luminance > 18 || current.darkRatio > average(darkValues) + 0.16) {
      blinkEvents += 1;
    }
  }

  const blinkProxy = Math.round(clamp((blinkEvents / Math.max(ordered.length - 1, 1)) * 100, 0, 100));
  const gazeStability = Math.round(clamp(100 - averageMotion * 2.4 - motionVariance * 2.7, 0, 100));
  const focusConsistency = Math.round(
    clamp(gazeStability * 0.46 + lightingQuality * 0.28 + contrastScore * 0.18 - blinkProxy * 0.18, 0, 100),
  );
  const trackingQuality = Math.round(
    clamp(lightingQuality * 0.36 + gazeStability * 0.34 + contrastScore * 0.2 + ordered.length * 1.2, 0, 100),
  );
  const confidence = Math.round(
    clamp(ordered.length * 2.4 + lightingQuality * 0.24 + gazeStability * 0.24 - luminanceVariance * 0.18, 0, 100),
  );

  return {
    trackingQuality,
    gazeStability,
    blinkProxy,
    lightingQuality,
    motionVariance: Math.round(clamp(motionVariance * 2.2, 0, 100)),
    focusConsistency,
    confidence,
    frameCount: ordered.length,
    averageLuminance: Math.round(averageLuminance),
    contrastLevel: Math.round(averageContrast),
    timestamp: new Date(now).toISOString(),
  };
}
