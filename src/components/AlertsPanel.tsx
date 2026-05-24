"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";
import type { AlertItem } from "@/lib/mockData";
import { AnimatePresence, motion } from "framer-motion";

const alertIcon = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

type AlertsPanelProps = {
  alerts: AlertItem[];
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <section className="panel alerts-panel" aria-labelledby="alerts-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">AI alert panel</p>
          <h2 id="alerts-title">Active Alerts</h2>
        </div>
        <span className="panel__badge">{alerts.length} signals</span>
      </div>
      <div className="alerts-panel__list">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => {
            const Icon = alertIcon[alert.type];
            return (
              <motion.article
                className={clsx("alert-item", `alert-item--${alert.type}`)}
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                <Icon size={18} />
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.description}</p>
                  <time>{new Date(alert.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
