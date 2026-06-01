import { generateMetrics } from "@/lib/mockData";
import { generateLocalizedReport } from "@/lib/reportGenerator";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { isMetricsPayload } from "@/lib/validation";
import { getCurrentUser, getUserSessionId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/report",
    rateLimit: { key: "report", limit: 30, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payload = body as { metrics?: unknown; sessionId?: string; language?: string };
  const metrics = isMetricsPayload(payload.metrics) ? payload.metrics : generateMetrics();
  const user = await getCurrentUser();
  const sessionId = user ? getUserSessionId(user.id) : payload.sessionId || "demo-session";
  const language = payload.language === "fa" ? "fa" : "en";
  const report = generateLocalizedReport(metrics, language);
  const client = await getPrismaOrNull();

  if (client) {
    try {
      await ensureSession(sessionId, "research-demo", user?.id);
      await client.report.create({
        data: {
          sessionId,
          summary: report.summary,
          riskLevel: report.riskLevel,
          content: report.content,
        },
      });
      await client.auditLog.create({
        data: {
          userId: user?.id,
          action: "REPORT_GENERATED",
          details: `Report generated for ${sessionId} at ${report.timestamp}`,
        },
      });
    } catch (error) {
      console.warn("Report persistence skipped:", error);
    }
  }

  return safeJson(report);
}
