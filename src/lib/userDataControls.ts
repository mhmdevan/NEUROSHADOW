import type { AuthenticatedUser } from "./auth";

export const userDataDisclaimer =
  "NEUROSHADOW is an educational and research demonstration. It uses simulated and browser-derived aggregate data and does not provide medical diagnosis, treatment, or health recommendations.";

export function userOwnedWhere(userId: string) {
  return { userId };
}

export function currentSessionWhere(user: Pick<AuthenticatedUser, "id" | "sessionId">) {
  return {
    userId: user.id,
    sessionId: user.sessionId,
  };
}

export function buildUserExportResponse(input: {
  mode: "database" | "mock";
  user: AuthenticatedUser;
  data: {
    sessions: unknown[];
    feedback: unknown[];
    auditLogs: unknown[];
  };
  exportedAt?: string;
  note?: string;
}) {
  return {
    ok: true,
    mode: input.mode,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    disclaimer: userDataDisclaimer,
    user: input.user,
    data: input.data,
    ...(input.note ? { note: input.note } : {}),
  };
}

export function currentSessionDeleteMessage(deletedSessions: number) {
  return deletedSessions > 0 ? "Current session data deleted." : "No current session data existed yet.";
}
