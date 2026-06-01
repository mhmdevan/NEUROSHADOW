import { clearUserSession, getCurrentUser } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { userOwnedWhere } from "@/lib/userDataControls";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/user/all-data",
    rateLimit: { key: "user:all-data-delete", limit: 4, windowMs: 30 * 60 * 1000 },
  });
  if (guard) return guard;

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    await clearUserSession();
    return safeJson({
      ok: true,
      mode: "mock",
      deleted: false,
      message: "Mock mode active. Browser session was cleared, but no persisted database records existed.",
    });
  }

  await client.$transaction([
    client.feedback.deleteMany({ where: userOwnedWhere(user.id) }),
    client.auditLog.deleteMany({ where: userOwnedWhere(user.id) }),
    client.user.delete({ where: { id: user.id } }),
  ]);

  await clearUserSession();

  return safeJson({
    ok: true,
    mode: "database",
    deleted: true,
    message: "All user-owned NeuroShadow data was deleted.",
  });
}
