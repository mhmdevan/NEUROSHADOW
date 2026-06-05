import { getCurrentUser } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

function serializeBaseline(baseline: {
  focusSelfReport: number;
  energySelfReport: number;
  taskDifficulty: number;
  distractionLevel: number;
  focusBaseline: number;
  stabilityBaseline: number;
  cognitiveLoadBaseline: number;
  stressBaseline: number;
  fatigueBaseline: number;
  collapseRiskBaseline: number;
  focusSpread: number | null;
  stabilitySpread: number | null;
  cognitiveLoadSpread: number | null;
  stressSpread: number | null;
  fatigueSpread: number | null;
  collapseRiskSpread: number | null;
  sampleCount: number | null;
  mouseStability: number | null;
  eyeQuality: number | null;
  voiceStability: number | null;
  signalQuality: number;
  qualityScore: number;
  statusLabel: string;
  summary: string;
  createdAt: Date;
}) {
  return {
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
    focusSpread: baseline.focusSpread,
    stabilitySpread: baseline.stabilitySpread,
    cognitiveLoadSpread: baseline.cognitiveLoadSpread,
    stressSpread: baseline.stressSpread,
    fatigueSpread: baseline.fatigueSpread,
    collapseRiskSpread: baseline.collapseRiskSpread,
    sampleCount: baseline.sampleCount ?? 0,
    mouseStability: baseline.mouseStability,
    eyeQuality: baseline.eyeQuality,
    voiceStability: baseline.voiceStability,
    signalQuality: baseline.signalQuality,
    qualityScore: baseline.qualityScore,
    statusLabel: baseline.statusLabel,
    summary: baseline.summary,
    createdAt: baseline.createdAt.toISOString(),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({ ok: true, mode: "mock", baseline: null });
  }

  const baseline = await client.baselineProfile.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return safeJson({
    ok: true,
    mode: "database",
    baseline: baseline ? serializeBaseline(baseline) : null,
  });
}
