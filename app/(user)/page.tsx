"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EbookCard } from "@/components/ebook/EbookCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { listEbooks, listTrendingEbooks } from "@/lib/api";
import type { Ebook } from "@/lib/types";

const CATEGORY_ICONS: Record<string, string> = {
  General: "📚",
  Cybersecurity: "🔒",
  Programming: "💻",
  Networking: "🌐",
  "Web Development": "🌍",
  "Data Science": "📊",
  "Cloud Computing": "☁️",
  "Machine Learning": "🧠",
  DevOps: "⚙️",
  Security: "🛡️",
  Linux: "🐧",
  Python: "🐍",
  JavaScript: "📜",
  Hacking: "🎯",
  Blockchain: "⛓️",
  AI: "🤖",
};

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] || "📖";
}

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const starSize = size === "md" ? "text-base" : "text-xs";

  return (
    <span className={`rating-stars ${starSize}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`} className="rating-star filled">★</span>
      ))}
      {half && <span className="rating-star filled">★</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`} className="rating-star">★</span>
      ))}
      <span className="ml-1 text-xs text-[var(--text-muted)]">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function Home() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [trending, setTrending] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    Promise.all([listEbooks(), listTrendingEbooks().catch(() => [])])
      .then(([ebookList, trendingList]) => {
        setEbooks(ebookList);
        setTrending(trendingList);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ebooks.map((item) => item.category || "General"))).sort((a, b) =>
      a.localeCompare(b),
    );
    return ["All", ...cats];
  }, [ebooks]);

  const filtered = useMemo(() => {
    return ebooks.filter((item) => {
      const matchCategory = category === "All" || (item.category || "General") === category;
      const needle = debouncedSearch.toLowerCase();
      const matchSearch =
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        (item.tags || []).some((tag) => tag.toLowerCase().includes(needle));
      return matchCategory && matchSearch;
    });
  }, [ebooks, category, debouncedSearch]);

  const newReleases = useMemo(() => {
    return [...ebooks].sort((a, b) => b.id - a.id).slice(0, 8);
  }, [ebooks]);

  const topRated = useMemo(() => {
    return [...ebooks]
      .filter((item) => (item.averageRating || 0) > 0)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 8);
  }, [ebooks]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-6 pb-24 md:px-8 md:pb-8">
      {/* ═══════ PREMIUM MATTE HERO ═══════ */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 p-8 md:p-24 animate-fade-in shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[var(--accent)]/10 blur-[100px] md:blur-[140px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_10px_var(--accent)]" />
            Universal Protocol v2.0
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black leading-[1] text-white tracking-tighter uppercase">
            ELEVATE YOUR 
            <br />
            <span className="text-[var(--text-muted)]">KNOWLEDGE.</span>
          </h1>
          
          <p className="mt-8 max-w-lg text-lg md:text-xl leading-relaxed text-[var(--text-secondary)] font-medium">
            The elite digital library for curated protocols, academic insights, and strategic learning.
          </p>
          
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="#featured"
              className="px-10 py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-[0.95] shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
            >
              BROWSE COLLECTION
            </Link>
            <Link
              href="/library"
              className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-widest transition-all hover:bg-white/10"
            >
              MY VAULT →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ SEARCH + FILTER BAR ═══════ */}
      <section id="featured" className="space-y-4 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="section-title">
            <span>📖</span> Featured Ebooks
          </h2>
          <span className="text-sm text-[var(--text-muted)]">
            {loading ? "Loading..." : `${filtered.length} titles`}
          </span>
        </div>

        <div className="glass-surface rounded-2xl p-4 space-y-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, description, or tag..."
              className="w-full rounded-xl border border-[var(--glass-border)] bg-transparent py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`category-chip ${value === category ? "active" : ""}`}
              >
                {value !== "All" && <span className="chip-icon">{getCategoryIcon(value)}</span>}
                {value}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SkeletonLoader shape="card" count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {filtered.map((item) => (
              <div key={item.id}>
                <EbookCard ebook={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════ TRENDING BOOKS ═══════ */}
      {trending.length > 0 && (
        <section className="space-y-4 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <div className="section-header">
            <h2 className="section-title">
              <span>🔥</span> Trending Books
            </h2>
            <span className="text-sm text-[var(--text-muted)]">Based on purchases + views</span>
          </div>
          <div className="horizontal-scroll">
            {trending.map((item, index) => (
              <div key={item.id} className="w-64 flex-shrink-0" style={{ animationDelay: `${index * 60}ms` }}>
                <EbookCard ebook={item} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ CATEGORIES SECTION ═══════ */}
      <section id="categories" className="space-y-4 animate-slide-up" style={{ animationDelay: "120ms" }}>
        <div className="section-header">
          <h2 className="section-title">
            <span>🏷️</span> Browse by Category
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories
            .filter((c) => c !== "All")
            .map((cat) => {
              const count = ebooks.filter((e) => (e.category || "General") === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="premium-card flex flex-col items-center gap-2 p-5 text-center cursor-pointer"
                >
                  <span className="text-3xl">{getCategoryIcon(cat)}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{cat}</span>
                  <span className="text-xs text-[var(--text-muted)]">{count} ebook{count !== 1 ? "s" : ""}</span>
                </button>
              );
            })}
        </div>
      </section>

      {/* ═══════ NEW RELEASES ═══════ */}
      {newReleases.length > 0 && (
        <section className="space-y-4 animate-slide-up" style={{ animationDelay: "160ms" }}>
          <div className="section-header">
            <h2 className="section-title">
              <span>🆕</span> New Releases
            </h2>
          </div>
          <div className="horizontal-scroll">
            {newReleases.map((item, index) => (
              <div key={item.id} className="w-64 flex-shrink-0" style={{ animationDelay: `${index * 60}ms` }}>
                <EbookCard ebook={item} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ TOP RATED ═══════ */}
      {topRated.length > 0 && (
        <section className="space-y-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="section-header">
            <h2 className="section-title">
              <span>⭐</span> Top Rated
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {topRated.map((item) => (
              <div key={item.id}>
                <EbookCard ebook={item} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
