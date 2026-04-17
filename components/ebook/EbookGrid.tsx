"use client";

import type { Ebook } from "@/lib/types";
import { EbookCard } from "@/components/ebook/EbookCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

type EbookGridProps = {
  items: Ebook[];
  loading?: boolean;
};

export function EbookGrid({ items, loading }: EbookGridProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading ebooks">
        <SkeletonLoader shape="card" count={4} />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] p-12 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mx-auto mb-4" strokeLinecap="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        <p className="text-sm text-[var(--text-muted)]">No ebooks found</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children" aria-label="Ebook catalog">
      {items.map((item) => (
        <div key={item.id}>
          <EbookCard ebook={item} />
        </div>
      ))}
    </section>
  );
}
