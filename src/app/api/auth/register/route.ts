import { createUserSession, hashPassword, normalizeEmail } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { validateAuthInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/auth/register",
    rateLimit: { key: "auth:register", limit: 8, windowMs: 10 * 60 * 1000 },
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
  const validation = validateAuthInput(payload, language, "register");
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
              ? "برای ثبت‌نام، دیتابیس محلی یا PostgreSQL باید فعال باشد."
              : "Registration requires the local database or PostgreSQL to be active.",
        },
      },
      { status: 503 },
    );
  }

  const email = normalizeEmail(validation.data.email);
  const existing = await client.user.findUnique({ where: { email } });
  if (existing) {
    return safeJson(
      {
        ok: false,
        errors: {
          email: language === "fa" ? "این ایمیل قبلاً ثبت شده است." : "This email is already registered.",
        },
      },
      { status: 409 },
    );
  }

  const user = await client.user.create({
    data: {
      name: validation.data.name ?? "Researcher",
      email,
      passwordHash: await hashPassword(validation.data.password),
      locale: language,
    },
  });

  await createUserSession(user.id);
  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_REGISTERED",
      details: `User registered with email ${email}`,
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
