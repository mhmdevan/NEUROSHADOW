import type { CognitiveMetrics } from "./mockData";

/**
 * Single source of truth for turning a metric value into a status band (label + tone).
 *
 * Shared by the metric cards, the cognitive brain map, and any other surface that needs
 * to describe "how is this metric doing right now" — so the words and colors stay in sync
 * across the dashboard. `labelKey` indexes into `dictionaries[lang].status`, and `tone`
 * matches the `.tone-*` CSS classes / accent colors.
 *
 * For focus / stability / signalQuality, higher is better. For load / fatigue / stress /
 * collapseRisk, higher is worse — the thresholds below encode that asymmetry.
 */

export type MetricTone = "good" | "moderate" | "elevated" | "risk" | "high";

export type MetricStatus = {
  labelKey: MetricTone;
  tone: MetricTone;
};

const POSITIVE_METRICS: ReadonlyArray<keyof CognitiveMetrics> = ["focus", "stability", "signalQuality"];

export function getMetricStatus(metric: keyof CognitiveMetrics, value: number): MetricStatus {
  if (POSITIVE_METRICS.includes(metric)) {
    if (value >= 78) return { labelKey: "good", tone: "good" };
    if (value >= 62) return { labelKey: "moderate", tone: "moderate" };
    if (value >= 50) return { labelKey: "elevated", tone: "elevated" };
    return { labelKey: "risk", tone: "risk" };
  }

  if (value < 25) return { labelKey: "good", tone: "good" };
  if (value < 50) return { labelKey: "moderate", tone: "moderate" };
  if (value < 68) return { labelKey: "elevated", tone: "elevated" };
  if (value < 82) return { labelKey: "risk", tone: "risk" };
  return { labelKey: "high", tone: "high" };
}
