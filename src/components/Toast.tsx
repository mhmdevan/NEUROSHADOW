"use client";

import { CheckCircle2, Info, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  return (
    <div className="toast-region" aria-live="polite" aria-label="System notifications">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.article
              className={`toast toast--${toast.type}`}
              key={toast.id}
              initial={{ opacity: 0, x: 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.96 }}
              transition={{ duration: 0.22 }}
            >
              <Icon size={18} />
              <div>
                <strong>{toast.title}</strong>
                <p>{toast.message}</p>
              </div>
              <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
