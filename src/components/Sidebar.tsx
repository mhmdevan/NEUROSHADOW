"use client";

import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  KeyRound,
  FileText,
  Gauge,
  History,
  Info,
  LayoutDashboard,
  MessageSquare,
  Radio,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

const items = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "baseline", label: "Baseline", icon: Gauge },
  { id: "live-monitor", label: "Live Monitor", icon: Radio },
  { id: "ai-analysis", label: "AI Analysis", icon: BrainCircuit },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "about", label: "About", icon: Info },
  { id: "user-guide", label: "User Guide", icon: BookOpen },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
];

type SidebarProps = {
  activeSection: string;
  onNavigate: (id: string) => void;
  secureToken: string;
  databaseMode: "connected" | "mock";
};

export function Sidebar({ activeSection, onNavigate, secureToken, databaseMode }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">
          <Activity size={24} />
        </div>
        <div>
          <strong>NEUROSHADOW</strong>
          <span>AI Cognitive Monitor</span>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Dashboard navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              className={clsx("sidebar__item", activeSection === item.id && "is-active")}
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="sidebar__status-card">
        <div>
          <span className="status-dot" />
          <strong>System Status</strong>
        </div>
        <p>{databaseMode === "connected" ? "Database mode active" : "Demo mode active"}</p>
        <small>Secure demo session active</small>
      </div>

      <div className="sidebar__footer">
        <span>
          <BarChart3 size={16} />
          v1.7 Neural Lab
        </span>
        <span>
          <KeyRound size={16} />
          {secureToken}
        </span>
      </div>
    </aside>
  );
}
