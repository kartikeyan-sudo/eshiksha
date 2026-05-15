"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EbookCard } from "@/components/ebook/EbookCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { listEbooks, listTrendingEbooks } from "@/lib/api";
import type { Ebook } from "@/lib/types";

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
      return matchCategory && (!needle || item.title.toLowerCase().includes(needle));
    });
  }, [ebooks, category, debouncedSearch]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="brutalist-header">
        <h1 className="font-['Anton']">EShikhsha</h1>
        <p className="font-['Bebas_Neue'] text-2xl uppercase">Premium Universal Ebook Platform</p>
        <p className="tagline font-['Anton'] text-[#b83227] text-xl mt-2 uppercase tracking-wider">Curated Protocols for Elite Minds</p>
        
        <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 font-['Bebas_Neue'] text-lg list-none uppercase tracking-widest text-right w-full md:w-auto">
          <li>24/7 Access</li>
          <li>Global Delivery</li>
          <li>Secure Protocol</li>
          <li>Verified Content</li>
        </ul>
      </header>

      {/* Main Content */}
      <main className="section-container space-y-16">
        
        {/* Navigation / Filter */}
        <section className="p-0 w-full space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-black pb-4">
             <h2 className="text-4xl">Marketplace</h2>
             <input 
               type="search"
               placeholder="Search protocol..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full md:w-80 px-4 py-2 border-2 border-black font-['Inter'] uppercase text-xs tracking-widest focus:shadow-[4px_4px_0px_black] outline-none transition-all"
             />
          </div>
          
          <div className="flex flex-wrap gap-3">
             {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setCategory(cat)}
                 className={`px-4 py-2 border-2 border-black font-['Bebas_Neue'] uppercase tracking-widest transition-all ${
                   category === cat ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-black shadow-[3px_3px_0px_black]'
                 }`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </section>

        {/* Ebook List */}
        <section className="p-0 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {loading ? (
            <SkeletonLoader shape="card" count={6} />
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-black">
               <p className="font-['Bebas_Neue'] text-3xl uppercase">No Protocol Matches Found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="menu-item brutalist-card h-full flex flex-col">
                <div className="aspect-[3/4] border-b-2 border-black overflow-hidden bg-gray-100">
                   <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                </div>
                <div className="p-6 flex-1 flex flex-col space-y-4">
                   <div className="flex justify-between items-start">
                      <h3 className="text-3xl line-clamp-2">{item.title}</h3>
                      <span className="font-['Anton'] text-[#b83227] text-xl ml-2">₹{item.price}</span>
                   </div>
                   <p className="font-['Inter'] text-sm leading-relaxed line-clamp-3 text-gray-600">
                     {item.description}
                   </p>
                   <div className="pt-4 mt-auto">
                      <Link href={`/ebook/${item.id}`} className="block">
                         <button className="w-full brutalist-button primary py-3 text-lg">Initialize Access →</button>
                      </Link>
                   </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Categories Section */}
        <section className="p-0 w-full space-y-8">
           <h2 className="text-4xl border-b-4 border-black pb-2">Taxonomy</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.filter(c => c !== 'All').map(cat => (
                <div key={cat} className="p-6 border-2 border-black shadow-[4px_4px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all cursor-pointer" onClick={() => setCategory(cat)}>
                   <h4 className="text-2xl mb-2">{cat}</h4>
                   <p className="font-['Bebas_Neue'] text-sm text-gray-500 uppercase tracking-widest">
                     {ebooks.filter(e => e.category === cat).length} Acquisitions Available
                   </p>
                </div>
              ))}
           </div>
        </section>

        {/* Footer Info */}
        <section className="p-0 w-full grid grid-cols-1 md:grid-cols-2 gap-12 border-t-4 border-black pt-12">
           <div className="space-y-4">
              <h2 className="border-none text-5xl">Our Mission</h2>
              <p className="font-['Inter'] text-lg leading-relaxed">
                 EShikhsha is dedicated to the dissemination of verified knowledge and elite technical protocols. 
                 We believe in information sovereignty and secure distribution of intellectual assets.
              </p>
           </div>
           <div className="space-y-4">
              <h2 className="border-none text-5xl">Compliance</h2>
              <ul className="space-y-2 font-['Bebas_Neue'] text-2xl uppercase list-none">
                 <li>✓ SSL Encrypted Transactions</li>
                 <li>✓ Identity Protection</li>
                 <li>✓ Verified Sourcing</li>
                 <li>✓ Direct Payload Delivery</li>
              </ul>
           </div>
        </section>
      </main>

      <footer className="mt-24 bg-black text-white p-12 text-center font-['Bebas_Neue'] tracking-[0.2em] uppercase">
         <p>&copy; 2026 EShikhsha Universal // Secure Protocol Acquisition</p>
      </footer>
    </div>
  );
}
