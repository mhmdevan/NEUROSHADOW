import { describe, expect, it, beforeEach } from "vitest";
import { clearApiErrorSummary, getApiErrorSummary, recordApiError } from "./apiMonitoring";

describe("api monitoring", () => {
  beforeEach(() => {
    clearApiErrorSummary();
  });

  it("records recent API errors for health and monitoring surfaces", () => {
    recordApiError("/api/report", 403, "Security token expired");
    recordApiError("/api/feedback", 400, "Validation error");

    const summary = getApiErrorSummary();

    expect(summary.recentCount).toBe(2);
    expect(summary.latest).toMatchObject({
      route: "/api/feedback",
      status: 400,
      message: "Validation error",
    });
  });

  it("keeps the in-memory store bounded", () => {
    for (let index = 0; index < 45; index += 1) {
      recordApiError(`/api/test-${index}`, 500, "Synthetic failure");
    }

    const summary = getApiErrorSummary();

    expect(summary.recentCount).toBe(40);
    expect(summary.latest?.route).toBe("/api/test-44");
  });
});
