"use client";

import { cn } from "@/lib/utils";

type RadioOption = {
  label: string;
  value: string;
};

type NeuRadioProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  className?: string;
};

export function NeuRadio({ name, value, onChange, options, className }: NeuRadioProps) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="sr-only">{name}</legend>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <label key={option.value} className="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                isSelected ? "border-[var(--accent)]" : "border-[var(--text-muted)]",
              )}
            >
              {isSelected ? (
                <span className="block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              ) : null}
            </button>
            <span className="text-sm text-[var(--text-secondary)]">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
