import { getCurrentUser } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";
import { generateMockWeeklyTrends, generateWeeklyTrends } from "@/lib/weeklyTrends";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const language = new URL(request.url).searchParams.get("language") === "fa" ? "fa" : "en";
  const client = await getPrismaOrNull();

  if (!client) {
    return safeJson({
      ok: true,
      mode: "mock",
      trends: generateMockWeeklyTrends(language),
    });
  }

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for weekly trends." }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 6);
  windowStart.setHours(0, 0, 0, 0);

  const [sessions, snapshots, actions] = await Promise.all([
    client.session.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: windowStart, lte: now },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    client.metricSnapshot.findMany({
      where: {
        createdAt: { gte: windowStart, lte: now },
        session: { userId: user.id },
      },
      select: {
        focus: true,
        cognitiveLoad: true,
        fatigue: true,
        stress: true,
        stability: true,
        collapseRisk: true,
        signalQuality: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 600,
    }),
    client.recommendedAction.findMany({
      where: {
        userId: user.id,
        respondedAt: { gte: windowStart, lte: now },
      },
      select: {
        title: true,
        actionType: true,
        helpful: true,
        status: true,
        respondedAt: true,
      },
      orderBy: { respondedAt: "desc" },
      take: 120,
    }),
  ]);

  return safeJson({
    ok: true,
    mode: "database",
    trends: generateWeeklyTrends({
      sessions,
      snapshots,
      actions,
      language,
      now,
    }),
  });
}
