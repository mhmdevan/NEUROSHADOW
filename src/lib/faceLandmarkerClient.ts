// Browser-only loader for the MediaPipe FaceLandmarker model.
//
// This is the real, on-device face/eye detector that replaces the old brightness-only
// "eye" proxy. It runs entirely in the browser (WASM + WebGL) — camera frames never leave
// the device. The heavy `@mediapipe/tasks-vision` bundle and its WASM are loaded lazily on
// first use (dynamic import + CDN fileset), so they stay out of the server/SSR path and the
// initial page bundle.

import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";

// Pin the WASM fileset and model to the exact installed package version so the runtime glue
// and the WASM binaries never drift apart.
const TASKS_VISION_VERSION = "0.10.35";
const WASM_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type FaceLandmarkerHandle = FaceLandmarkerType;

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null;

async function createLandmarker(): Promise<FaceLandmarkerType> {
  // Dynamic import keeps the multi-MB vision bundle off the server and out of the first paint.
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

  const baseConfig = {
    runningMode: "VIDEO" as const,
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  };

  // Prefer GPU (WebGL) for speed; transparently fall back to CPU when WebGL is unavailable
  // (e.g. some VMs / locked-down browsers) so detection still works rather than failing.
  try {
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "GPU" },
      ...baseConfig,
    });
  } catch {
    return FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "CPU" },
      ...baseConfig,
    });
  }
}

// Returns a shared, lazily-initialised FaceLandmarker. Safe to call repeatedly; the model is
// downloaded and compiled only once per page. If loading fails (offline, blocked CDN, no WebGL),
// the promise rejects and the caller should surface an explicit "model unavailable" state — we
// never silently fall back to fabricated readings.
export function getFaceLandmarker(): Promise<FaceLandmarkerType> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("FaceLandmarker is only available in the browser."));
  }
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((error) => {
      // Reset so a later retry (e.g. after reconnecting) can attempt a fresh load.
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
}
