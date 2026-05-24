"use client";

import type { EngineLog } from "@/lib/mockData";
import { AnimatePresence, motion } from "framer-motion";

type AiEngineLogsProps = {
  logs: EngineLog[];
};

export function AiEngineLogs({ logs }: AiEngineLogsProps) {
  const visibleLogs = logs.slice(-8);

  return (
    <section className="panel logs-panel" aria-labelledby="logs-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">AI engine logs</p>
          <h2 id="logs-title">Inference Stream</h2>
        </div>
        <span className="panel__badge">Live internal analysis stream</span>
      </div>
      <div className="logs-panel__terminal">
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
              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              <code>[{log.level}]</code>
              <p>{log.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
