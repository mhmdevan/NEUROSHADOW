import { afterEach, describe, expect, it } from "vitest";
import { getCookieSecurityOptions } from "./authCookies";

const originalSecureCookies = process.env.NEUROSHADOW_SECURE_COOKIES;
const originalSameSite = process.env.NEUROSHADOW_COOKIE_SAMESITE;
const originalNodeEnv = process.env.NODE_ENV;

function restoreEnv() {
  if (originalSecureCookies === undefined) delete process.env.NEUROSHADOW_SECURE_COOKIES;
  else process.env.NEUROSHADOW_SECURE_COOKIES = originalSecureCookies;
  if (originalSameSite === undefined) delete process.env.NEUROSHADOW_COOKIE_SAMESITE;
  else process.env.NEUROSHADOW_COOKIE_SAMESITE = originalSameSite;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
}

describe("auth cookie options", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("uses secure cookies when explicitly enabled", () => {
    process.env.NEUROSHADOW_SECURE_COOKIES = "true";
    process.env.NEUROSHADOW_COOKIE_SAMESITE = "lax";

    const options = getCookieSecurityOptions(new Date("2026-01-01T00:00:00.000Z"), true);

    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("defaults to secure cookies in production unless explicitly disabled", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEUROSHADOW_SECURE_COOKIES;
    process.env.NEUROSHADOW_COOKIE_SAMESITE = "strict";

    const options = getCookieSecurityOptions(new Date("2026-01-01T00:00:00.000Z"), false);

    expect(options.httpOnly).toBe(false);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("strict");
  });

  it("allows local emergency demo cookies to run over http", () => {
    process.env.NODE_ENV = "development";
    process.env.NEUROSHADOW_SECURE_COOKIES = "false";

    const options = getCookieSecurityOptions(new Date("2026-01-01T00:00:00.000Z"), true);

    expect(options.secure).toBe(false);
  });
});
