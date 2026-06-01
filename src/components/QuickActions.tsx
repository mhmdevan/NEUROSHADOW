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
import { useLanguage } from "./LanguageProvider";

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
  const { t } = useLanguage();
  const actions = [
    {
      label: baselineRunning ? t.quickActions.scanning : t.quickActions.startBaseline,
      icon: FlaskConical,
      onClick: onBaseline,
      disabled: baselineRunning,
    },
    {
      label: monitoringActive ? t.quickActions.pauseMonitoring : t.quickActions.resumeMonitoring,
      icon: monitoringActive ? Radio : PlayCircle,
      onClick: onToggleMonitoring,
    },
    {
      label: reportLoading ? t.quickActions.generating : t.quickActions.generateReport,
      icon: FileText,
      onClick: onReport,
      disabled: reportLoading,
    },
    { label: t.quickActions.testApi, icon: Server, onClick: onTestApi },
    { label: t.quickActions.presentationMode, icon: Maximize2, onClick: onPresentation },
    { label: t.quickActions.aboutGuide, icon: BookOpen, onClick: onGuide },
    { label: t.quickActions.feedback, icon: MessageSquare, onClick: onFeedback },
  ];

  return (
    <section className="panel quick-actions-panel" aria-labelledby="quick-actions-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.quickActions.eyebrow}</p>
          <h2 id="quick-actions-title">{t.quickActions.title}</h2>
        </div>
        <span className="panel__badge">{t.quickActions.badge}</span>
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
