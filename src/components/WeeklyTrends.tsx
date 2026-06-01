"use client";

import { Activity, CheckCircle2, RefreshCcw, ShieldCheck, Target, TrendingUp } from "lucide-react";
import type { WeeklyTrendSummary } from "@/lib/weeklyTrends";
import { useLanguage } from "./LanguageProvider";

type WeeklyTrendsProps = {
  trends: WeeklyTrendSummary | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function formatPercent(value: number | null) {
  return value === null ? "--" : `${value}%`;
}

function buildLine(points: WeeklyTrendSummary["signalQualityTrend"]) {
  if (points.length === 0) return "0,40 100,40";

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 42 - ((point.signalQuality ?? 0) / 100) * 34;
      return `${x.toFixed(2)},${Math.max(5, Math.min(42, y)).toFixed(2)}`;
    })
    .join(" ");
}

function buildArea(line: string) {
  return `0,44 ${line} 100,44`;
}

export function WeeklyTrends({ trends, loading, error, onRefresh }: WeeklyTrendsProps) {
  const { t } = useLanguage();
  const line = buildLine(trends?.signalQualityTrend ?? []);
  const empty = !trends || trends.empty;

  return (
    <section className="panel weekly-trends-panel" aria-live="polite">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.weeklyTrends.eyebrow}</p>
          <h2>{t.weeklyTrends.title}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onRefresh} disabled={loading}>
          <RefreshCcw className={loading ? "spin" : undefined} size={17} />
          {t.weeklyTrends.refresh}
        </button>
      </div>

      {loading ? <div className="loading-line">{t.weeklyTrends.loading}</div> : null}
      {error ? <div className="weekly-trends-message weekly-trends-message--error">{error}</div> : null}

      {empty ? (
        <div className="weekly-trends-empty">
          <TrendingUp size={28} />
          <strong>{t.weeklyTrends.emptyTitle}</strong>
          <p>{trends?.summary ?? t.weeklyTrends.emptyBody}</p>
        </div>
      ) : (
        <div className="weekly-trends-body">
          <p className="weekly-trends-summary">{trends.summary}</p>
          <div className="weekly-trends-grid">
            <article className="weekly-trend-card weekly-trend-card--focus">
              <Target size={19} />
              <span>{t.weeklyTrends.averageFocus}</span>
              <b>{formatPercent(trends.averageFocusScore)}</b>
            </article>
            <article className="weekly-trend-card weekly-trend-card--stability">
              <ShieldCheck size={19} />
              <span>{t.weeklyTrends.averageStability}</span>
              <b>{formatPercent(trends.averageStabilityScore)}</b>
            </article>
            <article className="weekly-trend-card weekly-trend-card--sessions">
              <CheckCircle2 size={19} />
              <span>{t.weeklyTrends.sessionsCompleted}</span>
              <b>{trends.sessionsCompleted}</b>
            </article>
            <article className="weekly-trend-card weekly-trend-card--alert">
              <Activity size={19} />
              <span>{t.weeklyTrends.commonAlert}</span>
              <strong>{trends.mostCommonAlertType.label}</strong>
              <small>
                {trends.mostCommonAlertType.count} {t.weeklyTrends.snapshots}
              </small>
            </article>
            <article className="weekly-trend-card weekly-trend-card--action">
              <TrendingUp size={19} />
              <span>{t.weeklyTrends.usefulAction}</span>
              <strong>{trends.mostUsefulAction?.title ?? t.weeklyTrends.noneYet}</strong>
              <small>
                {trends.mostUsefulAction?.count ?? 0} {t.weeklyTrends.snapshots}
              </small>
            </article>
          </div>

          <article className="weekly-trend-chart">
            <div className="weekly-trend-chart__header">
              <strong>{t.weeklyTrends.signalTrend}</strong>
              <span>{t.weeklyTrends.badge}</span>
            </div>
            <svg viewBox="0 0 100 48" role="img" aria-label={t.weeklyTrends.signalTrend} preserveAspectRatio="none">
              <defs>
                <linearGradient id="weekly-signal-gradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#28e7ff" />
                  <stop offset="48%" stopColor="#9c6dff" />
                  <stop offset="100%" stopColor="#ff4fd8" />
                </linearGradient>
                <linearGradient id="weekly-signal-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#28e7ff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ff4fd8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[12, 22, 32, 42].map((y) => (
                <line key={y} x1="0" x2="100" y1={y} y2={y} className="weekly-trend-grid-line" />
              ))}
              <polygon points={buildArea(line)} className="weekly-trend-area" />
              <polyline points={line} className="weekly-trend-line" />
              {trends.signalQualityTrend.map((point, index) => {
                const x = (index / Math.max(trends.signalQualityTrend.length - 1, 1)) * 100;
                const y = 42 - ((point.signalQuality ?? 0) / 100) * 34;
                return <circle key={point.date} cx={x} cy={Math.max(5, Math.min(42, y))} r="1.35" className="weekly-trend-dot" />;
              })}
            </svg>
            <div className="weekly-trend-labels">
              {trends.signalQualityTrend.map((point) => (
                <span key={point.date}>{point.label}</span>
              ))}
            </div>
          </article>

          <p className="disclaimer-inline">{t.weeklyTrends.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
