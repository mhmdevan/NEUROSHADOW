import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import { generateBaselineProfile } from "@/lib/baseline";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { baselineSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/baseline/complete",
    rateLimit: { key: "baseline:complete", limit: 20, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = baselineSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const baseline = generateBaselineProfile({
    metrics: parsed.data.metrics,
    focusSelfReport: parsed.data.focusSelfReport,
    energySelfReport: parsed.data.energySelfReport,
    taskDifficulty: parsed.data.taskDifficulty,
    distractionLevel: parsed.data.distractionLevel,
    language: parsed.data.language,
  });
  const user = await getCurrentUser();
  const sessionId = user ? getUserSessionId(user.id) : parsed.data.sessionId || "demo-session";
  const client = await getPrismaOrNull();

  if (!client) {
    return safeJson({ ok: true, mode: "mock", stored: false, baseline });
  }

  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for baseline storage." }, { status: 401 });
  }

  await ensureSession(sessionId, "research-demo", user.id);
  const [mouseSignal, eyeSignal, voiceSignal] = await Promise.all([
    client.mouseSignalSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    client.eyeSignalSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    client.voiceSignalSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const sensorBaseline = {
    mouseStability: mouseSignal?.stabilityScore ?? null,
    eyeQuality: eyeSignal?.trackingQuality ?? null,
    voiceStability: voiceSignal?.voiceStability ?? null,
  };
  await client.baselineProfile.create({
    data: {
      userId: user.id,
      sessionId,
      focusSelfReport: baseline.focusSelfReport,
      energySelfReport: baseline.energySelfReport,
      taskDifficulty: baseline.taskDifficulty,
      distractionLevel: baseline.distractionLevel,
      focusBaseline: baseline.focusBaseline,
      stabilityBaseline: baseline.stabilityBaseline,
      cognitiveLoadBaseline: baseline.cognitiveLoadBaseline,
      stressBaseline: baseline.stressBaseline,
      fatigueBaseline: baseline.fatigueBaseline,
      collapseRiskBaseline: baseline.collapseRiskBaseline,
      ...sensorBaseline,
      signalQuality: baseline.signalQuality,
      qualityScore: baseline.qualityScore,
      statusLabel: baseline.statusLabel,
      summary: baseline.summary,
    },
  });
  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "BASELINE_COMPLETED",
      details: `Baseline completed for ${sessionId} with quality ${baseline.qualityScore}`,
    },
  });

  return safeJson({ ok: true, mode: "database", stored: true, baseline: { ...baseline, ...sensorBaseline } });
}
