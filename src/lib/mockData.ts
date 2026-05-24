export type CognitiveMetrics = {
  focus: number;
  cognitiveLoad: number;
  fatigue: number;
  stress: number;
  stability: number;
  collapseRisk: number;
  signalQuality: number;
  timestamp: string;
};

export type AlertType = "warning" | "critical" | "info";

export type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  time: string;
};

export type EngineLogLevel = "info" | "warning" | "system";

export type EngineLog = {
  id: string;
  message: string;
  level: EngineLogLevel;
  timestamp: string;
};

export type LiveInputSignal = {
  title: string;
  value: string;
  unit: string;
  delta: string;
  points: number[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

const wave = (base: number, amplitude: number, period: number, offset = 0) => {
  const t = Date.now() / period + offset;
  return base + Math.sin(t) * amplitude + Math.cos(t * 0.63) * amplitude * 0.35;
};

export function generateMetrics(): CognitiveMetrics {
  const focus = clamp(wave(76, 12, 21000, 1.2), 55, 95);
  const cognitiveLoad = clamp(wave(58, 18, 26000, 2.7), 35, 90);
  const fatigue = clamp(wave(45, 16, 32000, 0.4), 20, 75);
  const stress = clamp(wave(38, 14, 19000, 3.1), 15, 70);
  const stability = clamp(98 - cognitiveLoad * 0.38 - fatigue * 0.22 + focus * 0.2, 45, 95);
  const collapseRisk = clamp(
    cognitiveLoad * 0.22 + fatigue * 0.24 + stress * 0.2 - focus * 0.11 - stability * 0.08,
    5,
    45,
  );
  const signalQuality = clamp(wave(91, 5, 17000, 4.4) - collapseRisk * 0.08, 74, 99);

  return {
    focus,
    cognitiveLoad,
    fatigue,
    stress,
    stability,
    collapseRisk,
    signalQuality,
    timestamp: new Date().toISOString(),
  };
}

export const initialMetrics: CognitiveMetrics = {
  focus: 78,
  cognitiveLoad: 56,
  fatigue: 39,
  stress: 31,
  stability: 82,
  collapseRisk: 17,
  signalQuality: 94,
  timestamp: "2026-01-01T00:00:00.000Z",
};

export const alertTemplates: Omit<AlertItem, "id" | "time">[] = [
  {
    type: "warning",
    title: "Cognitive Stability Dropping",
    description: "Synthetic stability signal declined across the latest monitoring window.",
  },
  {
    type: "info",
    title: "Attention Drift Detected",
    description: "Behavioral variance indicates a possible shift away from the active task.",
  },
  {
    type: "info",
    title: "Performance Prediction",
    description: "Potential decline in 12-18 minutes based on simulated cognitive indicators.",
  },
  {
    type: "critical",
    title: "Stress Spike Detected",
    description: "The simulated stress probability trend crossed the elevated threshold.",
  },
  {
    type: "info",
    title: "Focus Level Recovering",
    description: "Focus signal shows a positive correction after a short drift sequence.",
  },
];

export function generateAlerts(): AlertItem[] {
  const now = Date.now();
  return alertTemplates.map((alert, index) => ({
    ...alert,
    id: `alert-${index + 1}-${Math.floor(now / 10000)}`,
    time: new Date(now - index * 92000).toISOString(),
  }));
}

export const initialAlerts: AlertItem[] = alertTemplates.map((alert, index) => ({
  ...alert,
  id: `initial-alert-${index + 1}`,
  time: `2026-01-01T00:0${index}:00.000Z`,
}));

export const logMessages: Pick<EngineLog, "message" | "level">[] = [
  { level: "system", message: "System initialized" },
  { level: "info", message: "Cognitive baseline loaded" },
  { level: "system", message: "Neural pattern stream active" },
  { level: "info", message: "Behavioral signal normalized" },
  { level: "warning", message: "Risk model updated" },
  { level: "system", message: "API response received" },
  { level: "info", message: "Report generated" },
  { level: "info", message: "Feedback saved" },
  { level: "system", message: "Demo mode active" },
];

export function generateLogs(): EngineLog[] {
  const now = Date.now();
  return logMessages.map((log, index) => ({
    ...log,
    id: `log-${index + 1}-${Math.floor(now / 12000)}`,
    timestamp: new Date(now - (logMessages.length - index) * 17000).toISOString(),
  }));
}

export const initialLogs: EngineLog[] = logMessages.map((log, index) => ({
  ...log,
  id: `initial-log-${index + 1}`,
  timestamp: `2026-01-01T00:0${index}:30.000Z`,
}));

export function blendMetrics(
  current: CognitiveMetrics,
  incoming: CognitiveMetrics,
  weight = 0.32,
): CognitiveMetrics {
  const blend = (a: number, b: number) => clamp(a + (b - a) * weight, 0, 100);

  return {
    focus: blend(current.focus, incoming.focus),
    cognitiveLoad: blend(current.cognitiveLoad, incoming.cognitiveLoad),
    fatigue: blend(current.fatigue, incoming.fatigue),
    stress: blend(current.stress, incoming.stress),
    stability: blend(current.stability, incoming.stability),
    collapseRisk: blend(current.collapseRisk, incoming.collapseRisk),
    signalQuality: blend(current.signalQuality, incoming.signalQuality),
    timestamp: incoming.timestamp,
  };
}

export function createMetricHistory(length = 32): CognitiveMetrics[] {
  return Array.from({ length }, (_, index) => {
    const offset = (length - index) * 3000;
    const originalNow = Date.now;
    try {
      Date.now = () => originalNow() - offset;
      return generateMetrics();
    } finally {
      Date.now = originalNow;
    }
  });
}

export function createInitialMetricHistory(length = 32): CognitiveMetrics[] {
  return Array.from({ length }, (_, index) => ({
    ...initialMetrics,
    focus: 76 + Math.round(Math.sin(index * 0.42) * 5),
    cognitiveLoad: 54 + Math.round(Math.cos(index * 0.38) * 6),
    fatigue: 38 + Math.round(Math.sin(index * 0.32) * 4),
    stress: 31 + Math.round(Math.cos(index * 0.36) * 5),
    stability: 82 + Math.round(Math.sin(index * 0.3) * 4),
    collapseRisk: 16 + Math.round(Math.cos(index * 0.34) * 3),
    signalQuality: 93 + Math.round(Math.sin(index * 0.28) * 3),
    timestamp: `2026-01-01T00:00:${String(index).padStart(2, "0")}.000Z`,
  }));
}

export function getDatabaseModeText(database: "connected" | "mock") {
  return database === "connected"
    ? "Database mode active: Prisma persistence enabled."
    : "Demo mode active: using simulated cognitive data.";
}
