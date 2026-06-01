import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import { ensureSession, getPrismaOrNull } from "@/lib/prisma";
import { enforceMutationSecurity } from "@/lib/requestGuards";
import { safeJson } from "@/lib/security";
import { generateSessionReview } from "@/lib/sessionReview";
import { sessionReviewSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return safeJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return safeJson({ ok: true, mode: "mock", reviews: [] });
  }

  const reviews = await client.sessionReview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return safeJson({
    ok: true,
    mode: "database",
    reviews: reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    route: "/api/session-review",
    rateLimit: { key: "session-review", limit: 30, windowMs: 10 * 60 * 1000 },
  });
  if (guard) return guard;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = sessionReviewSchema.safeParse(body);
  if (!parsed.success) {
    return safeJson({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await getCurrentUser();
  const sessionId = user ? getUserSessionId(user.id) : parsed.data.sessionId || "demo-session";
  const review = generateSessionReview({
    metrics: parsed.data.metrics,
    history: parsed.data.history,
    language: parsed.data.language,
    baselineComplete: parsed.data.baselineComplete,
    startedAt: parsed.data.startedAt,
  });
  const client = await getPrismaOrNull();

  if (!client) {
    return safeJson({ ok: true, mode: "mock", stored: false, review });
  }

  if (!user) {
    return safeJson({ ok: false, error: "Authentication required for session review storage." }, { status: 401 });
  }

  await ensureSession(sessionId, "research-demo", user.id);
  await client.sessionReview.create({
    data: {
      userId: user.id,
      sessionId,
      summary: review.summary,
      strongestSignal: review.strongestSignal,
      bestWindow: review.bestWindow,
      weakestWindow: review.weakestWindow,
      actionSuggested: review.actionSuggested,
      signalQuality: review.signalQuality,
      statusLabel: review.statusLabel,
    },
  });
  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "SESSION_REVIEW_GENERATED",
      details: `Session review generated for ${sessionId} at ${review.createdAt}`,
    },
  });

  return safeJson({ ok: true, mode: "database", stored: true, review });
}
