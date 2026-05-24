"use client";

import {
  BookOpen,
  FileText,
  FlaskConical,
  Maximize2,
  MessageSquare,
  PlayCircle,
  Radio,
  Server,
} from "lucide-react";
import { motion } from "framer-motion";

type QuickActionsProps = {
  baselineRunning: boolean;
  reportLoading: boolean;
  monitoringActive: boolean;
  onBaseline: () => void;
  onToggleMonitoring: () => void;
  onReport: () => void;
  onTestApi: () => void;
  onPresentation: () => void;
  onGuide: () => void;
  onFeedback: () => void;
};

export function QuickActions({
  baselineRunning,
  reportLoading,
  monitoringActive,
  onBaseline,
  onToggleMonitoring,
  onReport,
  onTestApi,
  onPresentation,
  onGuide,
  onFeedback,
}: QuickActionsProps) {
  const actions = [
    {
      label: baselineRunning ? "Scanning..." : "Start Baseline Scan",
      icon: FlaskConical,
      onClick: onBaseline,
      disabled: baselineRunning,
    },
    {
      label: monitoringActive ? "Pause Live Monitoring" : "Resume Live Monitoring",
      icon: monitoringActive ? Radio : PlayCircle,
      onClick: onToggleMonitoring,
    },
    {
      label: reportLoading ? "Generating..." : "Generate AI Report",
      icon: FileText,
      onClick: onReport,
      disabled: reportLoading,
    },
    { label: "Test Backend API", icon: Server, onClick: onTestApi },
    { label: "Presentation Mode", icon: Maximize2, onClick: onPresentation },
    { label: "About / Guide", icon: BookOpen, onClick: onGuide },
    { label: "Feedback", icon: MessageSquare, onClick: onFeedback },
  ];

  return (
    <section className="panel quick-actions-panel" aria-labelledby="quick-actions-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Quick actions</p>
          <h2 id="quick-actions-title">Judge Demo Controls</h2>
        </div>
        <span className="panel__badge">all actions live</span>
      </div>
      <div className="quick-actions-grid">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              className="quick-action"
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.035 }}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
            >
              <Icon size={18} />
              <span>{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
