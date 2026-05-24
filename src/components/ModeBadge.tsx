"use client";

import { Database, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";

type ModeBadgeProps = {
  mode: "connected" | "mock";
};

export function ModeBadge({ mode }: ModeBadgeProps) {
  const isDatabase = mode === "connected";
  const Icon = isDatabase ? Database : FlaskConical;

  return (
    <motion.span
      className={`mode-badge ${isDatabase ? "mode-badge--database" : "mode-badge--demo"}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <Icon size={16} />
      {isDatabase ? "Database mode active" : "Demo mode active"}
    </motion.span>
  );
}
