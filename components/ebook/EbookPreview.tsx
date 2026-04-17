"use client";

import { useState } from "react";
import { NeuButton } from "@/components/ui/NeuButton";
import type { Ebook } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";

type EbookPreviewProps = {
  ebook: Ebook;
  onBuy: () => void;
  onRead: () => void;
};

export function EbookPreview({ ebook, onBuy, onRead }: EbookPreviewProps) {
  const totalPages = ebook.previewLines.length;
  const [currentPage, setCurrentPage] = useState(0);
  const previewLimit = ebook.previewPageCount;
  const isLocked = currentPage >= previewLimit;

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const goPrev = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  return (
    <article className="neu-raised relative rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Preview Mode</h2>
        <span className="text-xs font-medium text-[var(--text-muted)]">
          Page {currentPage + 1} of {totalPages + 1}
        </span>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[320px] p-6">
        {isLocked ? (
          /* Locked Overlay */
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[var(--bg)]/80 backdrop-blur-md p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Preview Limit Reached</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                Unlock the full ebook to continue reading all {ebook.pages} pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <NeuButton onClick={onBuy}>
                🔓 Unlock — {formatINR(ebook.price)}
              </NeuButton>
              {ebook.isOwned ? (
                <NeuButton variant="secondary" onClick={onRead}>
                  Read Full Book
                </NeuButton>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Page Content */}
        <div className={isLocked ? "blur-sm select-none" : ""}>
          {currentPage < totalPages ? (
            <div className="animate-fade-in">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1">
                <span className="text-xs font-medium text-[var(--accent)]">Page {currentPage + 1}</span>
              </div>
              <p className="text-base leading-8 text-[var(--text-secondary)]">
                {ebook.previewLines[currentPage]}
              </p>
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-[var(--text-muted)]">
              End of preview content
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-5 py-3">
        <NeuButton
          variant="ghost"
          onClick={goPrev}
          disabled={currentPage === 0}
          className="text-xs"
          aria-label="Previous page"
        >
          ← Previous
        </NeuButton>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalPages + 1 }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentPage ? "w-4 bg-[var(--accent)]" : i < previewLimit ? "w-1.5 bg-[var(--text-muted)]" : "w-1.5 bg-[var(--danger)]/40"
              }`}
            />
          ))}
        </div>

        <NeuButton
          variant="ghost"
          onClick={goNext}
          disabled={currentPage >= totalPages}
          className="text-xs"
          aria-label="Next page"
        >
          Next →
        </NeuButton>
      </div>
    </article>
  );
}
