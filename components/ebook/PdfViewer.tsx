"use client";

import { useEffect, useRef, useState } from "react";
import { createViewerApp } from "@document-kits/viewer";
import type { ViewerApp } from "@document-kits/viewer";
import { NeuToast } from "@/components/ui/NeuToast";
import Link from "next/link";

type PdfViewerProps = {
  ebookId: number;
  title?: string;
  fileUrl: string;
  token?: string | null;
  previewPages: number;
  purchased: boolean;
  onUnlockRequest?: () => void;
};

export function PdfViewer({ ebookId, title, fileUrl, token, previewPages, purchased, onUnlockRequest }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerAppRef = useRef<ViewerApp | null>(null);
  const [error, setError] = useState("");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let app: ViewerApp | null = null;
    let objectUrl = "";
    
    const fetchPdf = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = "Bearer " + token;
        }

        const res = await fetch(fileUrl, { headers });
        if (!res.ok) throw new Error("Failed to load PDF");
        
        const blob = await res.blob();
        if (!isMounted) return;

        objectUrl = URL.createObjectURL(blob);

        app = createViewerApp({
          parent: containerRef.current!,
          src: objectUrl,
          resourcePath: "/document-viewer/",
        });
        
        viewerAppRef.current = app;
      } catch (err: any) {
        if (isMounted) setError(err.message || "Could not load document.");
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;
      if (app && app.cleanup) {
        try { app.cleanup(); } catch (e) {}
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileUrl, token, purchased, previewPages]);

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* LEFT SIDEBAR: Chapters & Progress */}
      <aside className={`transition-all duration-500 border-r border-white/5 glass-panel z-30 ${leftSidebarOpen ? "w-80" : "w-0 -translate-x-full"}`}>
        <div className="p-8 space-y-12 w-80">
          <div className="flex items-center justify-between">
            <Link href={`/ebook/${ebookId}`} className="text-xl font-black tracking-tighter hover:text-blue-500">
               ESHIKSHA<span className="text-blue-500">.</span>
            </Link>
            <button onClick={() => setLeftSidebarOpen(false)} className="text-white/20 hover:text-white">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Protocol Progress</h4>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/3 rounded-full" />
               </div>
               <p className="text-[10px] font-bold text-white/40">32% Completed</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Chapters</h4>
              <ul className="space-y-1">
                {[
                  "Introduction to Macros",
                  "Indian Diet Foundation",
                  "The Protein Mastery",
                  "Meal Prep Secrets",
                  "Advanced Tracking"
                ].map((chap, i) => (
                  <li key={i} className={`p-3 rounded-xl cursor-pointer transition-all ${i === 0 ? "bg-white/5 text-blue-400" : "text-white/40 hover:bg-white/5 hover:text-white"}`}>
                    <span className="text-xs font-bold">{i+1}. {chap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER: Reading Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            {!leftSidebarOpen && (
              <button onClick={() => setLeftSidebarOpen(true)} className="text-white/40 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
            )}
            <h1 className="text-xs font-black uppercase tracking-widest truncate max-w-[200px]">{title || "Reading Protocol"}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rightSidebarOpen ? "bg-blue-500 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
               System Tools
            </button>
          </div>
        </header>

        {/* PDF Area */}
        <div className="flex-1 relative bg-[#0a0a0a]">
          <div ref={containerRef} className="w-full h-full border-none"></div>
          
          {/* Watermark/Branding */}
          <div className="absolute bottom-8 right-8 pointer-events-none opacity-10">
             <span className="text-4xl font-black tracking-tighter">ESHIKSHA</span>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Tools & Notes */}
      <aside className={`transition-all duration-500 border-l border-white/5 glass-panel z-30 ${rightSidebarOpen ? "w-80" : "w-0 translate-x-full"}`}>
        <div className="p-8 space-y-12 w-80">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">System Tools</h4>
            <button onClick={() => setRightSidebarOpen(false)} className="text-white/20 hover:text-white">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="space-y-10">
            {/* Calorie Widget */}
            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 space-y-4">
               <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Macro Target</div>
               <div className="flex items-end gap-2">
                  <span className="text-4xl font-black">2400</span>
                  <span className="text-[10px] font-bold text-white/40 pb-2">KCAL</span>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-[10px] font-black text-blue-400">P</div>
                    <div className="text-xs font-bold text-white">180g</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-red-400">F</div>
                    <div className="text-xs font-bold text-white">60g</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-yellow-400">C</div>
                    <div className="text-xs font-bold text-white">280g</div>
                  </div>
               </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Your Notes</h4>
              <textarea 
                placeholder="Capture insights..." 
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white/80 placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-all resize-none"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Highlights</h4>
              <div className="space-y-2">
                 {[
                   "Sustainable Indian diet systems",
                   "Macro ratios for bulk",
                   "Pre-workout meal timings"
                 ].map((h, i) => (
                   <div key={i} className="p-3 rounded-xl bg-white/5 text-[10px] font-medium text-white/60">
                      "{h}"
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <NeuToast message={error} open={!!error} variant="error" onClose={() => setError("")} />
    </div>
  );
}
