import { getCurrentUser } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { buildUserExportResponse, userOwnedWhere } from "@/lib/userDataControls";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/user/export",
    rateLimit: { key: "user:export", limit: 20, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson(buildUserExportResponse({
      mode: "mock",
      user,
      data: {
        sessions: [],
        feedback: [],
        auditLogs: [],
      },
      note: "Mock mode active. No persisted user data was available to export.",
    }));
  }

  const [sessions, feedback, auditLogs] = await Promise.all([
    client.session.findMany({
      where: userOwnedWhere(user.id),
      orderBy: { createdAt: "desc" },
      include: {
        snapshots: true,
        reports: true,
        mouseSignals: true,
        eyeSignals: true,
        voiceSignals: true,
        reviews: true,
        baselines: true,
        actions: true,
      },
    }),
    client.feedback.findMany({ where: userOwnedWhere(user.id), orderBy: { createdAt: "desc" } }),
    client.auditLog.findMany({ where: userOwnedWhere(user.id), orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_DATA_EXPORTED",
      details: `Exported ${sessions.length} sessions for ${user.email}`,
    },
  });

  return safeJson(buildUserExportResponse({
    mode: "database",
    user,
    data: {
      sessions,
      feedback,
      auditLogs,
    },
  }));
}
