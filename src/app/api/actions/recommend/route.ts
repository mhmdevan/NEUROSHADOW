import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import { generateRecommendedAction } from "@/lib/actionEngine";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { actionRecommendationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function serializeBaseline(
  baseline: {
    focusBaseline: number;
    stabilityBaseline: number;
    collapseRiskBaseline: number;
    signalQuality: number;
    qualityScore: number;
    mouseStability: number | null;
    eyeQuality: number | null;
    voiceStability: number | null;
    createdAt: Date;
  } | null,
) {
  if (!baseline) return null;
  return {
    focusBaseline: baseline.focusBaseline,
    stabilityBaseline: baseline.stabilityBaseline,
    collapseRiskBaseline: baseline.collapseRiskBaseline,
    signalQuality: baseline.signalQuality,
    qualityScore: baseline.qualityScore,
    mouseStability: baseline.mouseStability,
    eyeQuality: baseline.eyeQuality,
    voiceStability: baseline.voiceStability,
    createdAt: baseline.createdAt.toISOString(),
  };
}

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/actions/recommend",
    rateLimit: { key: "actions:recommend", limit: 40, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = actionRecommendationSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await getCurrentUser();
  const sessionId = user ? getUserSessionId(user.id) : parsed.data.sessionId || "demo-session";
  const client = await getPrismaOrNull();

  if (!client) {
    const action = generateRecommendedAction({
      metrics: parsed.data.metrics,
      baseline: null,
      language: parsed.data.language,
    });
    return safeJson({ ok: true, mode: "mock", stored: false, action });
  }

  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for action recommendations." }, { status: 401 });
  }

  const [baseline, mouseSignal, eyeSignal, voiceSignal] = await Promise.all([
    client.baselineProfile.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    client.mouseSignalSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    client.eyeSignalSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    client.voiceSignalSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const action = generateRecommendedAction({
    metrics: parsed.data.metrics,
    baseline: serializeBaseline(baseline),
    sensors: {
      mouseStability: mouseSignal?.stabilityScore ?? null,
      eyeQuality: eyeSignal?.trackingQuality ?? null,
      voiceStability: voiceSignal?.voiceStability ?? null,
      noiseLevel: voiceSignal?.noiseLevel ?? null,
    },
    language: parsed.data.language,
  });

  await ensureSession(sessionId, "research-demo", user.id);
  const stored = await client.recommendedAction.create({
    data: {
      userId: user.id,
      sessionId,
      actionType: action.actionType,
      title: action.title,
      reason: action.reason,
      status: action.status,
      followUpAt: new Date(action.followUpAt),
    },
  });
  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "ACTION_RECOMMENDED",
      details: `${action.actionType} recommended for ${sessionId}`,
    },
  });

  return safeJson({ ok: true, mode: "database", stored: true, action: { ...action, id: stored.id } });
}
