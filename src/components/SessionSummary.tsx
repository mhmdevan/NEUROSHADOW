"use client";

import { BarChart4, Database, TimerReset } from "lucide-react";
import type { CognitiveMetrics } from "@/lib/mockData";
import { useLanguage } from "./LanguageProvider";

type SessionSummaryProps = {
  metrics: CognitiveMetrics;
  startedAt: Date;
  currentTime: Date;
  databaseMode: "connected" | "mock";
  baselineComplete: boolean;
};

export function SessionSummary({
  metrics,
  startedAt,
  currentTime,
  databaseMode,
  baselineComplete,
}: SessionSummaryProps) {
  const { t } = useLanguage();
  const durationMinutes = Math.max(1, Math.round((currentTime.getTime() - startedAt.getTime()) / 60000));

  return (
    <section className="panel session-panel" aria-labelledby="session-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.session.eyebrow}</p>
          <h2 id="session-title">{t.session.title}</h2>
        </div>
        <span className="panel__badge">NS-DEMO-001</span>
      </div>
      <div className="summary-list">
        <div>
          <TimerReset size={18} />
          <span>{t.session.duration}</span>
          <strong>{durationMinutes} {t.session.minutesShort}</strong>
        </div>
        <div>
          <BarChart4 size={18} />
          <span>{t.session.meanStability}</span>
          <strong>{metrics.stability}%</strong>
        </div>
        <div>
          <Database size={18} />
          <span>{t.session.dataLayer}</span>
          <strong>{databaseMode === "connected" ? t.session.prisma : t.session.mock}</strong>
        </div>
      </div>
      <p className="mode-message">{databaseMode === "connected" ? t.mode.databaseFull : t.mode.demoFull}</p>
      <p className="mode-message">
        {t.session.baselineStatus}: {baselineComplete ? t.session.baselineComplete : t.session.baselinePending}
      </p>
    </section>
  );
}
