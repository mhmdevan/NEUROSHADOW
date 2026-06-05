"use client";

import { FileSearch, Loader2, Sparkles } from "lucide-react";
import type { GeneratedSessionReview } from "@/lib/sessionReview";
import { useLanguage } from "./LanguageProvider";

type SessionReviewPanelProps = {
  review: GeneratedSessionReview | null;
  loading: boolean;
  onGenerate: () => void;
};

export function SessionReviewPanel({ review, loading, onGenerate }: SessionReviewPanelProps) {
  const { t } = useLanguage();

  return (
    <section className="panel session-review-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.sessionReview.eyebrow}</p>
          <h2>{t.sessionReview.title}</h2>
        </div>
        <span className="panel__badge">{t.sessionReview.badge}</span>
      </div>

      <div className="session-review-panel__body">
        <div className="session-review-panel__intro">
          <FileSearch size={28} />
          <p>{t.sessionReview.body}</p>
          <button className="primary-button" type="button" onClick={onGenerate} disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            {loading ? t.sessionReview.loading : t.sessionReview.button}
          </button>
        </div>

        {review ? (
          <article className="session-review-card">
            <div className="session-review-card__top">
              <strong>{review.statusLabel}</strong>
              <span>{review.signalQuality}% {t.sessionReview.signalQuality}</span>
            </div>
            <p>{review.summary}</p>
            <div className="session-review-grid">
              <span>
                {t.sessionReview.strongestSignal}
                <strong>{review.strongestSignal}</strong>
              </span>
              <span>
                {t.sessionReview.bestWindow}
                <strong>{review.bestWindow}</strong>
              </span>
              <span>
                {t.sessionReview.weakestWindow}
                <strong>{review.weakestWindow}</strong>
              </span>
            </div>
            <div className="session-review-sensors">
              <span>{t.sessionReview.activeSensors}</span>
              {review.activeSensors.length > 0 ? (
                <div className="session-review-sensor-chips">
                  {review.activeSensors.map((sensor) => (
                    <em key={sensor}>{sensor}</em>
                  ))}
                </div>
              ) : (
                <p>{t.sessionReview.noSensors}</p>
              )}
            </div>
            <p className="session-review-action">{review.actionSuggested}</p>
            <p className="disclaimer-inline">{review.disclaimer}</p>
          </article>
        ) : (
          <div className="session-review-empty">{t.sessionReview.empty}</div>
        )}
      </div>
    </section>
  );
}
