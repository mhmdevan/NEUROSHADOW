"use client";

import type { CSSProperties } from "react";
import type { CognitiveMetrics } from "@/lib/mockData";

type NeuralFieldProps = {
  metrics: CognitiveMetrics;
  reducedMotion: boolean;
};

const nodes = [
  { x: 18, y: 30, tone: "cyan" },
  { x: 31, y: 18, tone: "violet" },
  { x: 49, y: 24, tone: "pink" },
  { x: 66, y: 20, tone: "cyan" },
  { x: 81, y: 34, tone: "violet" },
  { x: 26, y: 54, tone: "pink" },
  { x: 45, y: 45, tone: "cyan" },
  { x: 62, y: 52, tone: "pink" },
  { x: 74, y: 66, tone: "cyan" },
  { x: 36, y: 76, tone: "violet" },
  { x: 54, y: 74, tone: "cyan" },
];

const paths = [
  "M18 30 C31 12 48 16 49 24",
  "M31 18 C42 34 54 36 66 20",
  "M49 24 C62 26 72 28 81 34",
  "M18 30 C24 46 28 50 26 54",
  "M26 54 C33 43 39 42 45 45",
  "M45 45 C52 40 58 43 62 52",
  "M62 52 C71 51 76 56 74 66",
  "M36 76 C42 64 48 61 54 74",
  "M54 74 C63 67 70 67 74 66",
  "M31 18 C31 44 32 61 36 76",
  "M81 34 C72 44 64 45 62 52",
];

export function NeuralField({ metrics, reducedMotion }: NeuralFieldProps) {
  const intensity = Math.max(0.45, Math.min(1.18, (metrics.signalQuality + metrics.focus) / 170));
  const stress = Math.max(0.25, Math.min(1, metrics.stress / 70));
  const motionClass = reducedMotion ? " neural-field--still" : "";

  return (
    <div
      className={`neural-field${motionClass}`}
      role="img"
      aria-label="Lightweight animated neural signal field"
      style={
        {
          "--field-intensity": intensity.toFixed(2),
          "--field-stress": stress.toFixed(2),
        } as CSSProperties
      }
    >
      <div className="neural-field__halo" />
      <svg className="neural-field__map" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="neuralFieldStroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#28e7ff" />
            <stop offset="48%" stopColor="#8e6bff" />
            <stop offset="100%" stopColor="#ff4fd8" />
          </linearGradient>
          <filter id="neuralGlow">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="neural-field__silhouette"
          d="M17 46 C10 31 19 17 36 17 C42 8 57 9 63 19 C79 18 91 29 87 46 C95 58 88 77 70 79 C62 91 43 91 35 79 C18 78 9 62 17 46 Z"
        />
        {paths.map((path, index) => (
          <path key={path} className="neural-field__path" d={path} style={{ animationDelay: `${index * 0.12}s` }} />
        ))}
        {nodes.map((node, index) => (
          <g key={`${node.x}-${node.y}-${node.tone}`} className={`neural-field__node neural-field__node--${node.tone}`}>
            <circle cx={node.x} cy={node.y} r={index % 3 === 0 ? 2.25 : 1.85} />
            <circle
              cx={node.x}
              cy={node.y}
              r={index % 3 === 0 ? 6.4 : 5.2}
              className="neural-field__pulse"
              style={{ animationDelay: `${index * 0.18}s` }}
            />
          </g>
        ))}
      </svg>
      <div className="neural-field__scanner" aria-hidden="true" />
      <div className="neural-field__caption">
        <span>Live neural signal field</span>
        <strong>{metrics.signalQuality}% signal quality</strong>
      </div>
    </div>
  );
}
