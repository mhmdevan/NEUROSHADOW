"use client";

import type { EngineLog, MetricSource } from "@/lib/mockData";
import { AnimatePresence, motion } from "framer-motion";
import { SignalSourceBadge } from "./SignalSourceBadge";
import { useLanguage } from "./LanguageProvider";

type AiEngineLogsProps = {
  logs: EngineLog[];
  source?: MetricSource;
};

export function AiEngineLogs({ logs, source }: AiEngineLogsProps) {
  const { locale, t } = useLanguage();
  const visibleLogs = logs.slice(-8);

  return (
    <section className="panel logs-panel" aria-labelledby="logs-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.logs.eyebrow}</p>
          <h2 id="logs-title">{t.logs.title}</h2>
        </div>
        <div className="panel__header-badges">
          <SignalSourceBadge source={source} />
          <span className="panel__badge">{t.logs.badge}</span>
        </div>
      </div>
      <div className="logs-panel__terminal">
        {visibleLogs.length === 0 ? <p className="panel-empty">{t.logs.empty}</p> : null}
        <AnimatePresence initial={false}>
          {visibleLogs.map((log) => (
            <motion.div
              className={`log-line log-line--${log.level}`}
              key={log.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <span>{new Date(log.timestamp).toLocaleTimeString(locale)}</span>
              <code>[{log.level}]</code>
              <p>{t.logs.messages[log.message as keyof typeof t.logs.messages] ?? log.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
