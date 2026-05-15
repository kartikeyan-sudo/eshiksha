"use client";

import { useEffect, useRef, useState } from "react";
import { createViewerApp } from "@document-kits/viewer";
import type { ViewerApp } from "@document-kits/viewer";
import { NeuToast } from "@/components/ui/NeuToast";

type EmbedPdfPreviewProps = {
  fileUrl: string;
  title: string;
  previewPages: number;
  onUnlockRequest: () => void;
  token?: string;
};

export function EmbedPdfPreview({ fileUrl, title, previewPages, onUnlockRequest, token }: EmbedPdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerAppRef = useRef<ViewerApp | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !fileUrl) return;

    let isMounted = true;
    let app: ViewerApp | null = null;
    let objectUrl = "";

    const fetchPdf = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(fileUrl, { headers });
        if (!res.ok) throw new Error("Could not load secure document preview.");
        
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
      } finally {
        if (isMounted) setLoading(false);
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
  }, [fileUrl, token]);

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#0a0a0a] border border-white/5 shadow-2xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 p-6 bg-white/5 backdrop-blur-md">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tighter">Preview Protocol</h3>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Digital Insights: {title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-[10px] font-black text-[var(--accent)] uppercase tracking-widest border border-[var(--accent)]/20">
            {previewPages} Pages Unlocked
          </span>
          <button
            type="button"
            onClick={onUnlockRequest}
            className="rounded-xl bg-white px-5 py-2 text-[10px] font-black text-black uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-[0.95]"
          >
            Unlock Full
          </button>
        </div>
      </header>

      <div className="h-[600px] w-full bg-[#050505] relative">
        <div ref={containerRef} className="w-full h-full"></div>
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/80 backdrop-blur-sm z-10">
             <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--accent)] rounded-full animate-spin mb-4" />
             <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Synchronizing Stream...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#050505] z-20">
             <div className="text-4xl mb-4">⚠️</div>
             <p className="text-sm font-black text-white uppercase tracking-tight mb-2">Decryption Error</p>
             <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>
      <NeuToast message={error} open={!!error} variant="error" onClose={() => setError("")} />
    </section>
  );
}
