"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Ebook } from "@/lib/types";
import { NeuButton } from "@/components/ui/NeuButton";
import { getClientToken } from "@/lib/auth";
import { formatINR } from "@/lib/utils";

type EbookCardProps = {
  ebook: Ebook;
  compact?: boolean;
};

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="rating-stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`} className="rating-star filled">★</span>
      ))}
      {half && <span className="rating-star filled">★</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`} className="rating-star">★</span>
      ))}
    </span>
  );
}

export function EbookCard({ ebook, compact }: EbookCardProps) {
  const router = useRouter();

  const onViewClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const token = getClientToken();
    if (token) return;

    event.preventDefault();
    router.push("/login");
  };

  const hasRating = (ebook.averageRating || 0) > 0;
  const isFree = ebook.isFree || ebook.price <= 0;

  return (
    <article className={`premium-card group flex h-full flex-col ${compact ? "min-h-0" : ""}`}>
      {/* Cover */}
      <div className={`relative w-full overflow-hidden ${compact ? "h-40" : "h-56"}`}>
        <img
          src={ebook.coverUrl}
          alt={ebook.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Category badge */}
        {ebook.category && (
          <span className="absolute top-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            {ebook.category}
          </span>
        )}

        {/* Price badge — fixed opacity syntax for Tailwind v4 */}
        <span className={`absolute top-3 right-3 rounded-lg px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${
          isFree
            ? "ebook-card-price-free"
            : "ebook-card-price-paid"
        }`}>
          {isFree ? "FREE" : formatINR(ebook.price)}
        </span>

        {/* Preview indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Preview {ebook.previewPages} pages
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-1 flex-col gap-2 ${compact ? "p-3" : "p-4"}`}>
        <div className="space-y-1">
          <h3 className={`font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug ${compact ? "text-sm" : "text-[0.9375rem]"}`}>
            {ebook.title}
          </h3>
          {!compact && (
            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{ebook.description}</p>
          )}
        </div>

        {/* Rating + Stats */}
        <div className="mt-auto flex items-center justify-between pt-1">
          {hasRating ? (
            <div className="flex items-center gap-1.5">
              <RatingStars rating={ebook.averageRating || 0} />
              <span className="text-xs text-[var(--text-muted)]">
                ({ebook.ratingsCount || 0})
              </span>
            </div>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">No ratings yet</span>
          )}
          {ebook.viewsCount ? (
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {ebook.viewsCount}
            </span>
          ) : null}
        </div>

        {/* CTA */}
        {!compact && (
          <Link href={`/ebook/${ebook.id}`} onClick={onViewClick} className="mt-2">
            <NeuButton className="w-full text-xs">View Ebook</NeuButton>
          </Link>
        )}
        {compact && (
          <Link
            href={`/ebook/${ebook.id}`}
            onClick={onViewClick}
            className="mt-1 block rounded-lg bg-[var(--accent)] px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            View
          </Link>
        )}
      </div>
    </article>
  );
}
