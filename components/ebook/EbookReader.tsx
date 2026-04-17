"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuProgress } from "@/components/ui/NeuProgress";
import type { Ebook } from "@/lib/mock-data";

type EbookReaderProps = {
  ebook: Ebook;
  mode?: "preview" | "full";
};

export function EbookReader({ ebook, mode = "full" }: EbookReaderProps) {
  const lines = mode === "preview" ? ebook.previewLines : ebook.fullLines;
  const [currentLine, setCurrentLine] = useState(0);

  const progress = useMemo(() => {
    if (lines.length === 0) return 0;
    return Math.round(((currentLine + 1) / lines.length) * 100);
  }, [currentLine, lines.length]);

  const goNext = () => {
    if (currentLine < lines.length - 1) setCurrentLine((p) => p + 1);
  };

  const goPrev = () => {
    if (currentLine > 0) setCurrentLine((p) => p - 1);
  };

  return (
    <div className="flex flex-col min-h-[60vh]">
      {/* Sticky Top Bar */}
      <div className="glass-navbar sticky top-0 z-20 flex items-center justify-between rounded-t-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/ebook/${ebook.id}`}>
            <NeuButton variant="ghost" className="h-9 w-9 min-h-0 p-0" aria-label="Back to ebook details">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </NeuButton>
          </Link>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">{ebook.title}</h2>
            <p className="text-xs text-[var(--text-muted)]">{ebook.author}</p>
          </div>
        </div>
        <span className="text-sm font-medium text-[var(--accent)]">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <NeuProgress value={progress} className="rounded-none h-1" />

      {/* Reading Content */}
      <div className="flex-1 neu-raised rounded-b-2xl p-6 md:p-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="animate-fade-in" key={currentLine}>
            <span className="mb-4 inline-block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Section {currentLine + 1} of {lines.length}
            </span>
            <p className="text-lg leading-9 text-[var(--text-secondary)] font-[var(--font-mono)]">
              {lines[currentLine]}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="glass-surface mt-3 flex items-center justify-between rounded-2xl px-5 py-3">
        <NeuButton variant="ghost" onClick={goPrev} disabled={currentLine === 0} className="text-xs">
          ← Previous
        </NeuButton>
        <span className="text-xs text-[var(--text-muted)]">
          {currentLine + 1} / {lines.length}
        </span>
        <NeuButton variant="ghost" onClick={goNext} disabled={currentLine >= lines.length - 1} className="text-xs">
          Next →
        </NeuButton>
      </div>
    </div>
  );
}
