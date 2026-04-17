"use client";

import { cn } from "@/lib/utils";

type NeuTooltipProps = {
  content: string;
  children: React.ReactNode;
  className?: string;
};

export function NeuTooltip({ content, children, className }: NeuTooltipProps) {
  return (
    <div className={cn("group relative inline-block", className)}>
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-95 rounded-lg bg-[var(--text-primary)] px-3 py-1.5 text-xs text-[var(--bg)] opacity-0 shadow-lg transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap"
      >
        {content}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--text-primary)]" />
      </div>
    </div>
  );
}
