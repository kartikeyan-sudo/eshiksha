"use client";

import { cn } from "@/lib/utils";

type NeuToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  className?: string;
};

export function NeuToggle({ checked, onChange, ariaLabel, className }: NeuToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "neu-inset relative h-7 w-12 rounded-full cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        "transition-colors duration-200",
        checked ? "bg-[var(--accent-soft)]" : "",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 block h-6 w-6 rounded-full bg-[var(--accent)] shadow-md transition-transform duration-300 ease-out",
          checked ? "left-[calc(100%-1.625rem)]" : "left-0.5",
        )}
      />
    </button>
  );
}
