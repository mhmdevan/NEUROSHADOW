import { getApiErrorSummary } from "@/lib/apiMonitoring";
import { getDatabaseStatus } from "@/lib/prisma";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await getDatabaseStatus();

  return safeJson({
    status: "ok",
    service: "NEUROSHADOW API",
    timestamp: new Date().toISOString(),
    database,
    apiErrors: getApiErrorSummary(),
  });
}
