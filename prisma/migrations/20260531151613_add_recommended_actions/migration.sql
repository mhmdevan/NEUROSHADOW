-- CreateTable
CREATE TABLE "RecommendedAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "helpful" BOOLEAN,
    "focusAfter" INTEGER,
    "energyAfter" INTEGER,
    "followUpAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "RecommendedAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecommendedAction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RecommendedAction_userId_idx" ON "RecommendedAction"("userId");

-- CreateIndex
CREATE INDEX "RecommendedAction_sessionId_idx" ON "RecommendedAction"("sessionId");
