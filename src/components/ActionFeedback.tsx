"use client";

import { CheckCircle2, HelpCircle, ThumbsDown } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import type { RecommendedActionStatus } from "@/lib/actionEngine";

type ActionFeedbackProps = {
  disabled?: boolean;
  onFeedback: (status: Extract<RecommendedActionStatus, "accepted" | "not_useful" | "dismissed" | "not_sure" | "helpful">) => void;
};

export function ActionFeedback({ disabled = false, onFeedback }: ActionFeedbackProps) {
  const { t } = useLanguage();

  return (
    <div className="action-feedback" aria-label={t.actionRecommendation.feedbackLabel}>
      <button className="secondary-button" type="button" onClick={() => onFeedback("accepted")} disabled={disabled}>
        <CheckCircle2 size={18} />
        {t.actionRecommendation.accept}
      </button>
      <button className="secondary-button" type="button" onClick={() => onFeedback("not_sure")} disabled={disabled}>
        <HelpCircle size={18} />
        {t.actionRecommendation.notSure}
      </button>
      <button className="secondary-button" type="button" onClick={() => onFeedback("not_useful")} disabled={disabled}>
        <ThumbsDown size={18} />
        {t.actionRecommendation.notUseful}
      </button>
    </div>
  );
}
