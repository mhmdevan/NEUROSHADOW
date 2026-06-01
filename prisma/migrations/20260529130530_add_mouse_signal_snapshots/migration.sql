-- CreateTable
CREATE TABLE "MouseSignalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "actionsPerMinute" INTEGER NOT NULL,
    "distancePx" INTEGER NOT NULL,
    "averageVelocity" REAL NOT NULL,
    "idleMs" INTEGER NOT NULL,
    "jitterScore" INTEGER NOT NULL,
    "directionChanges" INTEGER NOT NULL,
    "stabilityScore" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "clickCount" INTEGER NOT NULL,
    "wheelCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MouseSignalSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MouseSignalSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MouseSignalSnapshot_userId_idx" ON "MouseSignalSnapshot"("userId");

-- CreateIndex
CREATE INDEX "MouseSignalSnapshot_sessionId_idx" ON "MouseSignalSnapshot"("sessionId");
