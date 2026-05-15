"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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

export default function Home() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [trending, setTrending] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Auto-slide logic
  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(trending.length, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [trending]);

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

  const featuredSlides = trending.slice(0, 5);

  return (
    <div className="relative min-h-screen">
      <div className="nebula-bg" />
      
      <div className="mx-auto w-full max-w-7xl space-y-24 px-4 py-8 pb-24 md:px-8 md:pb-8">
        
        {/* ═══════ PREMIUM SLIDESHOW HERO ═══════ */}
        <section className="relative h-[600px] md:h-[700px] w-full overflow-hidden rounded-[3rem] bg-[#050505] border border-white/5 shadow-2xl">
          {featuredSlides.length > 0 ? (
            featuredSlides.map((ebook, index) => (
              <div
                key={ebook.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-100 scale-100 z-10" : "opacity-0 scale-110 z-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                <img src={ebook.coverUrl} className="h-full w-full object-cover blur-[2px] opacity-40" />
                
                <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-20 z-20 space-y-6 md:space-y-8 max-w-4xl">
                  <div className="inline-flex items-center gap-3 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 px-4 py-2 text-[10px] font-black tracking-[0.2em] text-[var(--accent)] uppercase backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    Featured Protocol
                  </div>
                  <h2 className="text-4xl md:text-8xl font-black leading-[0.9] text-white tracking-tighter uppercase line-clamp-2">
                    {ebook.title}
                  </h2>
                  <p className="max-w-xl text-sm md:text-xl text-[var(--text-secondary)] font-medium line-clamp-3 md:line-clamp-none">
                    {ebook.description}
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                    <Link href={`/ebook/${ebook.id}`}>
                      <button className="px-10 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-[0.95]">
                        Access Data →
                      </button>
                    </Link>
                    <div className="hidden md:block">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Protocol Value</p>
                      <p className="text-xl font-black text-white">INR {ebook.price}</p>
                    </div>
                  </div>
                </div>

                <div className="absolute right-12 bottom-12 hidden lg:block z-30">
                   <div className="relative h-96 w-72 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group">
                      <img src={ebook.coverUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
               <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
          )}

          {/* Slide Indicators */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex gap-3">
             {featuredSlides.map((_, idx) => (
               <button 
                key={idx} 
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-12 bg-white' : 'w-4 bg-white/20'}`} 
               />
             ))}
          </div>
        </section>

        {/* ═══════ SEARCH + DISCOVERY ═══════ */}
        <section id="featured" className="space-y-12 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  Main Collection
               </div>
               <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Discover Data</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
               <div className="relative w-full sm:w-80 h-14">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by ID, Category, Tag..."
                    className="w-full h-full bg-white/5 border border-white/5 rounded-2xl px-12 text-sm text-white focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-muted)] placeholder:uppercase placeholder:font-black placeholder:text-[9px] placeholder:tracking-widest"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</div>
               </div>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
            {categories.map((value) => (
              <button
                key={value}
                onClick={() => setCategory(value)}
                className={`h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  value === category ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]" : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
                }`}
              >
                {value !== "All" && <span className="mr-2 opacity-60">{getCategoryIcon(value)}</span>}
                {value}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <SkeletonLoader shape="card" count={8} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              {filtered.map((item) => (
                <div key={item.id}>
                  <EbookCard ebook={item} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══════ TRENDING / CATEGORIES ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <section className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-3">
                 <span className="text-2xl">🔥</span>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">Active Protocols</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {trending.slice(0, 4).map(item => (
                    <EbookCard key={item.id} ebook={item} compact />
                 ))}
              </div>
           </section>

           <section className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-3">
                 <span className="text-2xl">🏷️</span>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">Taxonomy</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                 {categories.filter(c => c !== 'All').map(cat => (
                    <button 
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        document.getElementById("featured")?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-4 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-[var(--accent)] transition-all flex items-center gap-3"
                    >
                       <span className="text-xl">{getCategoryIcon(cat)}</span>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">{cat}</span>
                    </button>
                 ))}
              </div>
           </section>
        </div>

        {/* ═══════ FOOTER CTA ═══════ */}
        <section className="relative overflow-hidden rounded-[3rem] bg-[var(--accent)] p-12 md:p-24 text-center">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
           <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">Complete your<br />Digital Vault</h2>
              <p className="text-white/80 font-medium max-w-lg mx-auto text-lg uppercase tracking-tight">Secure your access to the world's most elite protocol library today.</p>
              <button className="px-12 py-6 rounded-[2rem] bg-black text-white font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                 Initialize Access
              </button>
           </div>
        </section>

      </div>
    </div>
  );
}
