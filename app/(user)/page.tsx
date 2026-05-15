"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EbookCard } from "@/components/ebook/EbookCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { listEbooks, listTrendingEbooks } from "@/lib/api";
import type { Ebook } from "@/lib/types";

const FEATURED_SERIES = [
  {
    id: 'lean',
    title: 'Lean Build',
    desc: 'Master the art of aesthetic muscle without the fat.',
    img: '/images/lean_build.png',
    accent: 'accent-lean',
    price: 499
  },
  {
    id: 'bulky',
    title: 'Bulky Build',
    desc: 'Massive strength and raw power for the hardgainers.',
    img: '/images/bulky_build.png',
    accent: 'accent-bulky',
    price: 599
  },
  {
    id: 'shredded',
    title: 'Shredded',
    desc: 'Peak conditioning and paper-thin skin systems.',
    img: '/images/shredded.png',
    accent: 'accent-shredded',
    price: 449
  },
  {
    id: 'power',
    title: 'Power Lifter',
    desc: 'Maximum performance and elite strength protocols.',
    img: '/images/power_lifter.png',
    accent: 'accent-power',
    price: 699
  }
];

export default function Home() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [trending, setTrending] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listEbooks(), listTrendingEbooks().catch(() => [])])
      .then(([ebookList, trendingList]) => {
        setEbooks(ebookList);
        setTrending(trendingList);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full pb-20 overflow-x-hidden">
      
      {/* ═══════ 1. HERO SECTION ═══════ */}
      <section className="relative h-[90vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0">
          <img 
            src="/images/hero.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/40" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
          <div className="max-w-3xl space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Premium Fitness Protocols</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter text-white">
              NOOB <br/> TO PRO
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 max-w-xl font-medium leading-relaxed">
              Master Fitness Nutrition with Practical <span className="text-white">Indian Diet Systems</span>. Designed for those who demand excellence and discipline.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="#featured" className="btn-premium flex items-center justify-center gap-2">
                Start Reading
              </Link>
              <Link href="/library" className="btn-glass flex items-center justify-center gap-2 text-white">
                Explore Series
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-6 space-y-32 mt-20">
        
        {/* ═══════ 2. FEATURED SERIES SECTION ═══════ */}
        <section id="featured" className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">PREMIUM SERIES</h2>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Elite Protocols for every goal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURED_SERIES.map((series, idx) => (
              <div 
                key={series.id} 
                className={`ebook-card-v2 group ${series.accent} glow-on-hover animate-fade-in`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <img src={series.img} alt={series.title} className="h-full w-full object-cover" />
                <div className="overlay" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="absolute top-6 left-6">
                    <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white/90 border border-white/5">
                      Elite Series
                    </span>
                  </div>
                  <div className="space-y-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-2xl font-black text-white">{series.title}</h3>
                    <p className="text-xs text-white/60 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {series.desc}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-black text-white">₹{series.price}</span>
                      <button className="px-6 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-tighter">Get Now</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ 3. WHY CHOOSE US SECTION ═══════ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-4xl font-black tracking-tighter text-white leading-tight">WHY <br/> ESHIKSHA?</h2>
            <p className="text-white/40 text-lg leading-relaxed font-medium">
              We don't just sell books. We provide a blueprint for a legendary transformation using systems that actually work in an Indian household.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Indian Meal Plans", desc: "No more expensive avocados. Real Indian food for real gains.", icon: "🍛" },
              { title: "Budget Friendly", desc: "Nutrition that fits your pocket without compromising macros.", icon: "💰" },
              { title: "USDA Data", desc: "Scientifically backed nutrition data for accurate tracking.", icon: "🔬" },
              { title: "Beginner Ready", desc: "Simple guides that turn noobs into experts in weeks.", icon: "🔰" }
            ].map((item, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-3xl group hover:border-white/20 transition-all">
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ 4. INSIDE THE EBOOK ═══════ */}
        <section className="glass-panel rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white">INSIDE THE <br/> PROTOCOL</h2>
              <p className="text-white/40 text-xl font-medium">Visual. Interactive. Data-Driven.</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">40+</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Macro Charts</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">12</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Workout Tables</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">50+</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Food Options</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-black text-white">HD</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Illustrations</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="aspect-square w-full max-w-md mx-auto bg-gradient-to-br from-white/10 to-transparent rounded-3xl border border-white/10 p-8 flex items-center justify-center">
                {/* Mock UI Element */}
                <div className="w-full space-y-6">
                   <div className="flex justify-between items-end">
                      <div className="h-24 w-8 bg-blue-500 rounded-t-lg animate-bounce" style={{animationDuration: '2s'}}/>
                      <div className="h-32 w-8 bg-blue-400 rounded-t-lg animate-bounce" style={{animationDuration: '2.5s'}}/>
                      <div className="h-40 w-8 bg-blue-600 rounded-t-lg animate-bounce" style={{animationDuration: '1.8s'}}/>
                      <div className="h-28 w-8 bg-blue-300 rounded-t-lg animate-bounce" style={{animationDuration: '3s'}}/>
                   </div>
                   <div className="h-2 w-full bg-white/10 rounded-full">
                      <div className="h-full w-2/3 bg-blue-500 rounded-full animate-pulse" />
                   </div>
                   <div className="text-center text-[10px] font-bold text-white/20 tracking-widest">REAL-TIME MACRO TRACKING</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ 5. USER TRANSFORMATIONS ═══════ */}
        <section className="space-y-16">
          <div className="text-center">
            <h2 className="text-5xl font-black tracking-tighter text-white">TRANSFORMATIONS</h2>
            <p className="text-white/40 mt-4 font-bold tracking-widest">Real people. Real discipline.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel p-6 rounded-3xl space-y-6">
                <div className="aspect-[4/5] bg-white/5 rounded-2xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/5">
                    <p className="text-xs font-bold text-white italic">"Lost 12kg in 3 months following the Shredded protocol. The diet was so sustainable."</p>
                    <div className="mt-3 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-500" />
                       <span className="text-[10px] font-black text-white/80">User #{i}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ 6. PRICING SECTION ═══════ */}
        <section className="space-y-16">
           <div className="text-center">
            <h2 className="text-5xl font-black tracking-tighter text-white">JOIN THE ELITE</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
             <div className="glass-panel p-10 rounded-[2.5rem] space-y-6 border-white/5 order-2 md:order-1">
                <h3 className="text-2xl font-black text-white/60">Single Ebook</h3>
                <div className="text-5xl font-black text-white">₹499</div>
                <ul className="space-y-4 text-sm text-white/40 font-medium">
                   <li className="flex items-center gap-2">✓ Full PDF Access</li>
                   <li className="flex items-center gap-2">✓ Lifetime Updates</li>
                   <li className="flex items-center gap-2">✓ Mobile Reading UI</li>
                </ul>
                <button className="w-full py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">Buy Single</button>
             </div>

             <div className="glass-panel p-12 rounded-[3rem] space-y-8 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.2)] transform scale-110 z-20 order-1 md:order-2 bg-gradient-to-b from-blue-500/10 to-transparent">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Best Value</div>
                <h3 className="text-3xl font-black text-white">Master Bundle</h3>
                <div className="text-7xl font-black text-white">₹1499</div>
                <ul className="space-y-4 text-base text-white/70 font-bold">
                   <li className="flex items-center gap-2 text-blue-400">✓ All 4 Elite Series</li>
                   <li className="flex items-center gap-2">✓ Priority Support</li>
                   <li className="flex items-center gap-2">✓ Bonus Recipe Guide</li>
                   <li className="flex items-center gap-2">✓ Workout Tracker App</li>
                </ul>
                <button className="w-full py-5 rounded-full bg-blue-500 text-white font-black text-lg shadow-xl hover:bg-blue-600 transition-all active:scale-95">Unlock Everything</button>
             </div>

             <div className="glass-panel p-10 rounded-[2.5rem] space-y-6 border-white/5 order-3 md:order-3">
                <h3 className="text-2xl font-black text-white/60">Premium Access</h3>
                <div className="text-5xl font-black text-white">₹1999</div>
                <ul className="space-y-4 text-sm text-white/40 font-medium">
                   <li className="flex items-center gap-2">✓ Bundle + Consultation</li>
                   <li className="flex items-center gap-2">✓ Private Discord</li>
                   <li className="flex items-center gap-2">✓ Monthly Webinars</li>
                </ul>
                <button className="w-full py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">Go Pro</button>
             </div>
          </div>
        </section>

        {/* ═══════ EXPLORE ALL (Dynamic) ═══════ */}
        <section id="all-ebooks" className="space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <h2 className="text-3xl font-black tracking-tighter text-white">EXPLORE ALL</h2>
            <Link href="/library" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">View Library →</Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <SkeletonLoader shape="card" count={4} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              {ebooks.map((item) => (
                <div key={item.id}>
                  <EbookCard ebook={item} />
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
