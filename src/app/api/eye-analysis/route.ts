import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { eyeAnalysisSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/eye-analysis",
    rateLimit: { key: "sensor:eye", limit: 160, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = eyeAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({
      ok: true,
      mode: "mock",
      stored: false,
      message: "Eye aggregate accepted in mock mode. No camera frames were stored.",
    });
  }

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for eye signal storage." }, { status: 401 });
  }

  const sessionId = getUserSessionId(user.id);

  await ensureSession(sessionId, "research-demo", user.id);
  await client.eyeSignalSnapshot.create({
    data: {
      userId: user.id,
      sessionId,
      trackingQuality: parsed.data.trackingQuality,
      gazeStability: parsed.data.gazeStability,
      blinkProxy: parsed.data.blinkProxy,
      lightingQuality: parsed.data.lightingQuality,
      motionVariance: parsed.data.motionVariance,
      focusConsistency: parsed.data.focusConsistency,
      confidence: parsed.data.confidence,
      frameCount: parsed.data.frameCount,
      averageLuminance: parsed.data.averageLuminance,
      contrastLevel: parsed.data.contrastLevel,
    },
  });

  return safeJson({
    ok: true,
    mode: "database",
    stored: true,
    message: "Eye aggregate stored. Camera frames were not persisted.",
  });
}
