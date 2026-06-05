import type { AlertItem, CognitiveMetrics } from "./mockData";
import type { Dictionary } from "./i18n";

/**
 * Derives the Active Alerts list from the live, sensor-derived metric stream — no templates,
 * no rotation, no fabricated entries. An alert only appears when a real threshold is crossed.
 * When there is no usable sensor signal, there are simply no alerts.
 *
 * `previous` is the last real reading, used to detect direction (dropping vs recovering).
 */
export function deriveLiveAlerts(
  metrics: CognitiveMetrics,
  previous: CognitiveMetrics | null,
  t: Dictionary,
): AlertItem[] {
  if (metrics.source !== "sensors") return [];

  const copy = t.liveAlerts;
  const now = Date.now();
  const bucket = Math.floor(now / 6000); // stable id within a ~6s window so cards don't thrash
  const time = new Date(now).toISOString();
  const alerts: AlertItem[] = [];

  const add = (key: string, type: AlertItem["type"], entry: { title: string; body: string }) => {
    alerts.push({ id: `${key}-${bucket}`, type, title: entry.title, description: entry.body, time });
  };

  if (metrics.collapseRisk >= 50) {
    add("risk", "critical", copy.elevatedRisk);
  }
  if (metrics.stress >= 60) {
    add("stress", "critical", copy.stressSpike);
  }
  if (metrics.stability < 55 || (previous && metrics.stability <= previous.stability - 6)) {
    add("stability", "warning", copy.stabilityDrop);
  }
  if (metrics.focus < 55 || metrics.cognitiveLoad >= 75) {
    add("attention", "info", copy.attentionDrift);
  }
  if (previous && metrics.focus >= previous.focus + 6) {
    add("focus", "info", copy.focusRecovering);
  }

  return alerts.slice(0, 5);
}
