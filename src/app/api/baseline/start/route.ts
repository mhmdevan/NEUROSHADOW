import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/baseline/start",
    rateLimit: { key: "baseline:start", limit: 20, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  const startedAt = new Date().toISOString();
  const user = await getCurrentUser();
  const client = await getPrismaOrNull();

  if (!client) {
    return safeJson({ ok: true, mode: "mock", startedAt });
  }

  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for baseline storage." }, { status: 401 });
  }

  const sessionId = getUserSessionId(user.id);
  await ensureSession(sessionId, "research-demo", user.id);
  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "BASELINE_STARTED",
      details: `Baseline flow started for ${sessionId} at ${startedAt}`,
    },
  });

  return safeJson({ ok: true, mode: "database", startedAt, sessionId });
}
