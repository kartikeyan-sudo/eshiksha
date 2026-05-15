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
    <article className={`relative group flex h-full flex-col bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] ${compact ? "min-h-0" : ""}`}>
      {/* Cover */}
      <div className={`relative w-full overflow-hidden ${compact ? "h-40" : "h-64"}`}>
        <img
          src={ebook.coverUrl}
          alt={ebook.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Category Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 rounded-md bg-black/60 text-[8px] font-black text-white uppercase tracking-widest backdrop-blur-md border border-white/10">
            {ebook.category || "General"}
          </span>
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3">
          <div className="px-3 py-1.5 rounded-lg bg-white text-black font-black text-[10px] shadow-2xl">
            {isFree ? "FREE" : formatINR(ebook.price)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-1 flex-col gap-3 ${compact ? "p-3" : "p-5"}`}>
        <div className="space-y-1">
          <h3 className={`font-black text-white line-clamp-1 leading-tight tracking-tight uppercase ${compact ? "text-[10px]" : "text-sm"}`}>
            {ebook.title}
          </h3>
          {!compact && (
            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed font-medium">{ebook.description}</p>
          )}
        </div>

        {/* Bottom Info */}
        <div className="mt-auto flex items-center justify-between pt-2">
          {hasRating ? (
            <div className="flex items-center gap-1.5">
              <RatingStars rating={ebook.averageRating || 0} />
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter">
                {(ebook.averageRating || 0).toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Unrated</span>
          )}
          
          <Link 
            href={`/ebook/${ebook.id}`} 
            onClick={onViewClick}
            className={`rounded-full font-black uppercase tracking-widest transition-all ${
              compact ? "p-2 bg-white/5 text-[var(--accent)]" : "px-4 py-2 bg-white/5 text-[var(--accent)] text-[9px] hover:bg-[var(--accent)] hover:text-white"
            }`}
          >
            {compact ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            ) : "View"}
          </Link>
        </div>
      </div>
    </article>
  );
}
