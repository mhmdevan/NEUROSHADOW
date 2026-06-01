"use client";

import { BarChart3, CheckCircle2, HelpCircle, Loader2, RefreshCcw, ThumbsDown, TimerReset } from "lucide-react";
import { useState } from "react";
import type { ActionOutcomeStats } from "@/lib/actionFollowUp";
import { useLanguage } from "./LanguageProvider";

export type DueActionFollowUp = {
  id: string;
  actionType: string;
  title: string;
  reason: string;
  status: string;
  followUpAt: string | null;
  createdAt: string;
};

type ActionFollowUpProps = {
  dueAction: DueActionFollowUp | null;
  stats: ActionOutcomeStats | null;
  loading: boolean;
  submitting: boolean;
  onRefresh: () => void;
  onSubmit: (payload: { actionId: string; outcome: "helpful" | "not_useful" | "not_sure"; focusAfter: number; energyAfter: number }) => void;
};

export function ActionFollowUp({ dueAction, stats, loading, submitting, onRefresh, onSubmit }: ActionFollowUpProps) {
  const { t } = useLanguage();
  const [focusAfter, setFocusAfter] = useState(3);
  const [energyAfter, setEnergyAfter] = useState(3);

  function submit(outcome: "helpful" | "not_useful" | "not_sure") {
    if (!dueAction) return;
    onSubmit({ actionId: dueAction.id, outcome, focusAfter, energyAfter });
  }

  return (
    <section className="panel action-follow-up-panel" aria-labelledby="action-follow-up-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.actionFollowUp.eyebrow}</p>
          <h2 id="action-follow-up-title">{t.actionFollowUp.title}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader2 className="spin" size={17} /> : <RefreshCcw size={17} />}
          {t.actionFollowUp.refresh}
        </button>
      </div>

      <div className="action-follow-up-grid">
        <article className={`action-follow-up-card ${dueAction ? "is-due" : ""}`}>
          {dueAction ? (
            <>
              <span className="action-follow-up-card__badge">
                <TimerReset size={16} />
                {t.actionFollowUp.dueBadge}
              </span>
              <strong>{dueAction.title}</strong>
              <p>{t.actionFollowUp.question}</p>
              <div className="follow-up-sliders">
                <label>
                  <span>{t.actionFollowUp.focusAfter}</span>
                  <input min="1" max="5" type="range" value={focusAfter} onChange={(event) => setFocusAfter(Number(event.target.value))} />
                  <strong>{focusAfter}/5</strong>
                </label>
                <label>
                  <span>{t.actionFollowUp.energyAfter}</span>
                  <input min="1" max="5" type="range" value={energyAfter} onChange={(event) => setEnergyAfter(Number(event.target.value))} />
                  <strong>{energyAfter}/5</strong>
                </label>
              </div>
              <div className="action-feedback">
                <button className="secondary-button" type="button" onClick={() => submit("helpful")} disabled={submitting}>
                  <CheckCircle2 size={18} />
                  {t.actionFollowUp.helped}
                </button>
                <button className="secondary-button" type="button" onClick={() => submit("not_sure")} disabled={submitting}>
                  <HelpCircle size={18} />
                  {t.actionFollowUp.notSure}
                </button>
                <button className="secondary-button" type="button" onClick={() => submit("not_useful")} disabled={submitting}>
                  <ThumbsDown size={18} />
                  {t.actionFollowUp.didNotHelp}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="action-follow-up-card__badge">
                <TimerReset size={16} />
                {t.actionFollowUp.waitingBadge}
              </span>
              <strong>{t.actionFollowUp.emptyTitle}</strong>
              <p>{t.actionFollowUp.emptyBody}</p>
            </>
          )}
        </article>

        <article className="action-outcome-card">
          <span className="action-follow-up-card__badge">
            <BarChart3 size={16} />
            {t.actionFollowUp.statsBadge}
          </span>
          <strong>{t.actionFollowUp.statsTitle}</strong>
          <p>{stats?.summary ?? t.actionFollowUp.noStats}</p>
          <div className="action-outcome-grid">
            <span>
              {t.actionFollowUp.helpfulRate}
              <strong>{stats?.helpfulRate ?? 0}%</strong>
            </span>
            <span>
              {t.actionFollowUp.answered}
              <strong>{stats?.totalAnswered ?? 0}</strong>
            </span>
            <span>
              {t.actionFollowUp.averageFocus}
              <strong>{stats?.averageFocusAfter ?? "-"}</strong>
            </span>
            <span>
              {t.actionFollowUp.topAction}
              <strong>{stats?.topActionTitle ?? t.actionFollowUp.noneYet}</strong>
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
