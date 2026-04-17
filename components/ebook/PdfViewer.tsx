"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createViewerApp } from "@document-kits/viewer";
import { NeuButton } from "@/components/ui/NeuButton";

type PdfViewerProps = {
  ebookId: number;
  title?: string;
  fileUrl: string;
  token?: string | null;
  previewPages: number;
  purchased: boolean;
  onUnlockRequest?: () => void;
};

type ViewerEventBus = {
  on: (eventName: string, callback: (event: { pageNumber?: number; pagesCount?: number }) => void) => void;
  off?: (eventName: string, callback: (event: { pageNumber?: number; pagesCount?: number }) => void) => void;
};

type ViewerInstance = {
  initializedPromise?: Promise<unknown>;
  eventBus?: ViewerEventBus;
  page?: number;
  pagesCount?: number;
  close?: () => void;
  cleanup?: () => void;
  pdfViewer?: {
    currentPageNumber?: number;
    pagesCount?: number;
  };
};

function getTotalPages(viewer: ViewerInstance): number {
  return viewer.pagesCount || viewer.pdfViewer?.pagesCount || 0;
}

function getCurrentPage(viewer: ViewerInstance): number {
  return viewer.page || viewer.pdfViewer?.currentPageNumber || 1;
}

function setCurrentPage(viewer: ViewerInstance, pageNumber: number) {
  if (typeof viewer.page === "number") {
    viewer.page = pageNumber;
    return;
  }

  if (viewer.pdfViewer && typeof viewer.pdfViewer.currentPageNumber === "number") {
    viewer.pdfViewer.currentPageNumber = pageNumber;
  }
}

export function PdfViewer({ ebookId, title, fileUrl, token, previewPages, purchased, onUnlockRequest }: PdfViewerProps) {
  const router = useRouter();
  const readerRef = useRef<HTMLDivElement | null>(null);
  const viewerHostRef = useRef<HTMLDivElement | null>(null);
  const viewerAppRef = useRef<ViewerInstance | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerMessage, setViewerMessage] = useState("");

  const sourceUrl = useMemo(() => fileUrl, [fileUrl]);
  const maxAllowedPage = purchased ? numPages || 1 : Math.max(1, previewPages);
  const showLockOverlay = !purchased && numPages > previewPages && pageNumber >= maxAllowedPage;

  const toggleFullscreen = () => {
    const container = readerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => null);
      return;
    }

    document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => null);
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const host = viewerHostRef.current;
    if (!host || !sourceUrl) return;

    let disposed = false;
    const controller = new AbortController();
    let pageHandler: ((event: { pageNumber?: number }) => void) | undefined;
    let pagesHandler: ((event: { pagesCount?: number }) => void) | undefined;

    setViewerMessage("");
    setPageNumber(1);
    setNumPages(0);
    host.innerHTML = "";

    const initializeViewer = async () => {
      let source: string | ArrayBuffer = sourceUrl;

      if (token) {
        try {
          const response = await fetch(sourceUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          if (response.ok) {
            source = await response.arrayBuffer();
          }
        } catch {
          source = sourceUrl;
        }
      }

      if (disposed) return;

      const app = createViewerApp({
        parent: host,
        src: source,
        resourcePath: "/document-viewer",
        disableCORSCheck: true,
        disableAutoSetTitle: true,
        appOptions: {
          defaultZoomValue: "page-width",
          sidebarViewOnLoad: 0,
        },
      }) as ViewerInstance;

      viewerAppRef.current = app;

      pageHandler = (event) => {
        if (disposed) return;
        const nextPage = event.pageNumber || getCurrentPage(app);
        const maxPreview = Math.max(1, previewPages);

        if (!purchased && nextPage > maxPreview) {
          setCurrentPage(app, maxPreview);
          setPageNumber(maxPreview);
          setViewerMessage("Preview limit reached. Unlock the ebook to continue.");
          onUnlockRequest?.();
          return;
        }

        setPageNumber(nextPage);
      };

      pagesHandler = (event) => {
        if (disposed) return;
        const total = event.pagesCount || getTotalPages(app);
        setNumPages(total);
      };

      app.eventBus?.on("pagechanging", pageHandler);
      app.eventBus?.on("pagesloaded", pagesHandler);

      app.initializedPromise
        ?.then(() => {
          if (disposed) return;
          const total = getTotalPages(app);
          setNumPages(total);

          const maxPreview = Math.max(1, previewPages);
          if (!purchased && getCurrentPage(app) > maxPreview) {
            setCurrentPage(app, maxPreview);
            setPageNumber(maxPreview);
          } else {
            setPageNumber(getCurrentPage(app));
          }
        })
        .catch(() => {
          if (disposed) return;
          setViewerMessage("Could not initialize PDF viewer.");
        });
    };

    initializeViewer().catch(() => {
      if (disposed) return;
      setViewerMessage("Could not load PDF viewer.");
    });

    return () => {
      disposed = true;
      controller.abort();
      const app = viewerAppRef.current;

      if (app && pageHandler) {
        app.eventBus?.off?.("pagechanging", pageHandler);
      }

      if (app && pagesHandler) {
        app.eventBus?.off?.("pagesloaded", pagesHandler);
      }

      app?.close?.();
      app?.cleanup?.();
      viewerAppRef.current = null;

      if (host) {
        host.innerHTML = "";
      }
    };
  }, [sourceUrl, token, previewPages, purchased, onUnlockRequest]);

  return (
    <section
      ref={readerRef}
      data-ebook-id={ebookId}
      className={`space-y-3 ${isFullscreen ? "fixed inset-0 z-50 overflow-auto bg-[var(--reader-bg)] p-3 sm:p-4" : ""}`}
    >
      <div className="glass-surface flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-4">
        <NeuButton variant="ghost" className="text-xs" onClick={() => (isFullscreen ? toggleFullscreen() : router.back())}>
          Back
        </NeuButton>

        <p className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
          {title || "Ebook Reader"}
        </p>

        <NeuButton variant="ghost" className="text-xs" onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </NeuButton>
      </div>

      <div className="neu-raised relative overflow-hidden rounded-2xl p-2 sm:p-3">
        <div
          ref={viewerHostRef}
          className="reader-document-viewer h-[58vh] min-h-[420px] w-full sm:h-[70vh] lg:h-[76vh]"
        />

        {showLockOverlay ? (
          <div className="absolute inset-x-4 bottom-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface)]/95 p-4 backdrop-blur sm:inset-x-6 sm:bottom-6">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Preview limit reached</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Unlock full access to continue reading all pages.</p>
            <NeuButton className="mt-3 text-xs" onClick={onUnlockRequest}>
              Unlock Full Ebook
            </NeuButton>
          </div>
        ) : null}
      </div>

      <div className="glass-surface flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3 text-xs text-[var(--text-secondary)] sm:text-sm">
        <span>
          Page {Math.min(pageNumber, maxAllowedPage)} of {maxAllowedPage}
        </span>
        {!purchased && numPages > previewPages ? <span className="text-[var(--warning)]">Preview mode active</span> : null}
      </div>

      {viewerMessage ? <p className="text-center text-xs text-[var(--text-muted)]">{viewerMessage}</p> : null}
    </section>
  );
}
