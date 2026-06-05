"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Eye, Keyboard, Mic2, MousePointer2 } from "lucide-react";
import type { SensorPrivacySettings } from "@/lib/privacy";
import {
  analyzeEyeVisionSamples,
  classifyGlasses,
  emptyEyeAnalysis,
  estimateGlassesScore,
  type EyeAnalysisSnapshot,
  type EyeVisionSample,
} from "@/lib/eyeAnalysis";
import { getFaceLandmarker, type FaceLandmarkerHandle } from "@/lib/faceLandmarkerClient";
import { extractFaceSignals } from "@/lib/eyeVisionFrame";
import {
  analyzeMouseSamples,
  emptyMouseAnalysis,
  type MouseAnalysisSnapshot,
  type MouseSample,
} from "@/lib/mouseAnalysis";
import {
  analyzeVoiceAudioSamples,
  emptyVoiceAnalysis,
  type VoiceAnalysisSnapshot,
  type VoiceAudioSample,
} from "@/lib/voiceAnalysis";
import { secureFetch } from "@/lib/clientSecurity";
import { useLanguage } from "./LanguageProvider";

type LiveInputMonitorProps = {
  sessionId: string;
  privacySettings: SensorPrivacySettings;
};

// Every live signal is real: a measured value plus its own rolling history. When the underlying
// sensor is off there is no fabricated fallback — the value is 0 and the sparkline is flat.
type LiveSignal = {
  title: string;
  value: string;
  unit: string;
  delta: string;
  points: number[];
};

const signalIcons = [Keyboard, MousePointer2, Eye, Mic2];

