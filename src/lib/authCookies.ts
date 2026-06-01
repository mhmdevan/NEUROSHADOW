export const SESSION_COOKIE = "neuroshadow_session";
export const CSRF_COOKIE = "neuroshadow_csrf";

export function getCookieSecurityOptions(expires: Date, httpOnly: boolean) {
  const sameSite = process.env.NEUROSHADOW_COOKIE_SAMESITE === "strict" ? "strict" : "lax";
  const secure =
    process.env.NEUROSHADOW_SECURE_COOKIES === "true" ||
    (process.env.NEUROSHADOW_SECURE_COOKIES !== "false" && process.env.NODE_ENV === "production");

  return {
    httpOnly,
    sameSite,
    secure,
    path: "/",
    expires,
  } as const;
}
