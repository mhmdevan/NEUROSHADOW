"use client";

import { Database, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";

type ModeBadgeProps = {
  mode: "connected" | "mock";
};

export function ModeBadge({ mode }: ModeBadgeProps) {
  const isDatabase = mode === "connected";
  const Icon = isDatabase ? Database : FlaskConical;
  const { t } = useLanguage();

  return (
    <motion.span
      className={`mode-badge ${isDatabase ? "mode-badge--database" : "mode-badge--demo"}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <Icon size={16} />
      {isDatabase ? t.mode.database : t.mode.demo}
    </motion.span>
  );
}
