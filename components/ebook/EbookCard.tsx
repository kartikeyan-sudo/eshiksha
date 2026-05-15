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

export function EbookCard({ ebook, compact }: EbookCardProps) {
  const router = useRouter();

  const onViewClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const token = getClientToken();
    if (token) return;
    // Don't intercept if not needed, but keep existing logic for safety
  };

  const isFree = ebook.isFree || ebook.price <= 0;

  return (
    <article className={`brutalist-card h-full flex flex-col group ${compact ? "p-3" : "p-0 overflow-hidden"}`}>
      {/* Cover */}
      <div className={`relative w-full border-b-2 border-black overflow-hidden bg-gray-100 ${compact ? "h-40 border-2" : "h-64"}`}>
        <img
          src={ebook.coverUrl}
          alt={ebook.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
           <span className="px-3 py-1 border-2 border-black bg-white font-['Bebas_Neue'] text-xs uppercase tracking-widest">
             {ebook.category || "General"}
           </span>
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-1 flex-col gap-4 ${compact ? "pt-3 p-1" : "p-6"}`}>
        <div className="space-y-2">
           <div className="flex justify-between items-start gap-2">
              <h3 className="font-['Anton'] text-xl md:text-2xl uppercase tracking-tight leading-none line-clamp-2">
                {ebook.title}
              </h3>
              {!compact && (
                <span className="font-['Anton'] text-[#b83227] text-lg">
                  {isFree ? "FREE" : `₹${ebook.price}`}
                </span>
              )}
           </div>
           {!compact && (
             <p className="font-['Inter'] text-xs text-gray-600 line-clamp-3 leading-relaxed">
               {ebook.description}
             </p>
           )}
        </div>

        <div className="mt-auto pt-2">
           <Link 
             href={`/ebook/${ebook.id}`} 
             className={`block brutalist-button primary w-full text-center py-2 text-sm ${compact ? "text-xs" : ""}`}
           >
             Initialize Access →
           </Link>
        </div>
      </div>
    </article>
  );
}
