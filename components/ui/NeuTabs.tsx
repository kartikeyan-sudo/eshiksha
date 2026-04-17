"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  content: React.ReactNode;
};

type NeuTabsProps = {
  tabs: Tab[];
  defaultIndex?: number;
};

export function NeuTabs({ tabs, defaultIndex = 0 }: NeuTabsProps) {
  const [active, setActive] = useState(defaultIndex);
  const id = useId();

  return (
    <div>
      <div role="tablist" aria-label="Content tabs" className="glass-surface mb-4 flex flex-wrap gap-1 rounded-xl p-1.5">
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.label}
              id={`${id}-tab-${index}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                selected
                  ? "bg-[var(--accent)] text-white font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== active}
          className="animate-fade-in"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
