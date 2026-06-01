import { getCurrentUser } from "@/lib/auth";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, user: null }, { status: 401 });
  }

  return safeJson({ ok: true, user });
}
