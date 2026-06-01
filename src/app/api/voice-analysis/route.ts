import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { voiceAnalysisSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/voice-analysis",
    rateLimit: { key: "sensor:voice", limit: 160, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = voiceAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({
      ok: true,
      mode: "mock",
      stored: false,
      message: "Voice aggregate accepted in mock mode. No microphone audio was stored.",
    });
  }

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for voice signal storage." }, { status: 401 });
  }

  const sessionId = getUserSessionId(user.id);

  await ensureSession(sessionId, "research-demo", user.id);
  await client.voiceSignalSnapshot.create({
    data: {
      userId: user.id,
      sessionId,
      volumeLevel: parsed.data.volumeLevel,
      voiceStability: parsed.data.voiceStability,
      speechActivity: parsed.data.speechActivity,
      silenceRatio: parsed.data.silenceRatio,
      clarityScore: parsed.data.clarityScore,
      noiseLevel: parsed.data.noiseLevel,
      toneVariability: parsed.data.toneVariability,
      confidence: parsed.data.confidence,
      sampleCount: parsed.data.sampleCount,
      averageRms: parsed.data.averageRms,
      spectralCentroid: parsed.data.spectralCentroid,
    },
  });

  return safeJson({
    ok: true,
    mode: "database",
    stored: true,
    message: "Voice aggregate stored. Microphone audio was not persisted.",
  });
}
