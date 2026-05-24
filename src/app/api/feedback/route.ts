import { getPrismaOrNull } from "@/lib/prisma";
import { safeJson } from "@/lib/security";
import { validateFeedback } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateFeedback((body ?? {}) as Record<string, unknown>);
  if (!result.valid) {
    return safeJson({ ok: false, errors: result.errors }, { status: 400 });
  }

  // Production note: attach IP/user-aware rate limiting here before accepting public traffic.
  const client = await getPrismaOrNull();
  if (client) {
    try {
      await client.feedback.create({ data: result.data });
      await client.auditLog.create({
        data: {
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
      ? "Feedback accepted and stored."
      : "Feedback accepted in demo mode. No database write was performed.",
  });
}
