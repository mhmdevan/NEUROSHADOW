-- CreateTable
CREATE TABLE "BaselineProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "focusSelfReport" INTEGER NOT NULL,
    "energySelfReport" INTEGER NOT NULL,
    "taskDifficulty" INTEGER NOT NULL,
    "distractionLevel" INTEGER NOT NULL,
    "focusBaseline" INTEGER NOT NULL,
    "stabilityBaseline" INTEGER NOT NULL,
    "cognitiveLoadBaseline" INTEGER NOT NULL,
    "stressBaseline" INTEGER NOT NULL,
    "fatigueBaseline" INTEGER NOT NULL,
    "collapseRiskBaseline" INTEGER NOT NULL,
    "signalQuality" INTEGER NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BaselineProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BaselineProfile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BaselineProfile_userId_idx" ON "BaselineProfile"("userId");

-- CreateIndex
CREATE INDEX "BaselineProfile_sessionId_idx" ON "BaselineProfile"("sessionId");
