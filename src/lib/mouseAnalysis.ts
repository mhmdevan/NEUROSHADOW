export type MouseSample = {
  x: number;
  y: number;
  timestamp: number;
};

export type MouseAnalysisSnapshot = {
  actionsPerMinute: number;
  distancePx: number;
  averageVelocity: number;
  idleMs: number;
  jitterScore: number;
  directionChanges: number;
  stabilityScore: number;
  confidence: number;
  sampleCount: number;
  clickCount: number;
  wheelCount: number;
  timestamp: string;
};

export const emptyMouseAnalysis: MouseAnalysisSnapshot = {
  actionsPerMinute: 0,
  distancePx: 0,
  averageVelocity: 0,
  idleMs: 0,
  jitterScore: 0,
  directionChanges: 0,
  stabilityScore: 100,
  confidence: 0,
  sampleCount: 0,
  clickCount: 0,
  wheelCount: 0,
  timestamp: "2026-01-01T00:00:00.000Z",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function angleBetween(a: MouseSample, b: MouseSample) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function angleDelta(a: number, b: number) {
  const diff = Math.abs(a - b) % (Math.PI * 2);
  return diff > Math.PI ? Math.PI * 2 - diff : diff;
}

export function analyzeMouseSamples(
  samples: MouseSample[],
  options: {
    clickCount: number;
    wheelCount: number;
    now?: number;
  },
): MouseAnalysisSnapshot {
  const now = options.now ?? Date.now();
  const ordered = samples.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);

  if (ordered.length < 2) {
    return {
      ...emptyMouseAnalysis,
      clickCount: options.clickCount,
      wheelCount: options.wheelCount,
      sampleCount: ordered.length,
      idleMs: ordered.length === 1 ? Math.max(0, now - ordered[0].timestamp) : 0,
      timestamp: new Date(now).toISOString(),
    };
  }

  let distancePx = 0;
  let activeMs = 0;
  let directionChanges = 0;
  let jitterRadians = 0;
  let previousAngle: number | null = null;

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const distance = Math.hypot(dx, dy);
    const deltaMs = Math.max(0, current.timestamp - previous.timestamp);

    distancePx += distance;
    if (deltaMs < 700) {
      activeMs += deltaMs;
    }

    if (distance > 3) {
      const angle = angleBetween(previous, current);
      if (previousAngle !== null) {
        const delta = angleDelta(previousAngle, angle);
        jitterRadians += delta;
        if (delta > 0.9) {
          directionChanges += 1;
        }
      }
      previousAngle = angle;
    }
  }

  const durationMs = Math.max(1, ordered.at(-1)!.timestamp - ordered[0].timestamp);
  const durationMinutes = durationMs / 60000;
  const activityEvents = ordered.length + options.clickCount * 4 + options.wheelCount * 2;
  const actionsPerMinute = Math.round(activityEvents / Math.max(durationMinutes, 1 / 60));
  const averageVelocity = Math.round(distancePx / Math.max(durationMs / 1000, 0.1));
  const idleMs = Math.max(0, now - ordered.at(-1)!.timestamp);
  const jitterScore = Math.round(clamp((jitterRadians / Math.max(ordered.length - 2, 1)) * 26, 0, 100));
  const activeRatio = activeMs / durationMs;
  const confidence = Math.round(clamp(ordered.length * 2.2 + activeRatio * 42, 0, 100));
  const stabilityScore = Math.round(
    clamp(100 - jitterScore * 0.55 - directionChanges * 1.7 - Math.max(0, averageVelocity - 980) * 0.018, 0, 100),
  );

  return {
    actionsPerMinute,
    distancePx: Math.round(distancePx),
    averageVelocity,
    idleMs: Math.round(idleMs),
    jitterScore,
    directionChanges,
    stabilityScore,
    confidence,
    sampleCount: ordered.length,
    clickCount: options.clickCount,
    wheelCount: options.wheelCount,
    timestamp: new Date(now).toISOString(),
  };
}
