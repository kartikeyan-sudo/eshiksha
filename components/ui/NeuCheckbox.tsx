"use client";

import { cn } from "@/lib/utils";

type NeuCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
};

export function NeuCheckbox({ checked, onChange, label, className }: NeuCheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3", className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          checked
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--text-muted)] bg-transparent",
        )}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : null}
      </button>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </label>
  );
}
