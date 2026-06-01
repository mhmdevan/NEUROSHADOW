import { generateMetrics } from "@/lib/mockData";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";
import { getCurrentUser, getUserSessionId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = generateMetrics();
  const client = await getPrismaOrNull();
  const user = await getCurrentUser();
  const sessionId = user ? getUserSessionId(user.id) : "demo-session";

  if (client) {
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
        },
      });
    } catch (error) {
      console.warn("Metric persistence skipped:", error);
    }
  }

  return safeJson(metrics);
}
