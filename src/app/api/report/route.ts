import { generateMetrics } from "@/lib/mockData";
import { generateReport } from "@/lib/reportGenerator";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";
import { isMetricsPayload } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payload = body as { metrics?: unknown; sessionId?: string };
  const metrics = isMetricsPayload(payload.metrics) ? payload.metrics : generateMetrics();
  const sessionId = payload.sessionId || "demo-session";
  const report = generateReport(metrics);
  const client = await getPrismaOrNull();

  if (client) {
    try {
      await ensureSession(sessionId, "research-demo");
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
