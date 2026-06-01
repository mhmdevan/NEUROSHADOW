"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Eye, Keyboard, Mic2, MousePointer2 } from "lucide-react";
import type { CognitiveMetrics } from "@/lib/mockData";
import type { SensorPrivacySettings } from "@/lib/privacy";
import {
  analyzeEyeFrameSamples,
  emptyEyeAnalysis,
  type EyeAnalysisSnapshot,
  type EyeFrameSample,
} from "@/lib/eyeAnalysis";
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
  metrics: CognitiveMetrics;
  sessionId: string;
  privacySettings: SensorPrivacySettings;
};

type LiveSignal =
  | {
      kind: "synthetic";
      title: string;
      value: string;
      unit: string;
      delta: string;
      seed: number;
    }
  | {
      kind: "mouse";
      title: string;
      value: string;
      unit: string;
      delta: string;
      points: number[];
    }
  | {
      kind: "eye";
      title: string;
      value: string;
      unit: string;
      delta: string;
      points: number[];
    }
  | {
      kind: "voice";
      title: string;
      value: string;
      unit: string;
      delta: string;
      points: number[];
    };

const signalIcons = [Keyboard, MousePointer2, Eye, Mic2];

function spark(seed: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const value = 42 + Math.sin(index * 0.9 + seed) * 20 + Math.cos(index * 0.37 + seed) * 9;
    return Math.max(8, Math.min(88, Math.round(value)));
  });
}

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

