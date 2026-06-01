import { cookies } from "next/headers";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { CSRF_COOKIE, SESSION_COOKIE, getCookieSecurityOptions } from "./authCookies";
import { getPrismaOrNull } from "./prisma";
import { sanitizeText } from "./security";

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 7;

export { getCookieSecurityOptions } from "./authCookies";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  createdAt: string;
  sessionId: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getUserSessionId(userId: string) {
  return `NS-${userId.slice(-8).toUpperCase()}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(hash, "base64url");
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export async function createUserSession(userId: string) {
  const client = await getPrismaOrNull();
  if (!client) {
    throw new Error("Database is required for user authentication.");
  }

  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = getSessionExpiry();
  await client.authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getCookieSecurityOptions(expiresAt, true));
  cookieStore.set(CSRF_COOKIE, csrfToken, getCookieSecurityOptions(expiresAt, false));
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(CSRF_COOKIE);

  if (!token) {
    return;
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return;
  }

  try {
    await client.authSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  } catch {
    // If auth tables are not migrated yet, clearing the browser cookie is still enough locally.
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const client = await getPrismaOrNull();
  if (!client) {
    return null;
  }

  const authSession = await client.authSession
    .findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    })
    .catch(() => null);

  if (!authSession || authSession.expiresAt <= new Date()) {
    await client.authSession.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => null);
    return null;
  }

  await client.authSession
    .update({
      where: { id: authSession.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => null);

  return {
    id: authSession.user.id,
    name: sanitizeText(authSession.user.name, 120),
    email: authSession.user.email,
    role: authSession.user.role,
    locale: authSession.user.locale,
    createdAt: authSession.user.createdAt.toISOString(),
    sessionId: getUserSessionId(authSession.user.id),
  };
}

export function getAuthCookieName() {
  return SESSION_COOKIE;
}

export function getCsrfCookieName() {
  return CSRF_COOKIE;
}
