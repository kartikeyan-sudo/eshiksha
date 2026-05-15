"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Ebook } from "@/lib/types";
import { getClientToken } from "@/lib/auth";
import { formatINR } from "@/lib/utils";

type EbookCardProps = {
  ebook: Ebook;
  compact?: boolean;
};

const CATEGORY_ACCENTS: Record<string, string> = {
  "Lean Build": "accent-lean",
  "Bulky Build": "accent-bulky",
  "Shredded": "accent-shredded",
  "Power Lifter": "accent-power",
};

export function EbookCard({ ebook, compact }: EbookCardProps) {
  const router = useRouter();

  const onViewClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const token = getClientToken();
    if (token) return;

    event.preventDefault();
    router.push("/login");
  };

  const isFree = ebook.isFree || ebook.price <= 0;
  const accentClass = CATEGORY_ACCENTS[ebook.category || ""] || "accent-lean";

  return (
    <article className={`ebook-card-v2 group ${accentClass} glow-on-hover`}>
      <img
        src={ebook.coverUrl}
        alt={ebook.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      
      <div className="overlay" />

      {/* Content Overlay */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        {/* Category & Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          {ebook.category && (
            <span className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/5">
              {ebook.category}
            </span>
          )}
        </div>

        {/* Price Tag */}
        <div className="absolute top-4 right-4">
          <span className={`px-2.5 py-1 rounded-md text-xs font-black backdrop-blur-md border border-white/10 ${
            isFree ? "text-green-400 bg-green-400/10" : "text-white bg-white/10"
          }`}>
            {isFree ? "FREE" : formatINR(ebook.price)}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-lg font-black leading-tight text-white line-clamp-2">
            {ebook.title}
          </h3>
          
          {!compact && (
            <p className="text-xs text-white/60 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {ebook.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
             <Link 
              href={`/ebook/${ebook.id}`} 
              onClick={onViewClick}
              className="px-5 py-2 rounded-full bg-white text-black text-xs font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all"
            >
              Explore
            </Link>
            
            {ebook.viewsCount ? (
              <span className="text-[10px] font-bold text-white/40 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {ebook.viewsCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
