import { getCurrentUser } from "@/lib/auth";
import { getApiErrorSummary } from "@/lib/apiMonitoring";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return safeJson({
    ok: true,
    monitoring: getApiErrorSummary(),
  });
}
