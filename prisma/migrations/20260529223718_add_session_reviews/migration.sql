-- CreateTable
CREATE TABLE "SessionReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strongestSignal" TEXT NOT NULL,
    "bestWindow" TEXT,
    "weakestWindow" TEXT,
    "actionSuggested" TEXT,
    "signalQuality" INTEGER NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SessionReview_userId_idx" ON "SessionReview"("userId");

-- CreateIndex
CREATE INDEX "SessionReview_sessionId_idx" ON "SessionReview"("sessionId");
