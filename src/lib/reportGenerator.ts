import type { CognitiveMetrics } from "./mockData";
import { sanitizeText } from "./security";

export const projectDisclaimer =
  "NEUROSHADOW is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.";

export type GeneratedReport = {
  summary: string;
  riskLevel: "Low" | "Moderate" | "Elevated";
  keyIndicators: string[];
  recommendation: string;
  disclaimer: string;
  content: string;
  timestamp: string;
};

function getRiskLevel(metrics: CognitiveMetrics): GeneratedReport["riskLevel"] {
  if (metrics.collapseRisk >= 32 || metrics.stress >= 62 || metrics.stability < 58) {
    return "Elevated";
  }

  if (metrics.collapseRisk >= 20 || metrics.cognitiveLoad >= 70 || metrics.fatigue >= 55) {
    return "Moderate";
  }

  return "Low";
}

export function generateReport(metrics: CognitiveMetrics): GeneratedReport {
  const timestamp = new Date().toISOString();
  const riskLevel = getRiskLevel(metrics);
  const summary =
    riskLevel === "Elevated"
      ? "The simulated session shows elevated cognitive load pressure with reduced stability buffers."
      : riskLevel === "Moderate"
        ? "The simulated session shows moderate workload pressure with watchlist indicators."
        : "The simulated session is currently stable with low collapse-risk projection.";

  const keyIndicators = [
    `Focus Level: ${metrics.focus}%`,
    `Cognitive Load: ${metrics.cognitiveLoad}%`,
    `Mental Fatigue: ${metrics.fatigue}%`,
    `Stress Probability: ${metrics.stress}%`,
    `Cognitive Stability: ${metrics.stability}%`,
    `Collapse Risk: ${metrics.collapseRisk}%`,
    `Signal Quality: ${metrics.signalQuality}%`,
  ];

  const recommendation =
    riskLevel === "Elevated"
      ? "Recommended non-medical action: pause the demo scenario, reduce task intensity, and re-run the baseline simulation."
      : riskLevel === "Moderate"
        ? "Recommended non-medical action: continue monitoring, reduce simulated task switching, and compare against baseline."
        : "Recommended non-medical action: maintain the current simulated workload and keep collecting trend data.";

  const content = [
    "NEUROSHADOW AI REPORT",
    `Generated: ${timestamp}`,
    "",
    `Summary: ${summary}`,
    `Risk interpretation: ${riskLevel}`,
    "",
    "Key indicators:",
    ...keyIndicators.map((indicator) => `- ${indicator}`),
    "",
    recommendation,
    "",
    `Disclaimer: ${projectDisclaimer}`,
  ].join("\n");

  return {
    summary: sanitizeText(summary, 400),
    riskLevel,
    keyIndicators,
    recommendation,
    disclaimer: projectDisclaimer,
    content: sanitizeText(content, 5000),
    timestamp,
  };
}
