import { clearUserSession } from "@/lib/auth";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/auth/logout",
    rateLimit: { key: "auth:logout", limit: 30, windowMs: 5 * 60 * 1000 },
  });
  if (guard) return guard;

  await clearUserSession();
  return safeJson({ ok: true });
}
