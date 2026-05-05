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
};

export function EmbedPdfPreview({ fileUrl, title, previewPages, onUnlockRequest }: EmbedPdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerAppRef = useRef<ViewerApp | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let app: ViewerApp | null = null;
    let objectUrl = "";

    const fetchPdf = async () => {
      try {
        const res = await fetch(fileUrl);
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
  }, [fileUrl]);

  return (
    <section className="neu-raised overflow-hidden rounded-2xl border border-[var(--glass-border)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Preview PDF</h3>
          <p className="text-xs text-[var(--text-muted)]">Showing a limited preview for {title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--warning)]/10 px-2.5 py-1 text-xs font-medium text-[var(--warning)]">
            Preview limit: {previewPages} pages
          </span>
          <button
            type="button"
            onClick={onUnlockRequest}
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Unlock full book
          </button>
        </div>
      </header>

      <div className="h-[520px] w-full bg-[var(--surface)] relative">
        <div ref={containerRef} className="w-full h-full"></div>
        <NeuToast message={error} open={!!error} variant="error" onClose={() => setError("")} />
      </div>
    </section>
  );
}
