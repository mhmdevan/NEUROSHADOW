-- AlterTable
ALTER TABLE "BaselineProfile" ADD COLUMN "cognitiveLoadSpread" REAL;
ALTER TABLE "BaselineProfile" ADD COLUMN "collapseRiskSpread" REAL;
ALTER TABLE "BaselineProfile" ADD COLUMN "fatigueSpread" REAL;
ALTER TABLE "BaselineProfile" ADD COLUMN "focusSpread" REAL;
ALTER TABLE "BaselineProfile" ADD COLUMN "sampleCount" INTEGER;
ALTER TABLE "BaselineProfile" ADD COLUMN "stabilitySpread" REAL;
ALTER TABLE "BaselineProfile" ADD COLUMN "stressSpread" REAL;
