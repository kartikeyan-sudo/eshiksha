"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = {
  title: string;
  content: React.ReactNode;
};

type NeuAccordionProps = {
  items: Item[];
};

export function NeuAccordion({ items }: NeuAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <section key={item.title} className="neu-raised rounded-xl overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left hover:bg-[var(--accent-soft)] transition-colors duration-200"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="font-medium text-[var(--text-primary)]">{item.title}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={cn("transition-transform duration-200 text-[var(--text-muted)]", isOpen && "rotate-180")}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className={cn("accordion-panel", isOpen ? "open" : "closed")}>
              <div className="px-4 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">{item.content}</div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
