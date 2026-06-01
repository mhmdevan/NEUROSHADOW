"use client";

import { CheckCircle2, Info, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";

export type ToastMessage = {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
};

type ToastProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

const icons = {
  success: CheckCircle2,
  info: Info,
  warning: ShieldAlert,
};

export function Toast({ toasts, onDismiss }: ToastProps) {
  const { direction, t } = useLanguage();

  return (
    <div className="toast-region" aria-live="polite" aria-label={t.toast.aria}>
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.article
              className={`toast toast--${toast.type}`}
              key={toast.id}
              initial={{ opacity: 0, x: direction === "rtl" ? -32 : 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction === "rtl" ? -32 : 32, scale: 0.96 }}
              transition={{ duration: 0.22 }}
            >
              <Icon size={18} />
              <div>
                <strong>{toast.title}</strong>
                <p>{toast.message}</p>
              </div>
              <button type="button" onClick={() => onDismiss(toast.id)} aria-label={t.toast.dismiss}>
                <X size={16} />
              </button>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
