"use client";

import { CircleUserRound, Headphones, ShieldAlert } from "lucide-react";
import type { CognitiveMetrics } from "@/lib/mockData";

type UserStatusProps = {
  metrics: CognitiveMetrics;
};

export function UserStatus({ metrics }: UserStatusProps) {
  const status = metrics.collapseRisk > 32 ? "Watchlist" : metrics.stability > 72 ? "Stable" : "Monitoring";

  return (
    <section className="panel status-panel" aria-labelledby="status-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">User status panel</p>
          <h2 id="status-title">Research Subject</h2>
        </div>
        <span className="panel__badge">{status}</span>
      </div>
      <div className="status-panel__profile">
        <div className="status-panel__avatar">
          <CircleUserRound size={34} />
        </div>
        <div>
          <strong>Subject NS-042</strong>
          <p>Anonymous simulated research participant</p>
        </div>
      </div>
      <div className="status-panel__stats">
        <span>
          <Headphones size={16} />
          Signal quality {metrics.signalQuality}%
        </span>
        <span>
          <ShieldAlert size={16} />
          Collapse risk {metrics.collapseRisk}%
        </span>
      </div>
    </section>
  );
}
