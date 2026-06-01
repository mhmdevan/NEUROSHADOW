"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";
import type { AlertItem } from "@/lib/mockData";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";

const alertIcon = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

type AlertsPanelProps = {
  alerts: AlertItem[];
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const { locale, t } = useLanguage();

  return (
    <section className="panel alerts-panel" aria-labelledby="alerts-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.alerts.eyebrow}</p>
          <h2 id="alerts-title">{t.alerts.title}</h2>
        </div>
        <span className="panel__badge">{alerts.length} {t.alerts.signals}</span>
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
                  <strong>{t.alerts.titles[alert.title as keyof typeof t.alerts.titles] ?? alert.title}</strong>
                  <p>{t.alerts.descriptions[alert.description as keyof typeof t.alerts.descriptions] ?? alert.description}</p>
                  <time>{new Date(alert.time).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
