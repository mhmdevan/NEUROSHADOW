import { describe, expect, it } from "vitest";
import { generateReport, projectDisclaimer } from "./reportGenerator";

const metrics = {
  focus: 82,
  cognitiveLoad: 61,
  fatigue: 39,
  stress: 32,
  stability: 84,
  collapseRisk: 15,
  signalQuality: 94,
  timestamp: "2026-01-01T00:00:00.000Z",
};

describe("generateReport", () => {
  it("returns a complete non-medical report", () => {
    const report = generateReport(metrics);

    expect(report.summary).toContain("simulated");
    expect(report.riskLevel).toBe("Low");
    expect(report.keyIndicators).toHaveLength(7);
    expect(report.recommendation).toContain("Recommended non-medical action");
    expect(report.disclaimer).toBe(projectDisclaimer);
    expect(report.content).toContain("NEUROSHADOW AI REPORT");
  });
});
