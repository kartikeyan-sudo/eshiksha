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
    if (!containerRef.current || !fileUrl) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let app: ViewerApp | null = null;
    let objectUrl = "";

    const fetchPdf = async () => {
      setLoading(true);
      setError("");
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(fileUrl, { headers });
        if (!res.ok) throw new Error("Access Denied: Could not synchronize preview stream.");
        
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
        if (isMounted) setError(err.message || "Protocol Failure.");
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
    <div className="brutalist-card bg-white border-2 border-black overflow-hidden flex flex-col">
      <header className="border-b-2 border-black p-6 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
        <div>
           <h3 className="text-2xl font-['Anton'] uppercase tracking-tight">Intel Preview</h3>
           <p className="font-['Bebas_Neue'] text-sm text-gray-500 uppercase tracking-widest">Protocol: {title}</p>
        </div>
        <div className="flex items-center gap-4">
           <span className="px-3 py-1 border-2 border-black bg-white font-['Bebas_Neue'] text-xs uppercase tracking-widest">
             {previewPages} Pages Unlocked
           </span>
           <button
             type="button"
             onClick={onUnlockRequest}
             className="brutalist-button accent py-2 px-4 text-sm"
           >
             Unlock Full Data
           </button>
        </div>
      </header>

      <div className="h-[650px] w-full bg-gray-200 relative">
        <div ref={containerRef} className="w-full h-full"></div>
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
             <div className="text-4xl animate-bounce">📡</div>
             <p className="font-['Bebas_Neue'] text-xl uppercase tracking-[0.2em] mt-4">Synchronizing Preview Stream...</p>
          </div>
        )}

        {(error || !fileUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-100 z-20">
             <div className="text-6xl mb-6">🚫</div>
             <h4 className="text-3xl font-['Anton'] uppercase mb-2">{error ? "SYNC ERROR" : "NO PROTOCOL"}</h4>
             <p className="font-['Bebas_Neue'] text-lg text-gray-500 uppercase tracking-widest">
               {error || "No preview data available for this identifier."}
             </p>
             {!fileUrl && (
               <button onClick={onUnlockRequest} className="mt-8 brutalist-button primary">
                  Initialize Acquisition
               </button>
             )}
          </div>
        )}
      </div>
      <NeuToast message={error} open={!!error} variant="error" onClose={() => setError("")} />
    </div>
  );
}
