import { describe, expect, it } from "vitest";
import {
  buildUserExportResponse,
  currentSessionDeleteMessage,
  currentSessionWhere,
  userDataDisclaimer,
  userOwnedWhere,
} from "./userDataControls";

const user = {
  id: "user-1",
  name: "Research User",
  email: "research@example.com",
  role: "researcher",
  locale: "en",
  createdAt: "2026-01-01T00:00:00.000Z",
  sessionId: "NS-USER0001",
};

describe("user data controls", () => {
  it("scopes destructive session queries to the signed-in user and current session", () => {
    expect(currentSessionWhere(user)).toEqual({
      userId: "user-1",
      sessionId: "NS-USER0001",
    });
  });

  it("scopes exports and account deletion to user-owned records", () => {
    expect(userOwnedWhere("user-1")).toEqual({ userId: "user-1" });
  });

  it("builds a safe export payload with the required disclaimer", () => {
    const exported = buildUserExportResponse({
      mode: "database",
      user,
      exportedAt: "2026-01-01T00:00:00.000Z",
      data: {
        sessions: [{ id: "session-1" }],
        feedback: [],
        auditLogs: [],
      },
    });

    expect(exported.disclaimer).toBe(userDataDisclaimer);
    expect(exported.data.sessions).toHaveLength(1);
    expect("note" in exported).toBe(false);
  });

  it("keeps delete messaging explicit", () => {
    expect(currentSessionDeleteMessage(1)).toBe("Current session data deleted.");
    expect(currentSessionDeleteMessage(0)).toBe("No current session data existed yet.");
  });
});