function sparkline(points: number[]) {
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 82;
      const y = 32 - (point / 100) * 28;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function zeroSparkPoints() {
  return Array.from({ length: 12 }, () => 0);
}

function captureVoiceSample(analyser: AnalyserNode, sampleRate: number): VoiceAudioSample {
  const timeData = new Uint8Array(analyser.fftSize);
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(timeData);
  analyser.getByteFrequencyData(frequencyData);

  let squareSum = 0;
  let peak = 0;
  let crossings = 0;
  const amplitudes: number[] = [];
  let previous = (timeData[0] - 128) / 128;

  for (let index = 0; index < timeData.length; index += 1) {
    const amplitude = (timeData[index] - 128) / 128;
    const absolute = Math.abs(amplitude);
    squareSum += amplitude * amplitude;
    peak = Math.max(peak, absolute);
    amplitudes.push(absolute);
    if (index > 0 && Math.sign(amplitude) !== Math.sign(previous) && Math.abs(amplitude - previous) > 0.01) {
      crossings += 1;
    }
    previous = amplitude;
  }

  let totalEnergy = 0;
  let weightedFrequency = 0;
  let highFrequencyEnergy = 0;
  const binWidth = sampleRate / 2 / Math.max(frequencyData.length, 1);
  const highFrequencyStart = Math.floor(frequencyData.length * 0.55);

  for (let index = 0; index < frequencyData.length; index += 1) {
    const energy = frequencyData[index] / 255;
    totalEnergy += energy;
    weightedFrequency += energy * index * binWidth;
    if (index >= highFrequencyStart) {
      highFrequencyEnergy += energy;
    }
  }

  const sortedAmplitudes = [...amplitudes].sort((a, b) => a - b);
  const floorCount = Math.max(1, Math.floor(sortedAmplitudes.length * 0.2));
  const noiseFloor = sortedAmplitudes.slice(0, floorCount).reduce((sum, value) => sum + value, 0) / floorCount;

  return {
    timestamp: Date.now(),
    rms: Math.sqrt(squareSum / Math.max(timeData.length, 1)),
    peak,
    zeroCrossingRate: crossings / Math.max(timeData.length - 1, 1),
    spectralCentroid: totalEnergy > 0 ? weightedFrequency / totalEnergy : 0,
    highFrequencyRatio: totalEnergy > 0 ? highFrequencyEnergy / totalEnergy : 0,
    noiseFloor,
  };
}

export function LiveInputMonitor({ sessionId, privacySettings }: LiveInputMonitorProps) {
  const { t } = useLanguage();
  const samplesRef = useRef<MouseSample[]>([]);
  const clickCountRef = useRef(0);
  const wheelCountRef = useRef(0);
  const lastPointerRef = useRef<MouseSample | null>(null);
  const keystrokesRef = useRef<number[]>([]);
  const [keyboardRate, setKeyboardRate] = useState(0);
  const [keyboardPoints, setKeyboardPoints] = useState<number[]>(() => Array.from({ length: 12 }, () => 0));
  const lastStoredSignatureRef = useRef("");
  const eyeSamplesRef = useRef<EyeVisionSample[]>([]);
  const eyeDetectTimestampRef = useRef(0);
  const lastStoredEyeSignatureRef = useRef("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceSamplesRef = useRef<VoiceAudioSample[]>([]);
  const lastStoredVoiceSignatureRef = useRef("");
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [mouseAnalysis, setMouseAnalysis] = useState<MouseAnalysisSnapshot>(emptyMouseAnalysis);
  const [mousePoints, setMousePoints] = useState<number[]>(() => Array.from({ length: 12 }, () => 0));
  const [storageState, setStorageState] = useState<"idle" | "stored" | "mock">("idle");
  const [eyeAnalysis, setEyeAnalysis] = useState<EyeAnalysisSnapshot>(emptyEyeAnalysis);
  const [eyePoints, setEyePoints] = useState<number[]>(() => Array.from({ length: 12 }, () => 0));
  const [eyeStorageState, setEyeStorageState] = useState<"idle" | "stored" | "mock">("idle");
  const [eyeCameraState, setEyeCameraState] = useState<
    "inactive" | "requesting" | "active" | "unsupported" | "error"
  >("inactive");
  // Lifecycle of the on-device face-detection model (downloaded + compiled once, lazily).
  const [eyeModelState, setEyeModelState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysisSnapshot>(emptyVoiceAnalysis);
  const [voicePoints, setVoicePoints] = useState<number[]>(() => Array.from({ length: 12 }, () => 0));
  const [voiceStorageState, setVoiceStorageState] = useState<"idle" | "stored" | "mock">("idle");
  const [voiceMicState, setVoiceMicState] = useState<"inactive" | "requesting" | "active" | "unsupported" | "error">(
    "inactive",
  );

  useEffect(() => {
    if (!privacySettings.mouse) {
      samplesRef.current = [];
      clickCountRef.current = 0;
      wheelCountRef.current = 0;
      lastPointerRef.current = null;
      keystrokesRef.current = [];
      const resetTimer = window.setTimeout(() => {
        setMouseAnalysis(emptyMouseAnalysis);
        setMousePoints(zeroSparkPoints());
        setKeyboardRate(0);
        setKeyboardPoints(zeroSparkPoints());
        setStorageState("idle");
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    function recordPointer(event: PointerEvent) {
      const now = Date.now();
      const last = lastPointerRef.current;
      if (last && now - last.timestamp < 55 && Math.hypot(event.clientX - last.x, event.clientY - last.y) < 3) {
        return;
      }

      const sample = { x: event.clientX, y: event.clientY, timestamp: now };
      lastPointerRef.current = sample;
      samplesRef.current = [...samplesRef.current, sample].filter((item) => now - item.timestamp <= 15000).slice(-220);
    }

    function recordClick() {
      clickCountRef.current += 1;
    }

    function recordWheel() {
      wheelCountRef.current += 1;
    }

    // Aggregate keystroke RATE only — timestamps of keydown events, never which keys.
    function recordKey() {
      const now = Date.now();
      keystrokesRef.current = [...keystrokesRef.current, now].filter((ts) => now - ts <= 60000).slice(-600);
    }

    window.addEventListener("pointermove", recordPointer, { passive: true });
    window.addEventListener("pointerdown", recordClick, { passive: true });
    window.addEventListener("wheel", recordWheel, { passive: true });
    window.addEventListener("keydown", recordKey, { passive: true });
    return () => {
      window.removeEventListener("pointermove", recordPointer);
      window.removeEventListener("pointerdown", recordClick);
      window.removeEventListener("wheel", recordWheel);
      window.removeEventListener("keydown", recordKey);
    };
  }, [privacySettings.mouse]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!privacySettings.mouse) {
        setMouseAnalysis(emptyMouseAnalysis);
        return;
      }
      const now = Date.now();
      const next = analyzeMouseSamples(samplesRef.current, {
        clickCount: clickCountRef.current,
        wheelCount: wheelCountRef.current,
      });
      setMouseAnalysis(next);
      setMousePoints((current) => [...current.slice(-11), Math.min(100, Math.round(next.actionsPerMinute / 8))]);

      // Real keyboard rate: keydown events in the trailing 60s window = keys/min.
      const recentKeys = keystrokesRef.current.filter((ts) => now - ts <= 60000);
      keystrokesRef.current = recentKeys;
      setKeyboardRate(recentKeys.length);
      setKeyboardPoints((current) => [...current.slice(-11), Math.min(100, Math.round(recentKeys.length * 1.2))]);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [privacySettings.mouse]);

  useEffect(() => {
    if (!privacySettings.mouse) {
      return;
    }

    if (mouseAnalysis.confidence < 18 || mouseAnalysis.sampleCount < 4) {
      return;
    }

    const bucket = Math.floor(Date.now() / 12000);
    const signature = `${bucket}-${mouseAnalysis.sampleCount}-${mouseAnalysis.distancePx}`;
    if (signature === lastStoredSignatureRef.current) {
      return;
    }
    lastStoredSignatureRef.current = signature;

    const controller = new AbortController();
    secureFetch("/api/mouse-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...mouseAnalysis, sessionId }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { mode?: "database" | "mock"; stored?: boolean }) => {
        setStorageState(payload.stored ? "stored" : payload.mode === "mock" ? "mock" : "idle");
      })
      .catch(() => setStorageState("mock"));

    return () => controller.abort();
  }, [mouseAnalysis, privacySettings.mouse, sessionId]);

  const releaseEyeStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    eyeSamplesRef.current = [];
    eyeDetectTimestampRef.current = 0;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopEyeAnalysis = useCallback(() => {
    releaseEyeStream();
    setEyeCameraState("inactive");
  }, [releaseEyeStream]);

  async function startEyeAnalysis() {
    if (!privacySettings.eye) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setEyeCameraState("unsupported");
      return;
    }

    setEyeCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setEyeCameraState("active");
      // The detection effect (triggered by "active") will load the model and flip this to
      // "ready"/"unavailable". Setting it here (in an event handler, not synchronously in an
      // effect) shows the loading state immediately without cascading renders.
      setEyeModelState((state) => (state === "ready" ? state : "loading"));
    } catch {
      setEyeCameraState("error");
    }
  }

  const releaseVoiceStream = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    analyserRef.current = null;
    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close().catch(() => undefined);
    }
  }, []);

  const stopVoiceAnalysis = useCallback(() => {
    releaseVoiceStream();
    setVoiceMicState("inactive");
  }, [releaseVoiceStream]);

  async function startVoiceAnalysis() {
    if (!privacySettings.voice) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceMicState("unsupported");
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) {
      setVoiceMicState("unsupported");
      return;
    }

    setVoiceMicState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      const audioContext = new AudioContextConstructor();
      // Start (and keep) the context running — created inside a click handler, so this is allowed.
      await audioContext.resume().catch(() => undefined);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.74;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      audioStreamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setVoiceMicState("active");
    } catch {
      setVoiceMicState("error");
    }
  }

  useEffect(() => () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close().catch(() => undefined);
    }
  }, []);

  // Keep analysis alive across tab switches / background work. Active camera/mic streams already
  // exempt the tab from heavy timer throttling, but some browsers suspend the AudioContext or
  // pause the video on blur — so we resume both whenever the tab becomes visible again.
  useEffect(() => {
    function handleVisibility() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      const audioContext = audioContextRef.current;
      if (audioContext && audioContext.state === "suspended") {
        void audioContext.resume().catch(() => undefined);
      }
      const video = videoRef.current;
      if (video && mediaStreamRef.current && video.paused) {
        void video.play().catch(() => undefined);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!privacySettings.eye) {
      releaseEyeStream();
      const resetTimer = window.setTimeout(() => {
        setEyeCameraState("inactive");
        setEyeModelState("idle");
        setEyeAnalysis(emptyEyeAnalysis);
        setEyePoints(zeroSparkPoints());
        setEyeStorageState("idle");
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
  }, [privacySettings.eye, releaseEyeStream]);

  useEffect(() => {
    if (!privacySettings.voice) {
      releaseVoiceStream();
      const resetTimer = window.setTimeout(() => {
        setVoiceMicState("inactive");
        setVoiceAnalysis(emptyVoiceAnalysis);
        setVoicePoints(zeroSparkPoints());
        setVoiceStorageState("idle");
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
  }, [privacySettings.voice, releaseVoiceStream]);

  // Real face/eye detection loop. Each tick runs the MediaPipe FaceLandmarker on the current
  // camera frame to measure actual face presence, blink, gaze and head pose, plus an image-based
  // glasses estimate. When no face is present, the snapshot honestly reports confidence 0 instead
  // of inventing numbers — so stepping out of frame is reflected immediately.
  useEffect(() => {
    if (eyeCameraState !== "active" || !privacySettings.eye) {
      return;
    }

    let cancelled = false;
    let timer = 0;

    function sampleFrame(landmarker: FaceLandmarkerHandle) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      // detectForVideo requires strictly-increasing timestamps.
      let timestampMs = performance.now();
      if (timestampMs <= eyeDetectTimestampRef.current) {
        timestampMs = eyeDetectTimestampRef.current + 1;
      }
      eyeDetectTimestampRef.current = timestampMs;

      const result = landmarker.detectForVideo(video, timestampMs);
      const signals = extractFaceSignals(result);

      // Glasses + lighting need pixels: crop the detected eye band and inspect it on a tiny canvas.
      let glassesScore = 0;
      let brightness = 0;
      if (signals.faceDetected && signals.eyeRegion && canvas) {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const sx = signals.eyeRegion.x * vw;
          const sy = signals.eyeRegion.y * vh;
          const sw = Math.max(1, signals.eyeRegion.width * vw);
          const sh = Math.max(1, signals.eyeRegion.height * vh);
          const targetW = 96;
          const targetH = Math.max(8, Math.round((targetW * sh) / sw));
          canvas.width = targetW;
          canvas.height = targetH;
          context.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
          const pixels = context.getImageData(0, 0, targetW, targetH).data;
          const gray = new Uint8ClampedArray(targetW * targetH);
          let sum = 0;
          for (let index = 0, pixelIndex = 0; index < pixels.length; index += 4, pixelIndex += 1) {
            const luminance = Math.round(
              pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114,
            );
            gray[pixelIndex] = luminance;
            sum += luminance;
          }
          brightness = sum / Math.max(gray.length, 1);
          glassesScore = estimateGlassesScore(gray, targetW, targetH);
        }
      }

      const now = Date.now();
      const sample: EyeVisionSample = {
        timestamp: now,
        faceDetected: signals.faceDetected,
        eyeOpenness: signals.eyeOpenness,
        gazeX: signals.gazeX,
        gazeY: signals.gazeY,
        headYaw: signals.headYaw,
        headPitch: signals.headPitch,
        glassesScore,
        brightness,
      };
      eyeSamplesRef.current = [...eyeSamplesRef.current, sample]
        .filter((item) => now - item.timestamp <= 6000)
        .slice(-60);
      const next = analyzeEyeVisionSamples(eyeSamplesRef.current, now);
      setEyeAnalysis(next);
      setEyePoints((current) => [...current.slice(-11), next.faceDetected ? next.trackingQuality : 0]);
    }

    function loop(landmarker: FaceLandmarkerHandle) {
      if (cancelled) return;
      try {
        sampleFrame(landmarker);
      } catch {
        // A single dropped frame shouldn't tear down the whole loop.
      }
      // setTimeout keeps firing while the tab is backgrounded (≈1fps) so analysis continues; the
      // foreground runs much faster for a smooth preview.
      const hidden = typeof document !== "undefined" && document.visibilityState !== "visible";
      timer = window.setTimeout(() => loop(landmarker), hidden ? 1000 : 130);
    }

    getFaceLandmarker()
      .then((landmarker) => {
        if (cancelled) return;
        setEyeModelState("ready");
        loop(landmarker);
      })
      .catch(() => {
        if (!cancelled) setEyeModelState("unavailable");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [eyeCameraState, privacySettings.eye]);

  useEffect(() => {
    if (!privacySettings.eye) {
      return;
    }

    if (eyeAnalysis.confidence < 18 || eyeAnalysis.frameCount < 4) {
      return;
    }

    const bucket = Math.floor(Date.now() / 12000);
    const signature = `${bucket}-${eyeAnalysis.frameCount}-${eyeAnalysis.trackingQuality}-${eyeAnalysis.averageLuminance}`;
    if (signature === lastStoredEyeSignatureRef.current) {
      return;
    }
    lastStoredEyeSignatureRef.current = signature;

    const controller = new AbortController();
    secureFetch("/api/eye-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...eyeAnalysis, sessionId }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { mode?: "database" | "mock"; stored?: boolean }) => {
        setEyeStorageState(payload.stored ? "stored" : payload.mode === "mock" ? "mock" : "idle");
      })
      .catch(() => setEyeStorageState("mock"));

    return () => controller.abort();
  }, [eyeAnalysis, privacySettings.eye, sessionId]);

  useEffect(() => {
    if (voiceMicState !== "active" || !privacySettings.voice) {
      return;
    }

    const timer = window.setInterval(() => {
      const analyser = analyserRef.current;
      const audioContext = audioContextRef.current;
      if (!analyser || !audioContext) {
        return;
      }

      const sample = captureVoiceSample(analyser, audioContext.sampleRate);
      const now = Date.now();
      voiceSamplesRef.current = [...voiceSamplesRef.current, sample]
        .filter((item) => now - item.timestamp <= 20000)
        .slice(-80);
      const next = analyzeVoiceAudioSamples(voiceSamplesRef.current, now);
      setVoiceAnalysis(next);
      setVoicePoints((current) => [...current.slice(-11), next.voiceStability]);
    }, 650);

    return () => window.clearInterval(timer);
  }, [privacySettings.voice, voiceMicState]);

  useEffect(() => {
    if (!privacySettings.voice) {
      return;
    }

    if (voiceAnalysis.confidence < 18 || voiceAnalysis.sampleCount < 4) {
      return;
    }

    const bucket = Math.floor(Date.now() / 12000);
    const signature = `${bucket}-${voiceAnalysis.sampleCount}-${voiceAnalysis.voiceStability}-${voiceAnalysis.averageRms}`;
    if (signature === lastStoredVoiceSignatureRef.current) {
      return;
    }
    lastStoredVoiceSignatureRef.current = signature;

    const controller = new AbortController();
    secureFetch("/api/voice-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...voiceAnalysis, sessionId }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { mode?: "database" | "mock"; stored?: boolean }) => {
        setVoiceStorageState(payload.stored ? "stored" : payload.mode === "mock" ? "mock" : "idle");
      })
      .catch(() => setVoiceStorageState("mock"));

    return () => controller.abort();
  }, [privacySettings.voice, sessionId, voiceAnalysis]);

  const signals = useMemo<LiveSignal[]>(() => {
    const flat = zeroSparkPoints();
    const eyeLive = privacySettings.eye && eyeCameraState === "active" && eyeAnalysis.faceDetected;
    const voiceLive = privacySettings.voice && voiceMicState === "active" && voiceAnalysis.sampleCount > 0;
    return [
      {
        title: t.liveInput.keyboard,
        value: privacySettings.mouse ? String(keyboardRate) : "0",
        unit: t.liveInput.keys,
        delta: privacySettings.mouse
          ? keyboardRate > 0
            ? t.status.monitoring
            : t.status.pending
          : t.privacy.disabled,
        points: privacySettings.mouse ? keyboardPoints : flat,
      },
      {
        title: t.liveInput.mouse,
        value: privacySettings.mouse ? String(mouseAnalysis.actionsPerMinute) : "0",
        unit: t.liveInput.actions,
        delta: privacySettings.mouse
          ? mouseAnalysis.confidence > 18
            ? `${mouseAnalysis.confidence}% ${t.liveInput.confidence}`
            : t.status.pending
          : t.privacy.disabled,
        points: privacySettings.mouse ? mousePoints : flat,
      },
      {
        title: t.liveInput.eye,
        value: eyeLive ? String(eyeAnalysis.trackingQuality) : "0",
        unit: t.liveInput.quality,
        delta: !privacySettings.eye
          ? t.privacy.disabled
          : eyeCameraState !== "active"
            ? t.liveInput.cameraInactive
            : eyeModelState === "loading"
              ? t.liveInput.modelLoading
              : eyeModelState === "unavailable"
                ? t.liveInput.modelUnavailable
                : eyeAnalysis.faceDetected
                  ? `${eyeAnalysis.confidence}% ${t.liveInput.confidence}`
                  : t.liveInput.faceMissing,
        points: eyeLive ? eyePoints : flat,
      },
      {
        title: t.liveInput.voice,
        value: voiceLive ? String(voiceAnalysis.voiceStability) : "0",
        unit: t.liveInput.quality,
        delta: !privacySettings.voice
          ? t.privacy.disabled
          : voiceMicState === "active"
            ? voiceAnalysis.confidence > 18
              ? `${voiceAnalysis.confidence}% ${t.liveInput.confidence}`
              : t.status.monitoring
            : t.liveInput.microphoneInactive,
        points: voiceLive ? voicePoints : flat,
      },
    ];
  }, [
    eyeAnalysis.confidence,
    eyeAnalysis.faceDetected,
    eyeAnalysis.trackingQuality,
    eyeCameraState,
    eyeModelState,
    eyePoints,
    keyboardPoints,
    keyboardRate,
    mouseAnalysis.actionsPerMinute,
    mouseAnalysis.confidence,
    mousePoints,
    privacySettings.eye,
    privacySettings.mouse,
    privacySettings.voice,
    t,
    voiceAnalysis.confidence,
    voiceAnalysis.sampleCount,
    voiceAnalysis.voiceStability,
    voiceMicState,
    voicePoints,
  ]);

  const eyeStatusText = !privacySettings.eye
    ? t.privacy.disabled
    : eyeCameraState === "requesting"
      ? t.liveInput.cameraPending
      : eyeCameraState === "unsupported"
        ? t.liveInput.cameraUnsupported
        : eyeCameraState === "error"
          ? t.liveInput.cameraError
          : eyeCameraState !== "active"
            ? t.liveInput.cameraInactive
            : eyeModelState === "loading"
              ? t.liveInput.modelLoading
              : eyeModelState === "unavailable"
                ? t.liveInput.modelUnavailable
                : eyeAnalysis.faceDetected
                  ? t.status.monitoring
                  : t.liveInput.faceMissing;

  // Human-readable glasses verdict for the camera overlay and the metric grid.
  const glassesVerdict = classifyGlasses(eyeAnalysis);
  const glassesLabel =
    glassesVerdict === "detected"
      ? t.liveInput.glassesYes
      : glassesVerdict === "uncertain"
        ? t.liveInput.glassesUncertain
        : glassesVerdict === "none"
          ? t.liveInput.glassesNo
          : t.liveInput.glassesUnknown;

  const voiceStatusText =
    !privacySettings.voice
      ? t.privacy.disabled
      : voiceMicState === "active"
      ? voiceAnalysis.confidence > 18
        ? t.status.monitoring
        : t.liveInput.calibrateVoice
      : voiceMicState === "requesting"
        ? t.liveInput.microphonePending
        : voiceMicState === "unsupported"
          ? t.liveInput.microphoneUnsupported
          : voiceMicState === "error"
          ? t.liveInput.microphoneError
            : t.liveInput.microphoneInactive;

  const needsEyePermission = privacySettings.eye && eyeCameraState !== "active";
  const needsVoicePermission = privacySettings.voice && voiceMicState !== "active";

  return (
    <section className="panel live-input-panel" id="live-monitor" data-nav-section aria-labelledby="live-monitor-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.liveInput.eyebrow}</p>
          <h2 id="live-monitor-title">{t.liveInput.title}</h2>
        </div>
        <span className="panel__badge">{t.liveInput.badge}</span>
      </div>
      <p className="live-input-hint">{t.liveInput.backgroundHint}</p>
      {needsEyePermission || needsVoicePermission ? (
        <div className="sensor-permission-panel">
          <div>
            <p className="eyebrow">{t.liveInput.permissionEyebrow}</p>
            <h3>{t.liveInput.permissionTitle}</h3>
            <p>{t.liveInput.permissionBody}</p>
          </div>
          <div className="sensor-permission-actions">
            {privacySettings.eye ? (
              <button
                className="secondary-button"
                type="button"
                onClick={eyeCameraState === "active" ? stopEyeAnalysis : startEyeAnalysis}
              >
                <Camera size={18} />
                {eyeCameraState === "active" ? t.liveInput.stopEye : t.liveInput.startEye}
              </button>
            ) : null}
            {privacySettings.voice ? (
              <button
                className="secondary-button"
                type="button"
                onClick={voiceMicState === "active" ? stopVoiceAnalysis : startVoiceAnalysis}
              >
                <Mic2 size={18} />
                {voiceMicState === "active" ? t.liveInput.stopVoice : t.liveInput.startVoice}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="live-input-grid">
        {signals.map((signal, index) => {
          const Icon = signalIcons[index];
          const points = signal.points;
          return (
            <article className="live-input-card" key={signal.title}>
              <div className="live-input-card__top">
                <Icon size={18} />
                <span>{signal.delta}</span>
              </div>
              <strong>{signal.title}</strong>
              <div className="live-input-card__value">
                {signal.value}
                <span>{signal.unit}</span>
              </div>
              <svg viewBox="0 0 82 36" aria-hidden="true">
                <polyline points={sparkline(points)} fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </article>
          );
        })}
      </div>
      <div className="mouse-analysis-panel">
        <div>
          <p className="eyebrow">{t.liveInput.realMouse}</p>
          <h3>
            {!privacySettings.mouse
              ? t.privacy.disabled
              : mouseAnalysis.confidence > 18
                ? t.status.monitoring
                : t.liveInput.moveToCalibrate}
          </h3>
          <p>{t.liveInput.privacy}</p>
        </div>
        <div className="mouse-analysis-grid">
          <span>
            {t.liveInput.distance}
            <strong>{mouseAnalysis.distancePx}px</strong>
          </span>
          <span>
            {t.liveInput.velocity}
            <strong>{mouseAnalysis.averageVelocity}px/s</strong>
          </span>
          <span>
            {t.liveInput.idle}
            <strong>{Math.round(mouseAnalysis.idleMs / 100) / 10}s</strong>
          </span>
          <span>
            {t.liveInput.jitter}
            <strong>{mouseAnalysis.jitterScore}%</strong>
          </span>
          <span>
            {t.liveInput.directionChanges}
            <strong>{mouseAnalysis.directionChanges}</strong>
          </span>
          <span>
            {t.liveInput.stability}
            <strong>{mouseAnalysis.stabilityScore}%</strong>
          </span>
          <span>
            {t.liveInput.confidence}
            <strong>{mouseAnalysis.confidence}%</strong>
          </span>
          <span>
            {storageState === "stored" ? t.liveInput.stored : t.liveInput.localOnly}
            <strong>{mouseAnalysis.sampleCount}</strong>
          </span>
        </div>
      </div>
      <div className="mouse-analysis-panel eye-analysis-panel">
        <div>
          <p className="eyebrow">{t.liveInput.realEye}</p>
          <h3>{eyeStatusText}</h3>
          <p>{t.liveInput.eyePrivacy}</p>
          <div className="eye-analysis-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={eyeCameraState === "active" ? stopEyeAnalysis : startEyeAnalysis}
              disabled={eyeCameraState === "requesting" || !privacySettings.eye}
            >
              <Camera size={16} />
              {eyeCameraState === "requesting"
                ? t.liveInput.cameraPending
                : eyeCameraState === "active"
                  ? t.liveInput.stopEye
                  : t.liveInput.startEye}
            </button>
          </div>
          {eyeModelState === "unavailable" && eyeCameraState === "active" ? (
            <p className="eye-vision-error">{t.liveInput.modelUnavailable}</p>
          ) : null}
          <div className="eye-vision-stage">
            <video ref={videoRef} className="eye-vision-feed" muted playsInline aria-hidden="true" />
            {eyeCameraState === "active" ? (
              <div
                className={`eye-vision-overlay ${
                  eyeModelState === "loading"
                    ? "is-loading"
                    : eyeAnalysis.faceDetected
                      ? "is-detected"
                      : "is-missing"
                }`}
              >
                <span className="eye-vision-overlay__face">
                  {eyeModelState === "loading"
                    ? t.liveInput.modelLoading
                    : eyeAnalysis.faceDetected
                      ? t.liveInput.faceDetected
                      : t.liveInput.faceMissing}
                </span>
                {eyeAnalysis.faceDetected ? (
                  <span className="eye-vision-overlay__glasses">
                    {t.liveInput.glasses}: {glassesLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            <canvas ref={canvasRef} className="analysis-canvas" aria-hidden="true" />
          </div>
        </div>
        <div className="mouse-analysis-grid">
          <span>
            {t.liveInput.trackingQuality}
            <strong>{eyeAnalysis.trackingQuality}%</strong>
          </span>
          <span>
            {t.liveInput.gazeStability}
            <strong>{eyeAnalysis.gazeStability}%</strong>
          </span>
          <span>
            {t.liveInput.blinkProxy}
            <strong>{eyeAnalysis.blinkProxy}%</strong>
          </span>
          <span>
            {t.liveInput.lighting}
            <strong>{eyeAnalysis.lightingQuality}%</strong>
          </span>
          <span>
            {t.liveInput.motionVariance}
            <strong>{eyeAnalysis.motionVariance}%</strong>
          </span>
          <span>
            {t.liveInput.focusConsistency}
            <strong>{eyeAnalysis.focusConsistency}%</strong>
          </span>
          <span>
            {t.liveInput.facePresence}
            <strong>{eyeAnalysis.facePresence}%</strong>
          </span>
          <span>
            {t.liveInput.glasses}
            <strong>{glassesLabel}</strong>
          </span>
          <span>
            {t.liveInput.confidence}
            <strong>{eyeAnalysis.confidence}%</strong>
          </span>
          <span>
            {eyeStorageState === "stored" ? t.liveInput.eyeStored : t.liveInput.eyeLocalOnly}
            <strong>{eyeAnalysis.frameCount}</strong>
          </span>
        </div>
      </div>
      <div className="mouse-analysis-panel voice-analysis-panel">
        <div>
          <p className="eyebrow">{t.liveInput.realVoice}</p>
          <h3>{voiceStatusText}</h3>
          <p>{t.liveInput.voicePrivacy}</p>
          <div className="eye-analysis-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={voiceMicState === "active" ? stopVoiceAnalysis : startVoiceAnalysis}
              disabled={voiceMicState === "requesting" || !privacySettings.voice}
            >
              <Mic2 size={16} />
              {voiceMicState === "requesting"
                ? t.liveInput.microphonePending
                : voiceMicState === "active"
                  ? t.liveInput.stopVoice
                  : t.liveInput.startVoice}
            </button>
          </div>
        </div>
        <div className="mouse-analysis-grid">
          <span>
            {t.liveInput.volumeLevel}
            <strong>{voiceAnalysis.volumeLevel}%</strong>
          </span>
          <span>
            {t.liveInput.voiceStability}
            <strong>{voiceAnalysis.voiceStability}%</strong>
          </span>
          <span>
            {t.liveInput.speechActivity}
            <strong>{voiceAnalysis.speechActivity}%</strong>
          </span>
          <span>
            {t.liveInput.silenceRatio}
            <strong>{voiceAnalysis.silenceRatio}%</strong>
          </span>
          <span>
            {t.liveInput.clarityScore}
            <strong>{voiceAnalysis.clarityScore}%</strong>
          </span>
          <span>
            {t.liveInput.noiseLevel}
            <strong>{voiceAnalysis.noiseLevel}%</strong>
          </span>
          <span>
            {t.liveInput.toneVariability}
            <strong>{voiceAnalysis.toneVariability}%</strong>
          </span>
          <span>
            {voiceStorageState === "stored" ? t.liveInput.voiceStored : t.liveInput.voiceLocalOnly}
            <strong>{voiceAnalysis.sampleCount}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}
