import { getCurrentUser } from "@/lib/auth";
import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { actionFeedbackSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function helpfulFromStatus(status: string) {
  if (status === "helpful") return true;
  if (status === "not_useful" || status === "dismissed") return false;
  return null;
}

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/actions/feedback",
    rateLimit: { key: "actions:feedback", limit: 80, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = actionFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({ ok: true, mode: "mock", stored: false, feedback: parsed.data });
  }

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for action feedback." }, { status: 401 });
  }

  if (!parsed.data.actionId) {
    return safeJson({ ok: false, error: "Action id is required in database mode." }, { status: 400 });
  }

  const isFollowUpStatus = parsed.data.status === "helpful";
  const result = await client.recommendedAction.updateMany({
    where: { id: parsed.data.actionId, userId: user.id },
    data: {
      status: parsed.data.status,
      helpful: helpfulFromStatus(parsed.data.status),
      focusAfter: parsed.data.focusAfter,
      energyAfter: parsed.data.energyAfter,
      respondedAt: isFollowUpStatus || parsed.data.status !== "accepted" ? new Date() : null,
    },
  });

  if (result.count === 0) {
    return safeJson({ ok: false, error: "Action was not found for this user." }, { status: 404 });
  }

  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "ACTION_FEEDBACK_SAVED",
      details: `${parsed.data.status} response saved for ${parsed.data.actionId}`,
    },
  });

  return safeJson({ ok: true, mode: "database", stored: true, feedback: parsed.data });
}
