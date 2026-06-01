import { describe, expect, it, beforeEach } from "vitest";
import { CSRF_COOKIE, SESSION_COOKIE } from "./authCookies";
import { checkRateLimit, clearRateLimitBuckets, validateCsrfRequest } from "./requestGuards";

describe("request guards", () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it("limits requests inside a fixed window and resets after the window", () => {
    const options = { key: "test-route", limit: 2, windowMs: 1000 };

    expect(checkRateLimit(options, "client-a", 0).allowed).toBe(true);
    expect(checkRateLimit(options, "client-a", 200).allowed).toBe(true);
    expect(checkRateLimit(options, "client-a", 400).allowed).toBe(false);
    expect(checkRateLimit(options, "client-a", 1001).allowed).toBe(true);
  });

  it("allows unauthenticated mutations without csrf because no browser session exists", () => {
    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { cookie: "other=value" },
    });

    expect(validateCsrfRequest(request).valid).toBe(true);
  });

  it("requires a matching csrf cookie and header for authenticated mutations", () => {
    const validRequest = new Request("http://localhost/api/report", {
      method: "POST",
      headers: {
        cookie: `${SESSION_COOKIE}=session-token; ${CSRF_COOKIE}=csrf-token`,
        "x-neuroshadow-csrf": "csrf-token",
      },
    });

    const invalidRequest = new Request("http://localhost/api/report", {
      method: "POST",
      headers: {
        cookie: `${SESSION_COOKIE}=session-token; ${CSRF_COOKIE}=csrf-token`,
        "x-neuroshadow-csrf": "wrong-token",
      },
    });

    expect(validateCsrfRequest(validRequest).valid).toBe(true);
    expect(validateCsrfRequest(invalidRequest).valid).toBe(false);
  });

  it("does not require csrf for safe methods", () => {
    const request = new Request("http://localhost/api/user/export", {
      method: "GET",
      headers: { cookie: `${SESSION_COOKIE}=session-token` },
    });

    expect(validateCsrfRequest(request).valid).toBe(true);
  });
});
