"use client";

import { useEffect, useRef, useState } from "react";
import { createViewerApp } from "@document-kits/viewer";
import type { ViewerApp } from "@document-kits/viewer";
import { NeuToast } from "@/components/ui/NeuToast";

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

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let app: ViewerApp | null = null;
    let objectUrl = "";
    
    // Fetch the PDF using the token
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
    <div className="w-full h-screen relative">
      <div ref={containerRef} className="w-full h-full border-none"></div>
      <NeuToast message={error} open={!!error} variant="error" onClose={() => setError("")} />
    </div>
  );
}
