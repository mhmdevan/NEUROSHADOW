-- CreateTable
CREATE TABLE "EyeSignalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "trackingQuality" INTEGER NOT NULL,
    "gazeStability" INTEGER NOT NULL,
    "blinkProxy" INTEGER NOT NULL,
    "lightingQuality" INTEGER NOT NULL,
    "motionVariance" INTEGER NOT NULL,
    "focusConsistency" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "frameCount" INTEGER NOT NULL,
    "averageLuminance" INTEGER NOT NULL,
    "contrastLevel" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EyeSignalSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EyeSignalSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EyeSignalSnapshot_userId_idx" ON "EyeSignalSnapshot"("userId");

-- CreateIndex
CREATE INDEX "EyeSignalSnapshot_sessionId_idx" ON "EyeSignalSnapshot"("sessionId");
