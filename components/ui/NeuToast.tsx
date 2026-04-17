"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type NeuToastProps = {
  message: string;
  open: boolean;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
};

const icons: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const variantClasses: Record<ToastVariant, string> = {
  success: "bg-[var(--success)] text-white",
  error: "bg-[var(--danger)] text-white",
  info: "bg-[var(--info)] text-white",
};

export function NeuToast({ message, open, variant = "info", duration = 3000, onClose }: NeuToastProps) {
  useEffect(() => {
    if (!open || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium shadow-lg",
        "transition-all duration-300 ease-out",
        variantClasses[variant],
        open ? "toast-enter" : "toast-exit",
      )}
    >
      <span className="text-base" aria-hidden="true">{icons[variant]}</span>
      {message}
    </div>
  );
}
