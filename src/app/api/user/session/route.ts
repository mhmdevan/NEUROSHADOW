import { getCurrentUser } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { currentSessionDeleteMessage, currentSessionWhere } from "@/lib/userDataControls";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/user/session",
    rateLimit: { key: "user:session-delete", limit: 12, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({
      ok: true,
      mode: "mock",
      deleted: false,
      message: "Mock mode active. No persisted session data was deleted.",
    });
  }

  const deleted = await client.session.deleteMany({
    where: currentSessionWhere(user),
  });

  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "CURRENT_SESSION_DELETED",
      details: `${deleted.count} current session record(s) deleted for ${user.email}`,
    },
  });

  return safeJson({
    ok: true,
    mode: "database",
    deleted: deleted.count > 0,
    deletedSessions: deleted.count,
    message: currentSessionDeleteMessage(deleted.count),
  });
}
