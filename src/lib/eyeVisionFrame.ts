// Translates one raw MediaPipe FaceLandmarker result into the structured face signals the eye
// analyser consumes (blink/openness, gaze, head pose) plus the normalised eye-band box that the
// component crops for the image-based glasses estimate. Pure data-shaping — no DOM, no canvas.

import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export type FaceSignals = {
  faceDetected: boolean;
  eyeOpenness: number; // 0 closed .. 1 wide open
  gazeX: number; // -1 (subject's left) .. 1 (subject's right)
  gazeY: number; // -1 (up) .. 1 (down)
  headYaw: number; // degrees, 0 = facing screen
  headPitch: number; // degrees
  // Normalised (0..1) bounding box across both eyes + nose bridge, for glasses sampling.
  eyeRegion: { x: number; y: number; width: number; height: number } | null;
};

const EMPTY_SIGNALS: FaceSignals = {
  faceDetected: false,
  eyeOpenness: 0,
  gazeX: 0,
  gazeY: 0,
  headYaw: 0,
  headPitch: 0,
  eyeRegion: null,
};

// Landmark indices spanning both eyes, brows and the nose bridge (MediaPipe 478-point mesh).
const EYE_BAND_LANDMARKS = [33, 133, 159, 145, 263, 362, 386, 374, 168, 6, 70, 300, 107, 336];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function blendshapeMap(result: FaceLandmarkerResult): Map<string, number> {
  const categories = result.faceBlendshapes?.[0]?.categories ?? [];
  const map = new Map<string, number>();
  for (const category of categories) {
    if (category.categoryName) {
      map.set(category.categoryName, category.score);
    }
  }
  return map;
}

// Euler angles (degrees) from MediaPipe's column-major 4x4 facial transformation matrix.
// We only use these to tell "facing the screen" from "turned away" and to measure movement, so
// approximate sign conventions are fine.
function headPose(result: FaceLandmarkerResult): { yaw: number; pitch: number } {
  const data = result.facialTransformationMatrixes?.[0]?.data;
  if (!data || data.length < 16) {
    return { yaw: 0, pitch: 0 };
  }
  const r00 = data[0];
  const r10 = data[1];
  const r20 = data[2];
  const r21 = data[6];
  const r22 = data[10];

  const pitch = Math.atan2(r21, r22);
  const yaw = Math.atan2(-r20, Math.hypot(r21, r22));
  void r00;
  void r10;
  return { yaw: (yaw * 180) / Math.PI, pitch: (pitch * 180) / Math.PI };
}

export function extractFaceSignals(result: FaceLandmarkerResult | null | undefined): FaceSignals {
  const landmarks = result?.faceLandmarks?.[0];
  if (!result || !landmarks || landmarks.length === 0) {
    return EMPTY_SIGNALS;
  }

  const shapes = blendshapeMap(result);
  const blinkLeft = shapes.get("eyeBlinkLeft") ?? 0;
  const blinkRight = shapes.get("eyeBlinkRight") ?? 0;
  const eyeOpenness = clamp(1 - (blinkLeft + blinkRight) / 2, 0, 1);

  const lookRight = ((shapes.get("eyeLookInLeft") ?? 0) + (shapes.get("eyeLookOutRight") ?? 0)) / 2;
  const lookLeft = ((shapes.get("eyeLookOutLeft") ?? 0) + (shapes.get("eyeLookInRight") ?? 0)) / 2;
  const lookUp = ((shapes.get("eyeLookUpLeft") ?? 0) + (shapes.get("eyeLookUpRight") ?? 0)) / 2;
  const lookDown = ((shapes.get("eyeLookDownLeft") ?? 0) + (shapes.get("eyeLookDownRight") ?? 0)) / 2;

  const gazeX = clamp(lookRight - lookLeft, -1, 1);
  const gazeY = clamp(lookDown - lookUp, -1, 1);

  const { yaw, pitch } = headPose(result);

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const index of EYE_BAND_LANDMARKS) {
    const point = landmarks[index];
    if (!point) continue;
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  // Pad the band a little so frames/temples are included, then clamp into the image.
  const padX = (maxX - minX) * 0.12;
  const padY = (maxY - minY) * 0.35;
  const x = clamp(minX - padX, 0, 1);
  const y = clamp(minY - padY, 0, 1);
  const width = clamp(maxX + padX, 0, 1) - x;
  const height = clamp(maxY + padY, 0, 1) - y;

  const eyeRegion = width > 0.02 && height > 0.01 ? { x, y, width, height } : null;

  return { faceDetected: true, eyeOpenness, gazeX, gazeY, headYaw: yaw, headPitch: pitch, eyeRegion };
}