export function LiveInputMonitor({ metrics, sessionId, privacySettings }: LiveInputMonitorProps) {
  const { t } = useLanguage();
  const samplesRef = useRef<MouseSample[]>([]);
  const clickCountRef = useRef(0);
  const wheelCountRef = useRef(0);
  const lastPointerRef = useRef<MouseSample | null>(null);
  const lastStoredSignatureRef = useRef("");
  const eyeSamplesRef = useRef<EyeFrameSample[]>([]);
  const previousEyePixelsRef = useRef<Uint8ClampedArray | null>(null);
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
      const resetTimer = window.setTimeout(() => {
        setMouseAnalysis(emptyMouseAnalysis);
        setMousePoints(zeroSparkPoints());
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

    window.addEventListener("pointermove", recordPointer, { passive: true });
    window.addEventListener("pointerdown", recordClick, { passive: true });
    window.addEventListener("wheel", recordWheel, { passive: true });
    return () => {
      window.removeEventListener("pointermove", recordPointer);
      window.removeEventListener("pointerdown", recordClick);
      window.removeEventListener("wheel", recordWheel);
    };
  }, [privacySettings.mouse]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!privacySettings.mouse) {
        setMouseAnalysis(emptyMouseAnalysis);
        return;
      }
      const next = analyzeMouseSamples(samplesRef.current, {
        clickCount: clickCountRef.current,
        wheelCount: wheelCountRef.current,
      });
      setMouseAnalysis(next);
      setMousePoints((current) => [...current.slice(-11), Math.min(100, Math.round(next.actionsPerMinute / 8))]);
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
    previousEyePixelsRef.current = null;
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

  useEffect(() => {
    if (!privacySettings.eye) {
      releaseEyeStream();
      const resetTimer = window.setTimeout(() => {
        setEyeCameraState("inactive");
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

  useEffect(() => {
    if (eyeCameraState !== "active" || !privacySettings.eye) {
      return;
    }

    function captureEyeSample() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
      }

      const width = 160;
      const height = 120;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        return null;
      }

      context.drawImage(video, 0, 0, width, height);
      const roiX = Math.floor(width * 0.22);
      const roiY = Math.floor(height * 0.2);
      const roiWidth = Math.floor(width * 0.56);
      const roiHeight = Math.floor(height * 0.3);
      const data = context.getImageData(roiX, roiY, roiWidth, roiHeight).data;
      const luminancePixels = new Uint8ClampedArray(data.length / 4);

      let sum = 0;
      let darkCount = 0;
      for (let index = 0, pixelIndex = 0; index < data.length; index += 4, pixelIndex += 1) {
        const luminance = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
        luminancePixels[pixelIndex] = luminance;
        sum += luminance;
        if (luminance < 54) {
          darkCount += 1;
        }
      }

      const mean = sum / Math.max(luminancePixels.length, 1);
      let variance = 0;
      let motion = 0;
      const previousPixels = previousEyePixelsRef.current;
      for (let index = 0; index < luminancePixels.length; index += 1) {
        variance += (luminancePixels[index] - mean) ** 2;
        if (previousPixels && previousPixels[index] !== undefined) {
          motion += Math.abs(luminancePixels[index] - previousPixels[index]);
        }
      }
      previousEyePixelsRef.current = luminancePixels;

      return {
        timestamp: Date.now(),
        luminance: mean,
        contrast: Math.sqrt(variance / Math.max(luminancePixels.length, 1)),
        motion: previousPixels ? motion / Math.max(luminancePixels.length, 1) : 0,
        darkRatio: darkCount / Math.max(luminancePixels.length, 1),
      } satisfies EyeFrameSample;
    }

    const timer = window.setInterval(() => {
      const sample = captureEyeSample();
      if (!sample) {
        return;
      }
      const now = Date.now();
      eyeSamplesRef.current = [...eyeSamplesRef.current, sample]
        .filter((item) => now - item.timestamp <= 18000)
        .slice(-40);
      const next = analyzeEyeFrameSamples(eyeSamplesRef.current, now);
      setEyeAnalysis(next);
      setEyePoints((current) => [...current.slice(-11), next.trackingQuality]);
    }, 700);

    return () => window.clearInterval(timer);
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

  const signals = useMemo<LiveSignal[]>(() => [
    {
      kind: "synthetic",
      title: t.liveInput.keyboard,
      value: privacySettings.cognitive ? String(Math.round(metrics.focus * 0.74)) : "0",
      unit: t.liveInput.keys,
      delta: privacySettings.cognitive ? (metrics.focus > 72 ? "+4.2%" : "-2.1%") : t.privacy.disabled,
      seed: metrics.focus / 14,
    },
    {
      kind: "mouse",
      title: t.liveInput.mouse,
      value: privacySettings.mouse ? String(mouseAnalysis.actionsPerMinute) : "0",
      unit: t.liveInput.actions,
      delta: privacySettings.mouse
        ? mouseAnalysis.confidence > 18
          ? `${mouseAnalysis.confidence}% ${t.liveInput.confidence}`
          : t.status.pending
        : t.privacy.disabled,
      points: privacySettings.mouse ? mousePoints : Array.from({ length: 12 }, () => 0),
    },
    {
      kind: "eye",
      title: t.liveInput.eye,
      value: privacySettings.eye ? String(eyeAnalysis.frameCount > 0 ? eyeAnalysis.trackingQuality : metrics.signalQuality) : "0",
      unit: t.liveInput.quality,
      delta: !privacySettings.eye
        ? t.privacy.disabled
        : eyeCameraState === "active" && eyeAnalysis.confidence > 18
          ? `${eyeAnalysis.confidence}% ${t.liveInput.confidence}`
          : t.liveInput.cameraInactive,
      points: privacySettings.eye ? (eyeAnalysis.frameCount > 0 ? eyePoints : spark(metrics.signalQuality / 9)) : Array.from({ length: 12 }, () => 0),
    },
    {
      kind: "voice",
      title: t.liveInput.voice,
      value: privacySettings.voice ? String(voiceAnalysis.sampleCount > 0 ? voiceAnalysis.voiceStability : Math.round(metrics.stress * 0.92)) : "0",
      unit: t.liveInput.quality,
      delta: !privacySettings.voice
        ? t.privacy.disabled
        : voiceMicState === "active" && voiceAnalysis.confidence > 18
          ? `${voiceAnalysis.confidence}% ${t.liveInput.confidence}`
          : t.liveInput.microphoneInactive,
      points: privacySettings.voice ? (voiceAnalysis.sampleCount > 0 ? voicePoints : spark(metrics.stress / 8)) : Array.from({ length: 12 }, () => 0),
    },
  ], [
    eyeAnalysis.confidence,
    eyeAnalysis.frameCount,
    eyeAnalysis.trackingQuality,
    eyeCameraState,
    eyePoints,
    metrics,
    mouseAnalysis.actionsPerMinute,
    mouseAnalysis.confidence,
    mousePoints,
    privacySettings.cognitive,
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

  const eyeStatusText =
    !privacySettings.eye
      ? t.privacy.disabled
      : eyeCameraState === "active"
      ? eyeAnalysis.confidence > 18
        ? t.status.monitoring
        : t.liveInput.calibrateEye
      : eyeCameraState === "requesting"
        ? t.liveInput.cameraPending
        : eyeCameraState === "unsupported"
          ? t.liveInput.cameraUnsupported
          : eyeCameraState === "error"
            ? t.liveInput.cameraError
            : t.liveInput.cameraInactive;

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
          const points = signal.kind === "synthetic" ? spark(signal.seed) : signal.points;
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
          <video ref={videoRef} className="analysis-video" muted playsInline aria-hidden="true" />
          <canvas ref={canvasRef} className="analysis-canvas" aria-hidden="true" />
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
