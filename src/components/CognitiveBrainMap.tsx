"use client";

import type { CognitiveMetrics } from "@/lib/mockData";
import { useLanguage } from "./LanguageProvider";

const legendColors = ["#28e7ff", "#8e6bff", "#ff4fd8", "#5fffb7", "#ffe66d"];

type CognitiveBrainMapProps = {
  metrics: CognitiveMetrics;
  reducedMotion: boolean;
};

export function CognitiveBrainMap({ metrics, reducedMotion }: CognitiveBrainMapProps) {
  const { t } = useLanguage();
  const pulseOpacity = Math.max(0.35, metrics.collapseRisk / 80);

  return (
    <section className="panel brain-panel" aria-labelledby="brain-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.brain.eyebrow}</p>
          <h2 id="brain-title">{t.brain.title}</h2>
        </div>
        <span className="panel__badge">{metrics.signalQuality}% {t.brain.signal}</span>
      </div>
      <div className="brain-panel__content">
        <div className="brain-visual">
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
            <path className="brain-scanline" d="M75 176 H486" />
            {[
              [190, 135, 30, "#28e7ff", 0.9],
              [306, 124, 25, "#8e6bff", 0.72],
              [382, 194, 32, "#ff4fd8", pulseOpacity],
              [218, 232, 24, "#5fffb7", 0.68],
              [406, 250, 20, "#ffe66d", 0.58],
            ].map(([cx, cy, r, color, opacity], index) => (
              <g key={`${cx}-${cy}`} className={reducedMotion ? "" : "brain-node"}>
                <circle
                  cx={Number(cx)}
                  cy={Number(cy)}
                  r={Number(r)}
                  fill={String(color)}
                  opacity={Number(opacity) * 0.18}
                  filter="url(#brain-glow)"
                />
                <circle cx={Number(cx)} cy={Number(cy)} r={Number(r) * 0.36} fill={String(color)} opacity={opacity} />
                <circle
                  className="brain-node__ring"
                  cx={Number(cx)}
                  cy={Number(cy)}
                  r={Number(r) * 0.64}
                  fill="none"
                  stroke={String(color)}
                  strokeWidth="2"
                  style={{ animationDelay: `${index * 0.45}s` }}
                />
              </g>
            ))}
            <path className="brain-link" d="M190 135 C238 110 263 111 306 124" />
            <path className="brain-link" d="M306 124 C348 136 369 159 382 194" />
            <path className="brain-link" d="M218 232 C270 210 328 212 382 194" />
            <path className="brain-link" d="M382 194 C402 211 412 228 406 250" />
          </svg>
        </div>
        <div className="brain-panel__legend">
          {t.brain.legend.map(([region, state], index) => (
            <div key={region}>
              <i style={{ background: legendColors[index] }} />
              <span>{region}</span>
              <strong>{state}</strong>
            </div>
          ))}
          <div className="activity-scale">
            <span>{t.brain.low}</span>
            <b />
            <span>{t.brain.high}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
