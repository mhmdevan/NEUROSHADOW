"use client";

import { FlaskConical, Loader2, Radar, RefreshCw } from "lucide-react";
import {
  compareToBaseline,
  getBaselineFreshness,
  type BaselineComparison,
  type BaselineSelfReport,
  type GeneratedBaselineProfile,
} from "@/lib/baseline";
import type { CognitiveMetrics } from "@/lib/mockData";
import { useLanguage } from "./LanguageProvider";
import { useMemo, useState } from "react";

export type BaselineCountdown = {
  secondsLeft: number;
  totalSeconds: number;
  samples: number;
};

type BaselineFlowProps = {
  metrics: CognitiveMetrics;
  baseline: GeneratedBaselineProfile | null;
  loading: boolean;
  running: boolean;
  countdown: BaselineCountdown | null;
  onRun: (selfReport: BaselineSelfReport) => void;
};

const fieldKeys: Array<keyof BaselineSelfReport> = [
  "focusSelfReport",
  "energySelfReport",
  "taskDifficulty",
  "distractionLevel",
];

export function BaselineFlow({ metrics, baseline, loading, running, countdown, onRun }: BaselineFlowProps) {
  const { t, language, locale } = useLanguage();
  const [selfReport, setSelfReport] = useState<BaselineSelfReport>({
    focusSelfReport: 4,
    energySelfReport: 3,
    taskDifficulty: 3,
    distractionLevel: 2,
  });
  const freshness = getBaselineFreshness(baseline?.createdAt, language);
  const baselineState =
    !baseline ? t.baseline.missing : baseline.qualityScore < 55 ? t.baseline.lowQuality : freshness;
  const comparisons = useMemo(
    () => (baseline ? compareToBaseline(metrics, baseline) : []),
    [baseline, metrics],
  );
  const sensorRows = baseline
    ? [
        [t.baseline.sensors.mouse, baseline.mouseStability],
        [t.baseline.sensors.eye, baseline.eyeQuality],
        [t.baseline.sensors.voice, baseline.voiceStability],
      ]
    : [];

  const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);

  // Express the gap from baseline as a z-score ("1.4σ below your baseline") when the
  // baseline has a usable spread, otherwise fall back to a plain percentage delta.
  function formatDeviation(comparison: BaselineComparison) {
    if (comparison.z !== null) {
      return `${formatNumber(Math.abs(comparison.z))}${t.baseline.sigma} ${t.baseline.deviation[comparison.direction]}`;
    }
    const sign = comparison.delta >= 0 ? "+" : "";
    return `${sign}${formatNumber(comparison.delta)}% ${t.baseline.vsBaseline}`;
  }

  function updateField(key: keyof BaselineSelfReport, value: string) {
    setSelfReport((current) => ({ ...current, [key]: Number(value) }));
  }

  const captureProgress = countdown
    ? Math.round(((countdown.totalSeconds - countdown.secondsLeft) / countdown.totalSeconds) * 100)
    : 0;

  return (
    <div className="baseline-flow">
      <div className="baseline-flow__intro">
        <Radar size={24} />
        <div>
          <p>{t.baseline.body}</p>
          <p className="disclaimer-inline">{t.projectDisclaimer}</p>
        </div>
      </div>

      <div className="baseline-flow__grid">
        <section className="baseline-checkin" aria-labelledby="baseline-checkin-title">
          <div className="baseline-subheader">
            <div>
              <p className="eyebrow">{t.baseline.selfCheckIn}</p>
              <h3 id="baseline-checkin-title">{t.baseline.personalReference}</h3>
            </div>
            <span>{t.baseline.scaleHint}</span>
          </div>

          <div className="baseline-slider-grid">
            {fieldKeys.map((key) => (
              <label className="baseline-slider" key={key}>
                <span>
                  {t.baseline.fields[key]}
                  <strong>{formatNumber(selfReport[key])}</strong>
                </span>
                <input
                  aria-label={t.baseline.fields[key]}
                  type="range"
                  min="1"
                  max="5"
                  value={selfReport[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                />
              </label>
            ))}
          </div>

          <button className="primary-button" type="button" onClick={() => onRun(selfReport)} disabled={running}>
            {running ? <Loader2 className="spin" size={18} /> : <FlaskConical size={18} />}
            {running ? t.baseline.scanning : baseline ? t.baseline.rerun : t.baseline.run}
          </button>

          {countdown ? (
            <div className="baseline-capture" role="status" aria-live="polite">
              <div className="baseline-capture__head">
                <span>{t.baseline.capturing}</span>
                <strong>
                  {formatNumber(countdown.secondsLeft)} {t.baseline.secondsLeft}
                </strong>
              </div>
              <div className="baseline-capture__bar">
                <i style={{ width: `${captureProgress}%` }} />
              </div>
              <span className="baseline-capture__meta">
                {formatNumber(countdown.samples)} {t.baseline.samplesLabel}
              </span>
              <p className="disclaimer-inline">{t.baseline.captureHint}</p>
            </div>
          ) : null}
        </section>

        <section className="baseline-current" aria-labelledby="baseline-current-title">
          <div className="baseline-subheader">
            <div>
              <p className="eyebrow">{t.baseline.current}</p>
              <h3 id="baseline-current-title">{baselineState}</h3>
            </div>
            {baseline ? <span>{new Date(baseline.createdAt).toLocaleString(locale)}</span> : <span>{t.baseline.notStored}</span>}
          </div>

          {loading ? <div className="baseline-empty">{t.baseline.loading}</div> : null}
          {!loading && !baseline ? <div className="baseline-empty">{t.baseline.empty}</div> : null}

          {baseline ? (
            <>
              <div className="baseline-score">
                <span>{t.baseline.qualityScore}</span>
                <strong>{baseline.qualityScore}%</strong>
              </div>
              <p>{baseline.summary}</p>
              <div className="baseline-comparison-grid">
                {comparisons.map((comparison) => (
                  <span key={comparison.key}>
                    {t.metrics[comparison.key]}
                    <strong>{formatNumber(comparison.current)}%</strong>
                    <em data-direction={comparison.direction}>{formatDeviation(comparison)}</em>
                  </span>
                ))}
              </div>
              <div className="baseline-sensor-strip" aria-label={t.baseline.sensorCapture}>
                {sensorRows.map(([label, value]) => (
                  <span key={String(label)}>
                    {label}
                    <strong>{typeof value === "number" ? `${value}%` : t.baseline.notAvailable}</strong>
                  </span>
                ))}
              </div>
              <button className="secondary-button" type="button" onClick={() => onRun(selfReport)} disabled={running}>
                <RefreshCw size={18} />
                {t.baseline.refresh}
              </button>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
