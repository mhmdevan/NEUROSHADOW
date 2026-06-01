-- CreateTable
CREATE TABLE "VoiceSignalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "volumeLevel" INTEGER NOT NULL,
    "voiceStability" INTEGER NOT NULL,
    "speechActivity" INTEGER NOT NULL,
    "silenceRatio" INTEGER NOT NULL,
    "clarityScore" INTEGER NOT NULL,
    "noiseLevel" INTEGER NOT NULL,
    "toneVariability" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "averageRms" INTEGER NOT NULL,
    "spectralCentroid" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceSignalSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoiceSignalSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VoiceSignalSnapshot_userId_idx" ON "VoiceSignalSnapshot"("userId");

-- CreateIndex
CREATE INDEX "VoiceSignalSnapshot_sessionId_idx" ON "VoiceSignalSnapshot"("sessionId");
