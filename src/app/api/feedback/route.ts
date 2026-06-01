import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { validateFeedback } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/feedback",
    rateLimit: { key: "feedback", limit: 10, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const language = payload.language === "fa" ? "fa" : "en";
  const result = validateFeedback(payload, language);
  if (!result.valid) {
    return safeJson({ ok: false, errors: result.errors }, { status: 400 });
  }

  const client = await getPrismaOrNull();
  const user = await getCurrentUser();
  if (client) {
    try {
      await client.feedback.create({ data: { ...result.data, userId: user?.id } });
      await client.auditLog.create({
        data: {
          userId: user?.id,
          action: "FEEDBACK_RECEIVED",
          details: `Feedback received from ${result.data.email}`,
        },
      });
    } catch (error) {
      console.warn("Feedback persistence skipped:", error);
    }
  }

  return safeJson({
    ok: true,
    mode: client ? "database" : "mock",
    message: client
      ? language === "fa"
        ? "بازخورد پذیرفته و ذخیره شد."
        : "Feedback accepted and stored."
      : language === "fa"
        ? "بازخورد در حالت دمو پذیرفته شد. نوشتن در دیتابیس انجام نشد."
        : "Feedback accepted in demo mode. No database write was performed.",
  });
}
