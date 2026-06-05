// Real, on-device eye analysis.
//
// This module no longer guesses from raw screen brightness. It consumes per-frame measurements
// produced by the MediaPipe FaceLandmarker (see faceLandmarkerClient.ts) — actual face presence,
// eye openness (blink), gaze direction, head pose — plus an image-based glasses estimate, and
// aggregates them into the dashboard's eye snapshot.
//
// The single most important honesty rule: when no face is in the frame, there is nothing to
// measure, so the snapshot reports faceDetected:false and confidence 0. The cognitive model then
// ignores the eye sensor entirely instead of inventing a "tracking quality" for an empty room.

// One frame of real measurements from the face detector.
export type EyeVisionSample = {
  timestamp: number;
  faceDetected: boolean;
  // 0 = eyes closed, 1 = wide open (mean of both eyes, derived from blink blendshapes).
  eyeOpenness: number;
  // Gaze offset from screen-centre, each -1..1 (left/up .. right/down).
  gazeX: number;
  gazeY: number;
  // Head orientation in degrees (0 = facing the screen).
  headYaw: number;
  headPitch: number;
  // Image-based glasses likelihood for this frame, 0..1.
  glassesScore: number;
  // Mean luminance (0..255) of the detected face region.
  brightness: number;
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
  // Real face-detection outputs:
  faceDetected: boolean;
  facePresence: number; // % of recent frames that contained a face (0..100)
  glassesConfidence: number; // 0..100 likelihood the person wears glasses
  glassesDetected: boolean;
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
  faceDetected: false,
  facePresence: 0,
  glassesConfidence: 0,
  glassesDetected: false,
  timestamp: "2026-01-01T00:00:00.000Z",
};

// Glasses classification thresholds (on the smoothed 0..100 confidence).
export const GLASSES_DETECT_THRESHOLD = 55;
export const GLASSES_UNCERTAIN_THRESHOLD = 40;

export type GlassesVerdict = "detected" | "uncertain" | "none" | "unknown";

export function classifyGlasses(snapshot: EyeAnalysisSnapshot): GlassesVerdict {
  if (!snapshot.faceDetected) return "unknown";
  if (snapshot.glassesConfidence >= GLASSES_DETECT_THRESHOLD) return "detected";
  if (snapshot.glassesConfidence >= GLASSES_UNCERTAIN_THRESHOLD) return "uncertain";
  return "none";
}

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

function lightingScore(luminance: number) {
  // A well-exposed face sits around mid-grey; punish very dark or blown-out frames.
  const idealLuminance = 128;
  const penalty = Math.abs(luminance - idealLuminance) * 0.72;
  return Math.round(clamp(100 - penalty, 0, 100));
}

/**
 * Image-based glasses estimate for a cropped, grayscale eye-band region.
 *
 * Glasses introduce strong, frame-shaped edges across the eyes and a vertical bridge edge, plus
 * frequent specular highlights from the lenses. We approximate that with Sobel edge density and a
 * bright-pixel ratio. It is a heuristic, not a trained classifier — good enough to flag "likely
 * wearing glasses" and stable once smoothed over time, but it is explicitly an estimate.
 *
 * @param gray  Row-major grayscale pixels (0..255) of the eye band.
 */
export function estimateGlassesScore(gray: ArrayLike<number>, width: number, height: number): number {
  if (width < 3 || height < 3 || gray.length < width * height) {
    return 0;
  }

  let strongEdges = 0;
  let highlights = 0;
  let counted = 0;

  const at = (x: number, y: number) => gray[y * width + x];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const tl = at(x - 1, y - 1);
      const tc = at(x, y - 1);
      const tr = at(x + 1, y - 1);
      const ml = at(x - 1, y);
      const mr = at(x + 1, y);
      const bl = at(x - 1, y + 1);
      const bc = at(x, y + 1);
      const br = at(x + 1, y + 1);

      const gx = tr + 2 * mr + br - (tl + 2 * ml + bl);
      const gy = bl + 2 * bc + br - (tl + 2 * tc + tr);
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      if (magnitude > 180) strongEdges += 1;
      if (at(x, y) > 225) highlights += 1;
      counted += 1;
    }
  }

  if (counted === 0) return 0;

  const edgeDensity = strongEdges / counted;
  const highlightRatio = highlights / counted;

  // Bare faces produce a low edge band (eyelids, brows); frames push it well past ~0.16.
  const score = (edgeDensity - 0.06) * 5.5 + highlightRatio * 2.5;
  return clamp(score, 0, 1);
}

/**
 * Aggregate a rolling window of real per-frame measurements into the eye snapshot.
 * Frames where no face was detected still count toward `facePresence`, but only face-present
 * frames inform the eye metrics — so leaving the camera collapses confidence to 0 honestly.
 */
