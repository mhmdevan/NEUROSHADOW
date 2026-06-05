"use client";

import { Activity, FlaskConical, WifiOff } from "lucide-react";
import type { MetricSource } from "@/lib/mockData";
import { useLanguage } from "./LanguageProvider";

type SignalSourceBadgeProps = {
  source?: MetricSource;
};

// Shows where the on-screen numbers come from. "sensors" = real live signal; "none" = no usable
// signal yet (awaiting); legacy "simulated" rows are still labelled honestly. This keeps the
// dashboard from ever implying a measurement that did not happen.
export function SignalSourceBadge({ source }: SignalSourceBadgeProps) {
  const { t } = useLanguage();
  const isLive = source === "sensors";
  const isNone = source === "none" || source === undefined;
  const Icon = isLive ? Activity : isNone ? WifiOff : FlaskConical;
  const label = isLive ? t.signalSource.sensors : isNone ? t.signalSource.none : t.signalSource.simulated;
  const variant = isLive ? "source-badge--live" : isNone ? "source-badge--none" : "source-badge--demo";

  return (
    <span className={`source-badge ${variant}`} title={t.signalSource.label}>
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
