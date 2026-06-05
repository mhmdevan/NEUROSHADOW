"use client";

import { useState } from "react";
import { Activity, CheckCircle2, RefreshCcw, ShieldCheck, Target, TrendingUp } from "lucide-react";
import type { WeeklyTrendSummary } from "@/lib/weeklyTrends";
import { SignalTrendChart, type TrendSeries } from "./SignalTrendChart";
import { useLanguage } from "./LanguageProvider";

type WeeklyTrendsProps = {
  trends: WeeklyTrendSummary | null;
  loading: boolean;
  error: string | null;
  reducedMotion?: boolean;
  onRefresh: () => void;
};

function formatPercent(value: number | null) {
  return value === null ? "--" : `${value}%`;
}

const SERIES_ORDER: TrendSeries[] = ["signalQuality", "focus", "stability"];

export function WeeklyTrends({ trends, loading, error, reducedMotion = false, onRefresh }: WeeklyTrendsProps) {
  const { t } = useLanguage();
  const [series, setSeries] = useState<TrendSeries>("signalQuality");
  const empty = !trends || trends.empty;
  const seriesLabel = (value: TrendSeries) => t.weeklyTrends.series[value === "signalQuality" ? "signal" : value];

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
          <p className="weekly-trends-empty__hint">{t.weeklyTrends.emptyHint}</p>
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
              <div className="weekly-trend-chart__series" role="group" aria-label={t.weeklyTrends.signalTrend}>
                {SERIES_ORDER.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`series-toggle${series === value ? " is-active" : ""}`}
                    aria-pressed={series === value}
                    onClick={() => setSeries(value)}
                  >
                    {seriesLabel(value)}
                  </button>
                ))}
              </div>
            </div>
            <SignalTrendChart points={trends.signalQualityTrend} series={series} reducedMotion={reducedMotion} />
            <div className="weekly-trend-chart__legend">
              <span className="band-key band-key--good">{t.weeklyTrends.bands.good}</span>
              <span className="band-key band-key--fair">{t.weeklyTrends.bands.fair}</span>
              <span className="band-key band-key--low">{t.weeklyTrends.bands.low}</span>
              <span className="weekly-trend-chart__hint">{t.weeklyTrends.chartHint}</span>
            </div>
          </article>

          <p className="disclaimer-inline">{t.weeklyTrends.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