export function analyzeEyeVisionSamples(samples: EyeVisionSample[], now = Date.now()): EyeAnalysisSnapshot {
  const ordered = samples.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp).slice(-60);
  const timestamp = new Date(now).toISOString();

  if (ordered.length === 0) {
    return { ...emptyEyeAnalysis, timestamp };
  }

  const faceFrames = ordered.filter((sample) => sample.faceDetected);
  const facePresence = Math.round((faceFrames.length / ordered.length) * 100);

  // No face anywhere in the window → nothing real to report. This is the fix for the old
  // "walked away but it still shows 100%" behaviour.
  if (faceFrames.length === 0) {
    return { ...emptyEyeAnalysis, facePresence, frameCount: 0, timestamp };
  }

  const openness = faceFrames.map((sample) => sample.eyeOpenness);
  const gazeXValues = faceFrames.map((sample) => sample.gazeX);
  const gazeYValues = faceFrames.map((sample) => sample.gazeY);
  const yawValues = faceFrames.map((sample) => sample.headYaw);
  const pitchValues = faceFrames.map((sample) => sample.headPitch);
  const brightnessValues = faceFrames.map((sample) => sample.brightness);
  const glassesValues = faceFrames.map((sample) => sample.glassesScore);

  const averageLuminance = average(brightnessValues);
  const lightingQuality = lightingScore(averageLuminance);

  // BLINK: count downward openness dips (open -> closed). A blink fully closes the eye, so we
  // look for frames crossing below 0.35 from above. Expressed as 0..100 blink activity.
  let blinkEvents = 0;
  for (let index = 1; index < faceFrames.length; index += 1) {
    if (openness[index - 1] >= 0.35 && openness[index] < 0.35) {
      blinkEvents += 1;
    }
  }
  const windowSeconds = Math.max(
    1,
    (faceFrames[faceFrames.length - 1].timestamp - faceFrames[0].timestamp) / 1000,
  );
  const blinksPerMinute = (blinkEvents / windowSeconds) * 60;
  // ~15-20 blinks/min is normal; >35 reads as elevated. Map to 0..100.
  const blinkProxy = Math.round(clamp(blinksPerMinute * 2.4, 0, 100));

  // GAZE STABILITY: tight gaze + steady head = high. Scatter or head turns pull it down.
  const gazeScatter = standardDeviation(gazeXValues) + standardDeviation(gazeYValues);
  const headScatter = (standardDeviation(yawValues) + standardDeviation(pitchValues)) / 30;
  const gazeStability = Math.round(clamp(100 - gazeScatter * 120 - headScatter * 40, 0, 100));

  // MOTION VARIANCE: frame-to-frame movement of gaze + head, 0..100.
  let motionAccumulator = 0;
  for (let index = 1; index < faceFrames.length; index += 1) {
    const dGaze = Math.hypot(
      gazeXValues[index] - gazeXValues[index - 1],
      gazeYValues[index] - gazeYValues[index - 1],
    );
    const dHead = (Math.abs(yawValues[index] - yawValues[index - 1]) +
      Math.abs(pitchValues[index] - pitchValues[index - 1])) / 30;
    motionAccumulator += dGaze * 100 + dHead * 20;
  }
  const motionVariance = Math.round(
    clamp(motionAccumulator / Math.max(faceFrames.length - 1, 1), 0, 100),
  );

  // FOCUS CONSISTENCY: looking at the screen (gaze centred, head facing forward, eyes open).
  const gazeCentering = clamp(100 - (average(gazeXValues.map(Math.abs)) + average(gazeYValues.map(Math.abs))) * 110, 0, 100);
  const headFacing = clamp(100 - (average(yawValues.map(Math.abs)) + average(pitchValues.map(Math.abs))) * 1.8, 0, 100);
  const eyesOpen = clamp(average(openness) * 100, 0, 100);
  const focusConsistency = Math.round(
    clamp(gazeCentering * 0.45 + headFacing * 0.3 + eyesOpen * 0.15 + gazeStability * 0.1, 0, 100),
  );

  // TRACKING QUALITY: how reliable the tracking itself was this window.
  const trackingQuality = Math.round(
    clamp(facePresence * 0.5 + lightingQuality * 0.25 + eyesOpen * 0.15 + Math.min(faceFrames.length, 20) * 0.5, 0, 100),
  );

  // CONFIDENCE: trust in the above. Driven by face presence, frame count and lighting; this is
  // what gates whether the eye sensor influences the cognitive model at all.
  const confidence = Math.round(
    clamp(facePresence * 0.55 + Math.min(faceFrames.length, 20) * 1.6 + lightingQuality * 0.18, 0, 100),
  );

  const glassesConfidence = Math.round(clamp(average(glassesValues) * 100, 0, 100));

  return {
    trackingQuality,
    gazeStability,
    blinkProxy,
    lightingQuality,
    motionVariance,
    focusConsistency,
    confidence,
    frameCount: faceFrames.length,
    averageLuminance: Math.round(averageLuminance),
    contrastLevel: Math.round(clamp(standardDeviation(brightnessValues), 0, 255)),
    faceDetected: true,
    facePresence,
    glassesConfidence,
    glassesDetected: glassesConfidence >= GLASSES_DETECT_THRESHOLD,
    timestamp,
  };
}
