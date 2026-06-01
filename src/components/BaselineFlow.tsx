"use client";

import { FlaskConical, Loader2, Radar, RefreshCw } from "lucide-react";
import { getBaselineFreshness, type BaselineSelfReport, type GeneratedBaselineProfile } from "@/lib/baseline";
import type { CognitiveMetrics } from "@/lib/mockData";
import { useLanguage } from "./LanguageProvider";
import { useMemo, useState } from "react";

type BaselineFlowProps = {
  metrics: CognitiveMetrics;
  baseline: GeneratedBaselineProfile | null;
  loading: boolean;
  running: boolean;
  onRun: (selfReport: BaselineSelfReport) => void;
};

const fieldKeys: Array<keyof BaselineSelfReport> = [
  "focusSelfReport",
  "energySelfReport",
  "taskDifficulty",
  "distractionLevel",
];

export function BaselineFlow({ metrics, baseline, loading, running, onRun }: BaselineFlowProps) {
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
    () =>
      baseline
        ? [
            [t.metrics.focus, metrics.focus, baseline.focusBaseline],
            [t.metrics.stability, metrics.stability, baseline.stabilityBaseline],
            [t.metrics.cognitiveLoad, metrics.cognitiveLoad, baseline.cognitiveLoadBaseline],
            [t.metrics.collapseRisk, metrics.collapseRisk, baseline.collapseRiskBaseline],
          ]
        : [],
    [baseline, metrics.cognitiveLoad, metrics.collapseRisk, metrics.focus, metrics.stability, t.metrics.cognitiveLoad, t.metrics.collapseRisk, t.metrics.focus, t.metrics.stability],
  );
  const sensorRows = baseline
    ? [
        [t.baseline.sensors.mouse, baseline.mouseStability],
        [t.baseline.sensors.eye, baseline.eyeQuality],
        [t.baseline.sensors.voice, baseline.voiceStability],
      ]
    : [];

  function updateField(key: keyof BaselineSelfReport, value: string) {
    setSelfReport((current) => ({ ...current, [key]: Number(value) }));
  }

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
                  <strong>{new Intl.NumberFormat(locale).format(selfReport[key])}</strong>
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
                {comparisons.map(([label, current, reference]) => {
                  const delta = Number(current) - Number(reference);
                  return (
                    <span key={String(label)}>
                      {label}
                      <strong>{Number(current)}%</strong>
                      <em>
                        {delta >= 0 ? "+" : ""}
                        {delta}% {t.baseline.vsBaseline}
                      </em>
                    </span>
                  );
                })}
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
