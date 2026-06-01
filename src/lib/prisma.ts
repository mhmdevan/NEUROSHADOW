import { PrismaClient } from "@prisma/client";
import { toErrorMessage } from "./security";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  databaseStatus?: "connected" | "mock";
  lastDatabaseCheck?: number;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function getPrismaOrNull() {
  if (!process.env.DATABASE_URL) {
    globalForPrisma.databaseStatus = "mock";
    return null;
  }

  const now = Date.now();
  if (
    globalForPrisma.databaseStatus === "connected" &&
    globalForPrisma.lastDatabaseCheck &&
    now - globalForPrisma.lastDatabaseCheck < 15000
  ) {
    return prisma;
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    globalForPrisma.databaseStatus = "connected";
    globalForPrisma.lastDatabaseCheck = now;
    return prisma;
  } catch (error) {
    console.warn("NEUROSHADOW database unavailable, using mock mode:", toErrorMessage(error));
    globalForPrisma.databaseStatus = "mock";
    globalForPrisma.lastDatabaseCheck = now;
    return null;
  }
}

export async function getDatabaseStatus(): Promise<"connected" | "mock"> {
  const client = await getPrismaOrNull();
  return client ? "connected" : "mock";
}

export async function ensureSession(sessionId: string, mode = "research-demo", userId?: string) {
  const client = await getPrismaOrNull();
  if (!client) {
    return null;
  }

  return client.session.upsert({
    where: { sessionId },
    update: { mode, ...(userId ? { userId } : {}) },
    create: { sessionId, mode, ...(userId ? { userId } : {}) },
  });
}
