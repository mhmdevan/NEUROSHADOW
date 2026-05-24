import { generateMetrics } from "@/lib/mockData";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = generateMetrics();
  const client = await getPrismaOrNull();

  if (client) {
    try {
      await ensureSession("demo-session", "research-demo");
      await client.metricSnapshot.create({
        data: {
          sessionId: "demo-session",
          focus: metrics.focus,
          cognitiveLoad: metrics.cognitiveLoad,
          fatigue: metrics.fatigue,
          stress: metrics.stress,
          stability: metrics.stability,
          collapseRisk: metrics.collapseRisk,
          signalQuality: metrics.signalQuality,
        },
      });
    } catch (error) {
      console.warn("Metric persistence skipped:", error);
    }
  }

  return safeJson(metrics);
}
