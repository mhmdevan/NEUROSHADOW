import { noSignalMetrics, type CognitiveMetrics } from "@/lib/mockData";
import { deriveMetrics, hasUsableSignal } from "@/lib/cognitiveModel";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";
import { getCurrentUser, getUserSessionId } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Only sensor snapshots newer than this count as "live" for the current view.
const SENSOR_FRESHNESS_MS = 20000;

type StoredMetricRow = {
  focus: number;
  cognitiveLoad: number;
  fatigue: number;
  stress: number;
  stability: number;
  collapseRisk: number;
  signalQuality: number;
  createdAt: Date;
};

function snapshotToMetrics(row: StoredMetricRow): CognitiveMetrics {
  return {
    focus: row.focus,
    cognitiveLoad: row.cognitiveLoad,
    fatigue: row.fatigue,
    stress: row.stress,
    stability: row.stability,
    collapseRisk: row.collapseRisk,
    signalQuality: row.signalQuality,
    timestamp: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const client = await getPrismaOrNull();
  const user = await getCurrentUser();
  const sessionId = user ? getUserSessionId(user.id) : "demo-session";

  // No fabricated values: default to an explicit "no live signal" reading and only replace it
  // when real, fresh sensor data exists for this user.
  let metrics: CognitiveMetrics = noSignalMetrics();

  if (client && user) {
    try {
      const freshSince = new Date(Date.now() - SENSOR_FRESHNESS_MS);
      const recent = { userId: user.id, createdAt: { gte: freshSince } };
      const [mouse, eye, voice, lastSnapshot] = await Promise.all([
        client.mouseSignalSnapshot.findFirst({ where: recent, orderBy: { createdAt: "desc" } }),
        client.eyeSignalSnapshot.findFirst({ where: recent, orderBy: { createdAt: "desc" } }),
        client.voiceSignalSnapshot.findFirst({ where: recent, orderBy: { createdAt: "desc" } }),
        client.metricSnapshot.findFirst({
          where: { sessionId, source: "sensors" },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const inputs = { mouse, eye, voice };
      if (hasUsableSignal(inputs)) {
        const previous = lastSnapshot ? snapshotToMetrics(lastSnapshot) : undefined;
        metrics = deriveMetrics(inputs, previous);
      }
    } catch (error) {
      console.warn("Sensor-derived metrics unavailable:", error);
    }
  }

  // Only persist genuine sensor-derived readings — never the empty "none" state — so history,
  // weekly trends, and reports stay free of placeholder rows.
  if (client && metrics.source === "sensors") {
    try {
      await ensureSession(sessionId, "research-demo", user?.id);
      await client.metricSnapshot.create({
        data: {
          sessionId,
          focus: metrics.focus,
          cognitiveLoad: metrics.cognitiveLoad,
          fatigue: metrics.fatigue,
          stress: metrics.stress,
          stability: metrics.stability,
          collapseRisk: metrics.collapseRisk,
          signalQuality: metrics.signalQuality,
          source: "sensors",
        },
      });
    } catch (error) {
      console.warn("Metric persistence skipped:", error);
    }
  }

  return safeJson(metrics);
}
