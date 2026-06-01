"use client";

import { Lightbulb, Loader2, Sparkles, TimerReset, XCircle } from "lucide-react";
import type { GeneratedRecommendedAction, RecommendedActionStatus } from "@/lib/actionEngine";
import { useLanguage } from "./LanguageProvider";
import { ActionFeedback } from "./ActionFeedback";

type ActionRecommendationProps = {
  action: GeneratedRecommendedAction | null;
  loading: boolean;
  feedbackLoading: boolean;
  onRecommend: () => void;
  onFeedback: (status: Extract<RecommendedActionStatus, "accepted" | "not_useful" | "dismissed" | "not_sure" | "helpful">) => void;
};

export function ActionRecommendation({
  action,
  loading,
  feedbackLoading,
  onRecommend,
  onFeedback,
}: ActionRecommendationProps) {
  const { t, locale } = useLanguage();

  return (
    <section className="panel action-recommendation-panel" aria-labelledby="action-recommendation-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.actionRecommendation.eyebrow}</p>
          <h2 id="action-recommendation-title">{t.actionRecommendation.title}</h2>
        </div>
        <span className="panel__badge">{t.actionRecommendation.badge}</span>
      </div>

      <div className="action-recommendation-body">
        <div className="action-recommendation-intro">
          <Lightbulb size={28} />
          <p>{t.actionRecommendation.body}</p>
          <button className="primary-button" type="button" onClick={onRecommend} disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            {loading ? t.actionRecommendation.loading : t.actionRecommendation.button}
          </button>
        </div>

        {action ? (
          <article className={`action-card action-card--${action.priority}`}>
            <div className="action-card__top">
              <div>
                <span>{t.actionRecommendation.priority[action.priority]}</span>
                <strong>{action.title}</strong>
              </div>
              <button className="icon-button" type="button" onClick={() => onFeedback("dismissed")} disabled={feedbackLoading} aria-label={t.actionRecommendation.dismiss}>
                <XCircle size={18} />
              </button>
            </div>
            <p>{action.reason}</p>
            <div className="action-meta-grid">
              <span>
                {t.actionRecommendation.followUp}
                <strong>{new Date(action.followUpAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</strong>
              </span>
              <span>
                {t.actionRecommendation.status}
                <strong>{t.actionRecommendation.statuses[action.status]}</strong>
              </span>
              <span>
                {t.actionRecommendation.window}
                <strong>
                  <TimerReset size={15} />
                  {action.followUpMinutes} {t.session.minutesShort}
                </strong>
              </span>
            </div>
            <ActionFeedback disabled={feedbackLoading || action.status !== "suggested"} onFeedback={onFeedback} />
            <p className="disclaimer-inline">{action.disclaimer}</p>
          </article>
        ) : (
          <div className="action-empty">{t.actionRecommendation.empty}</div>
        )}
      </div>
    </section>
  );
}
