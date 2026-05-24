"use client";

import type { CognitiveMetrics } from "@/lib/mockData";

type TimelineMetric = {
  key: keyof Pick<
    CognitiveMetrics,
    "focus" | "cognitiveLoad" | "fatigue" | "stress" | "stability" | "collapseRisk"
  >;
  label: string;
  color: string;
};

const lines: TimelineMetric[] = [
  { key: "focus", label: "Focus Level", color: "#28e7ff" },
  { key: "cognitiveLoad", label: "Cognitive Load", color: "#8e6bff" },
  { key: "fatigue", label: "Mental Fatigue", color: "#ff9f43" },
  { key: "stress", label: "Stress Probability", color: "#ff4fd8" },
  { key: "stability", label: "Cognitive Stability", color: "#5fffb7" },
  { key: "collapseRisk", label: "Collapse Risk", color: "#ff4564" },
];

function getPolyline(history: CognitiveMetrics[], key: TimelineMetric["key"]) {
  const width = 720;
  const height = 230;
  return history
    .map((item, index) => {
      const x = (index / Math.max(history.length - 1, 1)) * width;
      const y = height - (item[key] / 100) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

type CognitiveTimelineProps = {
  history: CognitiveMetrics[];
};

export function CognitiveTimeline({ history }: CognitiveTimelineProps) {
  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Cognitive timeline</p>
          <h2 id="timeline-title">Live Indicator Trends</h2>
        </div>
        <span className="panel__badge">Last 10 Minutes</span>
      </div>
      <div className="timeline-panel__chart">
        <svg viewBox="0 0 720 230" preserveAspectRatio="none" role="img" aria-label="Cognitive metric timeline">
          {[25, 50, 75].map((line) => (
            <line
              key={line}
              x1="0"
              x2="720"
              y1={230 - (line / 100) * 230}
              y2={230 - (line / 100) * 230}
              className="timeline-grid"
            />
          ))}
          {lines.map((line) => (
            <polyline
              key={line.key}
              points={getPolyline(history, line.key)}
              fill="none"
              stroke={line.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
      <div className="timeline-panel__legend">
        {lines.map((line) => (
          <span key={line.key}>
            <i style={{ background: line.color }} />
            {line.label}
          </span>
        ))}
      </div>
    </section>
  );
}
