"use client";

import { BarChart4, Database, TimerReset } from "lucide-react";
import type { CognitiveMetrics } from "@/lib/mockData";
import { getDatabaseModeText } from "@/lib/mockData";

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
  const durationMinutes = Math.max(1, Math.round((currentTime.getTime() - startedAt.getTime()) / 60000));

  return (
    <section className="panel session-panel" aria-labelledby="session-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Session summary panel</p>
          <h2 id="session-title">Current Session</h2>
        </div>
        <span className="panel__badge">NS-DEMO-001</span>
      </div>
      <div className="summary-list">
        <div>
          <TimerReset size={18} />
          <span>Duration</span>
          <strong>{durationMinutes} min</strong>
        </div>
        <div>
          <BarChart4 size={18} />
          <span>Mean stability</span>
          <strong>{metrics.stability}%</strong>
        </div>
        <div>
          <Database size={18} />
          <span>Data layer</span>
          <strong>{databaseMode === "connected" ? "Prisma" : "Mock"}</strong>
        </div>
      </div>
      <p className="mode-message">{getDatabaseModeText(databaseMode)}</p>
      <p className="mode-message">
        Baseline status: {baselineComplete ? "Baseline scan complete." : "Baseline scan pending."}
      </p>
    </section>
  );
}
