import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { CSRF_COOKIE, getCookieSecurityOptions } from "@/lib/authCookies";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

function getCsrfExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  if (!cookieStore.get(CSRF_COOKIE)?.value) {
    cookieStore.set(CSRF_COOKIE, randomBytes(32).toString("base64url"), getCookieSecurityOptions(getCsrfExpiry(), false));
  }

  return safeJson({ ok: true, csrfReady: true });
}
