"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuToast } from "@/components/ui/NeuToast";
import { getClientToken } from "@/lib/auth";
import { listLibrary } from "@/lib/api";
import type { Ebook } from "@/lib/types";

export default function LibraryPage() {
  const router = useRouter();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "verified">("all");
  const [message, setMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const token = getClientToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    listLibrary(token)
      .then(setEbooks)
      .catch((err) => {
        setEbooks([]);
        setMessage("Security Synchronization Failed.");
        setToastOpen(true);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = ebooks.filter((item) => {
    if (filter === "active") return item.isPaymentReview === false;
    if (filter === "verified") return item.hasPurchased === true;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="brutalist-header">
        <h1 className="font-['Anton']">Personal Vault</h1>
        <p className="font-['Bebas_Neue'] text-2xl uppercase">Secured Protocol Repository</p>
        <p className="tagline font-['Anton'] text-[#b83227] text-xl mt-2 uppercase tracking-wider">Restricted Access // Authorized Personnel Only</p>
      </header>

      <main className="section-container space-y-16">
        
        {/* Filtering */}
        <section className="p-0 w-full flex flex-wrap gap-4 border-b-4 border-black pb-8">
           {(["all", "active", "verified"] as const).map(f => (
             <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`px-8 py-3 border-2 border-black font-['Bebas_Neue'] text-xl uppercase tracking-widest transition-all ${
                 filter === f ? 'bg-black text-white' : 'bg-white text-black shadow-[4px_4px_0px_black]'
               }`}
             >
               {f} Protocols
             </button>
           ))}
        </section>

        {/* Protocol List */}
        <section className="p-0 w-full space-y-8">
          {loading ? (
            <div className="py-20 text-center border-2 border-black shadow-[8px_8px_0px_black]">
               <p className="font-['Bebas_Neue'] text-4xl animate-pulse">Synchronizing Data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-black">
               <h3 className="text-4xl mb-4 font-['Anton']">Vault Empty</h3>
               <p className="font-['Inter'] mb-8 uppercase text-sm tracking-widest">No secured protocols found in your current clearance level.</p>
               <Link href="/">
                  <button className="brutalist-button accent">Browse Marketplace →</button>
               </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filtered.map((item) => (
                <div key={item.id} className="brutalist-card p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-40 h-56 flex-shrink-0 border-2 border-black overflow-hidden shadow-[4px_4px_0px_black]">
                     <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 space-y-4 text-center md:text-left">
                     <div className="flex flex-col md:flex-row md:items-center gap-4 justify-center md:justify-start">
                        <h3 className="text-4xl font-['Anton']">{item.title}</h3>
                        <NeuBadge tone={item.isPaymentReview ? 'warning' : 'success'}>
                           Clearance: {item.isPaymentReview ? 'Under Review' : 'Verified'}
                        </NeuBadge>
                     </div>
                     
                     <p className="font-['Inter'] text-gray-600 max-w-2xl text-sm uppercase tracking-tight">
                        Category: {item.category || "General"} // 
                        Identifier: PRTCL-{item.id.toString().padStart(6, '0')}
                     </p>

                     <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                        <Link href={`/ebook/${item.id}`}>
                           <button className="brutalist-button primary">Access Data</button>
                        </Link>
                        <button className="brutalist-button secondary">Protocol Intel</button>
                     </div>
                  </div>

                  <div className="hidden lg:block">
                     <p className="font-['Bebas_Neue'] text-sm text-gray-400 uppercase tracking-[0.3em] [writing-mode:vertical-lr] rotate-180">SECURE ACCESS</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="mt-24 border-t-4 border-black p-12 text-center font-['Bebas_Neue'] tracking-[0.2em] uppercase">
         <p>Secure Terminal // Session Active</p>
      </footer>

      <NeuToast message={message} open={toastOpen} variant="error" onClose={() => setToastOpen(false)} />
    </div>
  );
}
