import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { mouseAnalysisSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/mouse-analysis",
    rateLimit: { key: "sensor:mouse", limit: 160, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = mouseAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({
      ok: true,
      mode: "mock",
      stored: false,
      message: "Mouse aggregate accepted in mock mode. No raw coordinates were stored.",
    });
  }

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for mouse signal storage." }, { status: 401 });
  }

  const sessionId = getUserSessionId(user.id);

  await ensureSession(sessionId, "research-demo", user.id);
  await client.mouseSignalSnapshot.create({
    data: {
      userId: user.id,
      sessionId,
      actionsPerMinute: parsed.data.actionsPerMinute,
      distancePx: parsed.data.distancePx,
      averageVelocity: parsed.data.averageVelocity,
      idleMs: parsed.data.idleMs,
      jitterScore: parsed.data.jitterScore,
      directionChanges: parsed.data.directionChanges,
      stabilityScore: parsed.data.stabilityScore,
      confidence: parsed.data.confidence,
      sampleCount: parsed.data.sampleCount,
      clickCount: parsed.data.clickCount,
      wheelCount: parsed.data.wheelCount,
    },
  });

  return safeJson({
    ok: true,
    mode: "database",
    stored: true,
    message: "Mouse aggregate stored. Raw pointer coordinates were not persisted.",
  });
}
