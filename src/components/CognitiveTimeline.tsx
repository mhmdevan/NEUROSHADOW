"use client";

import type { CognitiveMetrics } from "@/lib/mockData";
import { useLanguage } from "./LanguageProvider";

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
  const { t } = useLanguage();
  const labels: Record<TimelineMetric["key"], string> = {
    focus: t.metrics.focus,
    cognitiveLoad: t.metrics.cognitiveLoad,
    fatigue: t.metrics.fatigue,
    stress: t.metrics.stress,
    stability: t.metrics.stability,
    collapseRisk: t.metrics.collapseRisk,
  };

  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.timeline.eyebrow}</p>
          <h2 id="timeline-title">{t.timeline.title}</h2>
        </div>
        <span className="panel__badge">{t.timeline.badge}</span>
      </div>
      <div className="timeline-panel__chart">
        <svg viewBox="0 0 720 230" preserveAspectRatio="none" role="img" aria-label={t.timeline.aria}>
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
            {labels[line.key]}
          </span>
        ))}
      </div>
    </section>
  );
}
