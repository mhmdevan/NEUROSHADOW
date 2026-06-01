import { getCurrentUser } from "@/lib/auth";
import { summarizeActionOutcomes } from "@/lib/actionFollowUp";
import { getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { actionFollowUpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function serializeAction(action: {
  id: string;
  actionType: string;
  title: string;
  reason: string;
  status: string;
  followUpAt: Date | null;
  createdAt: Date;
}) {
  return {
    ...action,
    followUpAt: action.followUpAt?.toISOString() ?? null,
    createdAt: action.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const language = new URL(request.url).searchParams.get("language") === "fa" ? "fa" : "en";
  const client = await getPrismaOrNull();

  if (!client) {
    return safeJson({
      ok: true,
      mode: "mock",
      dueAction: null,
      stats: summarizeActionOutcomes([], language),
    });
  }

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for action follow-up." }, { status: 401 });
  }

  const [dueAction, outcomes] = await Promise.all([
    client.recommendedAction.findFirst({
      where: {
        userId: user.id,
        status: "accepted",
        helpful: null,
        followUpAt: { lte: new Date() },
      },
      orderBy: { followUpAt: "asc" },
      select: {
        id: true,
        actionType: true,
        title: true,
        reason: true,
        status: true,
        followUpAt: true,
        createdAt: true,
      },
    }),
    client.recommendedAction.findMany({
      where: {
        userId: user.id,
        respondedAt: { not: null },
      },
      orderBy: { respondedAt: "desc" },
      take: 80,
      select: {
        actionType: true,
        title: true,
        status: true,
        helpful: true,
        focusAfter: true,
        energyAfter: true,
      },
    }),
  ]);

  return safeJson({
    ok: true,
    mode: "database",
    dueAction: dueAction ? serializeAction(dueAction) : null,
    stats: summarizeActionOutcomes(outcomes, language),
  });
}

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/actions/follow-up",
    rateLimit: { key: "actions:follow-up", limit: 60, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = actionFollowUpSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({
      ok: true,
      mode: "mock",
      stored: false,
      followUp: parsed.data,
      stats: summarizeActionOutcomes([], parsed.data.language),
    });
  }

  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for action follow-up." }, { status: 401 });
  }

  const helpful = parsed.data.outcome === "helpful" ? true : parsed.data.outcome === "not_useful" ? false : null;
  const result = await client.recommendedAction.updateMany({
    where: {
      id: parsed.data.actionId,
      userId: user.id,
      status: "accepted",
    },
    data: {
      status: parsed.data.outcome,
      helpful,
      focusAfter: parsed.data.focusAfter,
      energyAfter: parsed.data.energyAfter,
      respondedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return safeJson({ ok: false, error: "No accepted action was found for this user." }, { status: 404 });
  }

  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "ACTION_FOLLOW_UP_SAVED",
      details: `${parsed.data.outcome} follow-up saved for ${parsed.data.actionId}`,
    },
  });

  const outcomes = await client.recommendedAction.findMany({
    where: {
      userId: user.id,
      respondedAt: { not: null },
    },
    orderBy: { respondedAt: "desc" },
    take: 80,
    select: {
      actionType: true,
      title: true,
      status: true,
      helpful: true,
      focusAfter: true,
      energyAfter: true,
    },
  });

  return safeJson({
    ok: true,
    mode: "database",
    stored: true,
    followUp: parsed.data,
    stats: summarizeActionOutcomes(outcomes, parsed.data.language),
  });
}
