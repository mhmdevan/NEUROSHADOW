"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { ModeBadge } from "./ModeBadge";

type TopbarProps = {
  currentTime: Date | null;
  databaseMode: "connected" | "mock";
  apiError: string | null;
  reducedMotion: boolean;
  sessionId: string;
};

export function Topbar({ currentTime, databaseMode, apiError, reducedMotion, sessionId }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">NEUROSHADOW</p>
        <h1>AI Cognitive Collapse Prediction Dashboard</h1>
        <span className="topbar__subtitle">Live Monitoring status: neural stream active</span>
      </div>
      <div className="topbar__meta">
        <span className="pill">
          <Clock3 size={16} />
          {currentTime
            ? currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "syncing"}
        </span>
        <span className="pill">
          <CalendarDays size={16} />
          {currentTime
            ? currentTime.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
            : "syncing"}
        </span>
        <span className="pill">{sessionId}</span>
        <span className="pill">
          <ShieldCheck size={16} />
          Research mode
        </span>
        <ModeBadge mode={databaseMode} />
        <span className="pill">
          <CheckCircle2 size={16} />
          {reducedMotion ? "Reduced motion" : "Live simulation"}
        </span>
        {apiError ? (
          <span className="pill pill--warning">
            <AlertTriangle size={16} />
            Backend fallback active
          </span>
        ) : null}
      </div>
    </header>
  );
}
