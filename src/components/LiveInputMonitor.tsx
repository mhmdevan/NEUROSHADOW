"use client";

import { Eye, Keyboard, Mic2, MousePointer2 } from "lucide-react";
import type { CognitiveMetrics } from "@/lib/mockData";

type LiveInputMonitorProps = {
  metrics: CognitiveMetrics;
};

const signalIcons = [Keyboard, MousePointer2, Eye, Mic2];

function spark(seed: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const value = 42 + Math.sin(index * 0.9 + seed) * 20 + Math.cos(index * 0.37 + seed) * 9;
    return Math.max(8, Math.min(88, Math.round(value)));
  });
}

function sparkline(points: number[]) {
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 82;
      const y = 32 - (point / 100) * 28;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function LiveInputMonitor({ metrics }: LiveInputMonitorProps) {
  const signals = [
    {
      title: "Keyboard Activity",
      value: String(Math.round(metrics.focus * 0.74)),
      unit: "keys/min",
      delta: metrics.focus > 72 ? "+4.2%" : "-2.1%",
      seed: metrics.focus / 14,
    },
    {
      title: "Mouse Movement",
      value: String(Math.round(metrics.cognitiveLoad * 1.6)),
      unit: "px/sec",
      delta: metrics.cognitiveLoad > 65 ? "+7.8%" : "+1.4%",
      seed: metrics.cognitiveLoad / 11,
    },
    {
      title: "Eye Tracking",
      value: String(metrics.signalQuality),
      unit: "quality",
      delta: metrics.signalQuality > 88 ? "+2.9%" : "-3.0%",
      seed: metrics.signalQuality / 9,
    },
    {
      title: "Voice Analysis",
      value: String(Math.round(metrics.stress * 0.92)),
      unit: "variance",
      delta: metrics.stress > 55 ? "+6.1%" : "-1.7%",
      seed: metrics.stress / 8,
    },
  ];

  return (
    <section className="panel live-input-panel" id="live-monitor" data-nav-section aria-labelledby="live-monitor-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Live input monitor</p>
          <h2 id="live-monitor-title">Behavioral Signals</h2>
        </div>
        <span className="panel__badge">synthetic stream</span>
      </div>
      <div className="live-input-grid">
        {signals.map((signal, index) => {
          const Icon = signalIcons[index];
          const points = spark(signal.seed);
          return (
            <article className="live-input-card" key={signal.title}>
              <div className="live-input-card__top">
                <Icon size={18} />
                <span>{signal.delta}</span>
              </div>
              <strong>{signal.title}</strong>
              <div className="live-input-card__value">
                {signal.value}
                <span>{signal.unit}</span>
              </div>
              <svg viewBox="0 0 82 36" aria-hidden="true">
                <polyline points={sparkline(points)} fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </article>
          );
        })}
      </div>
    </section>
  );
}
