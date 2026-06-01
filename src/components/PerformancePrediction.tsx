"use client";

import { useLanguage } from "./LanguageProvider";

type PerformancePredictionProps = {
  collapseRisk: number;
};

export function PerformancePrediction({ collapseRisk }: PerformancePredictionProps) {
  const { t } = useLanguage();
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(0.82, Math.max(0.22, collapseRisk / 55));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <section className="panel prediction-panel" aria-labelledby="prediction-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.prediction.eyebrow}</p>
          <h2 id="prediction-title">{t.prediction.title}</h2>
        </div>
        <span className="panel__badge">{t.prediction.badge}</span>
      </div>
      <div className="prediction-panel__body">
        <svg viewBox="0 0 170 170" className="prediction-gauge" role="img" aria-label={t.prediction.aria}>
          <defs>
            <linearGradient id="risk-arc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#28e7ff" />
              <stop offset="55%" stopColor="#ffe66d" />
              <stop offset="100%" stopColor="#ff4564" />
            </linearGradient>
          </defs>
          <circle cx="85" cy="85" r={radius} className="prediction-gauge__track" />
          <circle
            cx="85"
            cy="85"
            r={radius}
            className="prediction-gauge__arc"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
          <text x="85" y="80" textAnchor="middle" className="prediction-gauge__number">
            12
          </text>
          <text x="85" y="103" textAnchor="middle" className="prediction-gauge__label">
            {t.prediction.minutes}
          </text>
        </svg>
        <p>
          {t.prediction.bodyStart} <strong>{t.prediction.window}</strong> {t.prediction.bodyEnd}
        </p>
        <div className="prediction-panel__scale">
          <span>{t.prediction.stable}</span>
          <span>{t.prediction.watch}</span>
          <span>{t.prediction.critical}</span>
        </div>
      </div>
    </section>
  );
}
