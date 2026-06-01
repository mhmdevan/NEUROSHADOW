"use client";

import { CircleUserRound, Headphones, ShieldAlert } from "lucide-react";
import type { CognitiveMetrics } from "@/lib/mockData";
import { useLanguage } from "./LanguageProvider";

type UserStatusProps = {
  metrics: CognitiveMetrics;
};

export function UserStatus({ metrics }: UserStatusProps) {
  const { t } = useLanguage();
  const status = metrics.collapseRisk > 32 ? t.status.watchlist : metrics.stability > 72 ? t.status.stable : t.status.monitoring;

  return (
    <section className="panel status-panel" aria-labelledby="status-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.userStatus.eyebrow}</p>
          <h2 id="status-title">{t.userStatus.title}</h2>
        </div>
        <span className="panel__badge">{status}</span>
      </div>
      <div className="status-panel__profile">
        <div className="status-panel__avatar">
          <CircleUserRound size={34} />
        </div>
        <div>
          <strong>{t.userStatus.subject}</strong>
          <p>{t.userStatus.participant}</p>
        </div>
      </div>
      <div className="status-panel__stats">
        <span>
          <Headphones size={16} />
          {t.userStatus.signalQuality} {metrics.signalQuality}%
        </span>
        <span>
          <ShieldAlert size={16} />
          {t.userStatus.collapseRisk} {metrics.collapseRisk}%
        </span>
      </div>
    </section>
  );
}
