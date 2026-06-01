import { createUserSession, normalizeEmail, verifyPassword } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { validateAuthInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/auth/login",
    rateLimit: { key: "auth:login", limit: 12, windowMs: 5 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, errors: { form: "Invalid JSON body." } }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const language = payload.language === "fa" ? "fa" : "en";
  const validation = validateAuthInput(payload, language, "login");
  if (!validation.valid) {
    return safeJson({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson(
      {
        ok: false,
        errors: {
          form:
            language === "fa"
              ? "ورود نیاز به دیتابیس فعال دارد. SQLite محلی یا PostgreSQL را راه‌اندازی کنید."
              : "Login requires an active database. Start local SQLite or PostgreSQL.",
        },
      },
      { status: 503 },
    );
  }

  const email = normalizeEmail(validation.data.email);
  const user = await client.user.findUnique({ where: { email } });
  const passwordMatches = user ? await verifyPassword(validation.data.password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    return safeJson(
      {
        ok: false,
        errors: {
          form:
            language === "fa"
              ? "ایمیل یا رمز عبور درست نیست."
              : "Email or password is incorrect.",
        },
      },
      { status: 401 },
    );
  }

  await createUserSession(user.id);
  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_LOGIN",
      details: `User logged in with email ${email}`,
    },
  });

  return safeJson({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
