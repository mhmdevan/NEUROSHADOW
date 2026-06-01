"use client";

import { AlertTriangle, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";

type ErrorBannerProps = {
  message: string | null;
  databaseMode: "connected" | "mock";
};

export function ErrorBanner({ message, databaseMode }: ErrorBannerProps) {
  const { t } = useLanguage();

  if (!message && databaseMode === "connected") {
    return null;
  }

  return (
    <motion.section
      className={`system-banner ${message ? "system-banner--error" : ""}`}
      aria-live="polite"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {message ? <WifiOff size={18} /> : <AlertTriangle size={18} />}
      <span>
        {databaseMode === "mock"
          ? t.mode.demoFull
          : t.mode.databaseFull}{" "}
        {message ? `${t.mode.backendNotice}: ${message}` : ""}
      </span>
    </motion.section>
  );
}
