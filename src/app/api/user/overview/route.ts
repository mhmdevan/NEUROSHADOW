import { getCurrentUser } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({ ok: false, error: "Database unavailable." }, { status: 503 });
  }

  const [
    sessionCount,
    snapshotCount,
    reportCount,
    feedbackCount,
    mouseSignalCount,
    eyeSignalCount,
    voiceSignalCount,
    reviewCount,
    baselineCount,
    actionCount,
    latestReports,
  ] = await Promise.all([
      client.session.count({ where: { userId: user.id } }),
      client.metricSnapshot.count({ where: { session: { userId: user.id } } }),
      client.report.count({ where: { session: { userId: user.id } } }),
      client.feedback.count({ where: { userId: user.id } }),
      client.mouseSignalSnapshot.count({ where: { userId: user.id } }),
      client.eyeSignalSnapshot.count({ where: { userId: user.id } }),
      client.voiceSignalSnapshot.count({ where: { userId: user.id } }),
      client.sessionReview.count({ where: { userId: user.id } }),
      client.baselineProfile.count({ where: { userId: user.id } }),
      client.recommendedAction.count({ where: { userId: user.id } }),
      client.report.findMany({
        where: { session: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          summary: true,
          riskLevel: true,
          createdAt: true,
        },
      }),
    ]);

  return safeJson({
    ok: true,
    user,
    counts: {
      sessions: sessionCount,
      snapshots: snapshotCount,
      reports: reportCount,
      feedback: feedbackCount,
      mouseSignals: mouseSignalCount,
      eyeSignals: eyeSignalCount,
      voiceSignals: voiceSignalCount,
      reviews: reviewCount,
      baselines: baselineCount,
      actions: actionCount,
    },
    latestReports: latestReports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    })),
  });
}
