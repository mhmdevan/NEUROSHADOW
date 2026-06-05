"use client";

import { useState } from "react";
import type { CognitiveMetrics } from "@/lib/mockData";
import { getMetricStatus } from "@/lib/metricStatus";
import { LOW_SIGNAL_QUALITY } from "@/lib/cognitiveModel";
import { SignalSourceBadge } from "./SignalSourceBadge";
import { useLanguage } from "./LanguageProvider";

type CognitiveBrainMapProps = {
  metrics: CognitiveMetrics;
  reducedMotion: boolean;
};

// Each glowing region is a transparent, disclaimed *projection* of one live metric onto a
// brain area — not an anatomical measurement. Position/color match the existing artwork and
// the legend order in i18n (brain.legend); `metric` decides how bright/active it renders.
const REGIONS = [
  { key: "prefrontal", metric: "focus", cx: 190, cy: 135, r: 30, color: "#28e7ff" },
  { key: "parietal", metric: "cognitiveLoad", cx: 306, cy: 124, r: 25, color: "#8e6bff" },
  { key: "temporal", metric: "stress", cx: 382, cy: 194, r: 32, color: "#ff4fd8" },
  { key: "occipital", metric: "stability", cx: 218, cy: 232, r: 24, color: "#5fffb7" },
  { key: "cerebellum", metric: "fatigue", cx: 406, cy: 250, r: 20, color: "#ffe66d" },
] as const satisfies ReadonlyArray<{
  key: "prefrontal" | "parietal" | "temporal" | "occipital" | "cerebellum";
  metric: keyof CognitiveMetrics;
  cx: number;
  cy: number;
  r: number;
  color: string;
}>;

export function CognitiveBrainMap({ metrics, reducedMotion }: CognitiveBrainMapProps) {
  const { t } = useLanguage();
  const [active, setActive] = useState<number | null>(null);
  const lowSignal = metrics.signalQuality < LOW_SIGNAL_QUALITY;

  return (
    <section className="panel brain-panel" aria-labelledby="brain-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.brain.eyebrow}</p>
          <h2 id="brain-title">{t.brain.title}</h2>
        </div>
        <div className="panel__header-badges">
          <SignalSourceBadge source={metrics.source} />
          <span className="panel__badge">
            {metrics.signalQuality}% {t.brain.signal}
          </span>
        </div>
      </div>
      <div className="brain-panel__content">
        <div className={`brain-visual${lowSignal ? " is-low-signal" : ""}${active !== null ? " is-focusing" : ""}`}>
          <svg viewBox="0 0 560 360" role="img" aria-label={t.brain.aria}>
            <defs>
              <linearGradient id="brain-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#12305a" />
                <stop offset="48%" stopColor="#142044" />
                <stop offset="100%" stopColor="#1f1138" />
              </linearGradient>
              <filter id="brain-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              className="brain-outline"
              d="M277 65 C250 28 188 28 162 68 C114 51 73 86 79 133 C48 158 56 209 96 230 C101 270 139 292 178 276 C202 312 257 310 282 275 C298 245 301 211 287 180 C305 140 305 99 277 65 Z"
              fill="url(#brain-fill)"
            />
            <path
              className="brain-outline brain-outline--right"
              d="M283 65 C310 28 372 28 398 68 C446 51 487 86 481 133 C512 158 504 209 464 230 C459 270 421 292 382 276 C358 312 303 310 278 275 C262 245 259 211 273 180 C255 140 255 99 283 65 Z"
              fill="url(#brain-fill)"
            />
            <path className="brain-midline" d="M280 68 C266 116 267 153 280 184 C295 221 294 255 280 287" />
            <path className="brain-fold" d="M113 128 C143 103 189 104 211 135 C236 116 263 119 278 145" />
            <path className="brain-fold" d="M99 187 C142 165 200 171 229 207 C247 190 268 190 280 210" />
            <path className="brain-fold" d="M146 248 C178 226 221 228 247 255 C260 243 272 242 282 255" />
            <path className="brain-fold" d="M447 128 C417 103 371 104 349 135 C324 116 297 119 282 145" />
            <path className="brain-fold" d="M461 187 C418 165 360 171 331 207 C313 190 292 190 280 210" />
            <path className="brain-fold" d="M414 248 C382 226 339 228 313 255 C300 243 288 242 278 255" />
            {reducedMotion ? null : <path className="brain-scanline" d="M75 176 H486" />}
            {REGIONS.map((region, index) => {
              const value = Math.round(Number(metrics[region.metric]));
              const activity = Math.max(0.12, Math.min(1, value / 100));
              const haloOpacity = 0.1 + activity * 0.16;
              const coreR = region.r * (0.3 + activity * 0.2);
              const ringDuration = (3.6 - activity * 1.9).toFixed(2);
              const isActive = active === index;
              return (
                <g
                  key={region.key}
                  className={`brain-region${isActive ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                >
                  <circle cx={region.cx} cy={region.cy} r={region.r} fill={region.color} opacity={haloOpacity} filter="url(#brain-glow)" />
                  <circle cx={region.cx} cy={region.cy} r={coreR} fill={region.color} opacity={0.5 + activity * 0.4} />
                  {reducedMotion ? null : (
                    <circle
                      className="brain-node__ring"
                      cx={region.cx}
                      cy={region.cy}
                      r={region.r * 0.64}
                      fill="none"
                      stroke={region.color}
                      strokeWidth="2"
                      style={{ animationDuration: `${ringDuration}s`, animationDelay: `${index * 0.4}s` }}
                    />
                  )}
                </g>
              );
            })}
            <path className="brain-link" d="M190 135 C238 110 263 111 306 124" />
            <path className="brain-link" d="M306 124 C348 136 369 159 382 194" />
            <path className="brain-link" d="M218 232 C270 210 328 212 382 194" />
            <path className="brain-link" d="M382 194 C402 211 412 228 406 250" />
          </svg>
          {lowSignal ? <p className="brain-visual__low">{t.brain.lowSignalNote}</p> : null}
        </div>
        <div className="brain-panel__legend">
          {REGIONS.map((region, index) => {
            const value = Math.round(Number(metrics[region.metric]));
            const status = getMetricStatus(region.metric, value);
            const regionName = t.brain.legend[index]?.[0] ?? region.key;
            const metricName = t.brain.regionMetric[region.key];
            return (
              <button
                type="button"
                key={region.key}
                className={`brain-legend-row${active === index ? " is-active" : ""}`}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                aria-label={
                  lowSignal
                    ? `${regionName} · ${metricName} · ${t.brain.lowSignalNote}`
                    : `${regionName} · ${metricName} ${value}% · ${t.status[status.labelKey]}`
                }
              >
                <i style={{ background: region.color }} />
                <span>{regionName}</span>
                <small>{metricName}</small>
                {lowSignal ? (
                  <strong className="brain-legend-row__idle">—</strong>
                ) : (
                  <strong className={`tone-${status.tone}`}>
                    {value}% · {t.status[status.labelKey]}
                  </strong>
                )}
              </button>
            );
          })}
          <div className="activity-scale">
            <span>{t.brain.low}</span>
            <b />
            <span>{t.brain.high}</span>
          </div>
        </div>
      </div>
      <p className="brain-panel__note">{lowSignal ? t.brain.lowSignalNote : t.brain.activityNote}</p>
    </section>
  );
}
