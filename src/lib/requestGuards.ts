import { recordApiError } from "./apiMonitoring";
import { CSRF_COOKIE, SESSION_COOKIE } from "./authCookies";
import { safeJson } from "./security";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type GuardOptions = {
  route: string;
  rateLimit: RateLimitOptions;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  neuroshadowRateBuckets?: Map<string, RateBucket>;
};

function getBuckets() {
  globalForRateLimit.neuroshadowRateBuckets ??= new Map();
  return globalForRateLimit.neuroshadowRateBuckets;
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) continue;
    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("user-agent") ||
    "local"
  );
}

export function checkRateLimit(options: RateLimitOptions, identifier: string, now = Date.now()) {
  const buckets = getBuckets();
  const bucketKey = `${options.key}:${identifier}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, resetAt: now + options.windowMs };
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(bucketKey, current);
  return { allowed: true, remaining: Math.max(0, options.limit - current.count), resetAt: current.resetAt };
}

export function validateCsrfRequest(request: Request) {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return { valid: true };
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const hasSession = cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    return { valid: true };
  }

  const csrfCookie = cookies.get(CSRF_COOKIE);
  const csrfHeader = request.headers.get("x-neuroshadow-csrf");
  return {
    valid: Boolean(csrfCookie && csrfHeader && csrfCookie === csrfHeader),
  };
}

export function enforceMutationSecurity(request: Request, options: GuardOptions) {
  const identifier = getClientIdentifier(request);
  const rate = checkRateLimit(options.rateLimit, identifier);

  if (!rate.allowed) {
    recordApiError(options.route, 429, "Rate limit exceeded");
    return safeJson(
      {
        ok: false,
        error: "Too many requests. Please wait a moment before trying again.",
        retryAfterSeconds: Math.ceil((rate.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  if (!validateCsrfRequest(request).valid) {
    recordApiError(options.route, 403, "CSRF token mismatch");
    return safeJson({ ok: false, error: "Security token expired. Refresh the page and try again." }, { status: 403 });
  }

  return null;
}

export function clearRateLimitBuckets() {
  globalForRateLimit.neuroshadowRateBuckets = new Map();
}
