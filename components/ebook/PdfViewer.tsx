"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { NeuButton } from "@/components/ui/NeuButton";
import { addBookmark, addNote, deleteBookmark, deleteNote, getReadingProgress, listBookmarks, listNotes, updateReadingProgress } from "@/lib/api";
import type { Bookmark, Note } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const router = useRouter();
  const viewerPaneRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [resumePage, setResumePage] = useState(1);
  const [pageWidth, setPageWidth] = useState(900);
  const [pageTurnDirection, setPageTurnDirection] = useState<"forward" | "backward" | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [viewerMessage, setViewerMessage] = useState("");
  const [readerDarkMode, setReaderDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [pageJump, setPageJump] = useState("");
  const [showUI, setShowUI] = useState(true);

  const maxAllowedPage = useMemo(() => {
    return numPages || 1;
  }, [numPages]);

  const maxPreviewPageNumber = Math.max(1, previewPages);
  const isBlurred = !purchased && pageNumber > maxPreviewPageNumber;

  const goNext = useCallback(() => {
    if (pageNumber >= maxAllowedPage) return;
    setPageTurnDirection("forward");
    setPageNumber((current) => Math.min(current + 1, maxAllowedPage));
  }, [pageNumber, maxAllowedPage]);

  const goPrevious = useCallback(() => {
    if (pageNumber <= 1) return;
    setPageTurnDirection("backward");
    setPageNumber((current) => Math.max(current - 1, 1));
  }, [pageNumber]);

  // Keyboard navigation
  const toggleFullscreen = useCallback(() => {
    const container = viewerPaneRef.current?.closest(".reader-container");
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrevious();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious, toggleFullscreen]);

  // Page jump handler
  const onPageJump = () => {
    const target = parseInt(pageJump, 10);
    if (!Number.isNaN(target) && target >= 1 && target <= maxAllowedPage) {
      setPageTurnDirection(target > pageNumber ? "forward" : "backward");
      setPageNumber(target);
      setPageJump("");
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const container = viewerPaneRef.current;
    if (!container) return;

    const updatePageWidth = () => {
      const nextWidth = Math.max(240, Math.floor(container.clientWidth - 16));
      setPageWidth(Math.min(nextWidth, 940));
    };

    updatePageWidth();
    const resizeObserver = new ResizeObserver(() => updatePageWidth());
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!pageTurnDirection) return;
    const turnReset = window.setTimeout(() => setPageTurnDirection(null), 440);
    return () => window.clearTimeout(turnReset);
  }, [pageTurnDirection]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([getReadingProgress(ebookId, token), listBookmarks(ebookId, token), listNotes(ebookId, token)])
      .then(([progressResult, bookmarkResult, noteResult]) => {
        if (cancelled) return;
        setResumePage(Math.max(1, progressResult.progress.lastPage || 1));
        setBookmarks(bookmarkResult);
        setNotes(noteResult);
      })
      .catch(() => {
        if (cancelled) return;
        setViewerMessage("Could not load saved reading data.");
      });

    return () => { cancelled = true; };
  }, [ebookId, token]);

  useEffect(() => {
    if (!token || numPages <= 0) return;

    const saveTimer = window.setTimeout(() => {
      updateReadingProgress(
        {
          ebookId,
          lastPage: pageNumber,
          progressPercent: maxAllowedPage > 0 ? Math.round((pageNumber / maxAllowedPage) * 100) : 0,
        },
        token,
      ).catch(() => setViewerMessage("Could not save reading progress."));
    }, 400);

    return () => window.clearTimeout(saveTimer);
  }, [ebookId, maxAllowedPage, numPages, pageNumber, token]);

  const progressValue = maxAllowedPage > 0 ? Math.round((pageNumber / maxAllowedPage) * 100) : 0;
  const showLockOverlay = isBlurred;
  const currentPageBookmark = bookmarks.find((bookmark) => bookmark.pageNumber === pageNumber);
  const documentFile = useMemo(
    () => ({
      url: fileUrl,
      httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    [fileUrl, token],
  );

  const onToggleBookmark = async () => {
    if (!token) {
      setViewerMessage("Login required for bookmarks.");
      return;
    }

    try {
      if (currentPageBookmark) {
        await deleteBookmark(currentPageBookmark.id, token);
        setBookmarks((current) => current.filter((item) => item.id !== currentPageBookmark.id));
        setViewerMessage(`Bookmark removed from page ${pageNumber}.`);
        return;
      }

      const created = await addBookmark({ ebookId, pageNumber }, token);
      setBookmarks((current) => [...current.filter((item) => item.id !== created.bookmark.id), created.bookmark]);
      setViewerMessage(`Bookmarked page ${pageNumber}.`);
    } catch {
      setViewerMessage("Could not update bookmark.");
    }
  };

  const appendSelectedTextToDraft = () => {
    const selected = window.getSelection()?.toString().trim() || "";
    if (!selected) {
      setViewerMessage("Select text in the PDF first.");
      return;
    }
    setNoteDraft((current) => (current ? `${current}\n\n${selected}` : selected));
  };

  const onAddNote = async () => {
    if (!token) { setViewerMessage("Login required for notes."); return; }
    const content = noteDraft.trim();
    if (!content) { setViewerMessage("Note cannot be empty."); return; }

    try {
      const created = await addNote({ ebookId, pageNumber, content }, token);
      setNotes((current) => [created.note, ...current]);
      setNoteDraft("");
      setViewerMessage("Note added.");
    } catch {
      setViewerMessage("Could not add note.");
    }
  };

  const onDeleteNote = async (noteId: number) => {
    if (!token) return;
    try {
      await deleteNote(noteId, token);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      setViewerMessage("Note deleted.");
    } catch {
      setViewerMessage("Could not delete note.");
    }
  };

  return (
    <div className={`reader-container space-y-4 ${readerDarkMode ? "reader-dark" : ""} ${isFullscreen ? "fixed inset-0 z-50 bg-[var(--reader-bg)] overflow-auto p-4" : ""}`}>
      {/* Sticky Header */}
      {showUI && (
        <div className="sticky top-3 z-30 glass-surface rounded-2xl px-3 py-3 md:px-4 transition-opacity duration-300">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Back */}
            <NeuButton variant="ghost" className="text-xs" onClick={() => isFullscreen ? toggleFullscreen() : router.back()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </NeuButton>

            {/* Title + Page info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{title || "Ebook Reader"}</p>
              <p className="text-xs text-[var(--text-muted)]">Page {pageNumber} of {purchased ? numPages || 1 : maxAllowedPage} • {progressValue}%</p>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--accent-soft)] md:w-32">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progressValue}%` }} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Page jump */}
              <div className="hidden sm:flex items-center gap-1">
                <input
                  type="number"
                  value={pageJump}
                  onChange={(e) => setPageJump(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onPageJump()}
                  placeholder="Go to"
                  min={1}
                  max={maxAllowedPage}
                  className="w-16 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-xs text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Bookmark */}
              <NeuButton variant="ghost" className="text-xs" onClick={onToggleBookmark}>
                {currentPageBookmark ? "★" : "☆"}
              </NeuButton>

              {/* Dark Mode */}
              <NeuButton variant="ghost" className="text-xs" onClick={() => setReaderDarkMode((p) => !p)}>
                {readerDarkMode ? "☀️" : "🌙"}
              </NeuButton>

              {/* Notes toggle */}
              <NeuButton variant="ghost" className="text-xs hidden lg:flex" onClick={() => setShowNotes((p) => !p)}>
                📝
              </NeuButton>

              {/* Fullscreen */}
              <NeuButton variant="ghost" className="text-xs" onClick={toggleFullscreen}>
                {isFullscreen ? "⊠" : "⛶"}
              </NeuButton>
            </div>
          </div>
        </div>
      )}

      <div className={`grid gap-4 relative ${showNotes && showUI ? "lg:grid-cols-[1fr_300px]" : ""}`}>
        {/* PDF Viewer */}
        <div ref={viewerPaneRef} className="neu-raised relative overflow-hidden rounded-2xl p-2 sm:p-3 md:p-6" style={{ background: readerDarkMode ? "var(--reader-bg)" : undefined }}>
          {/* Tap Zones for Page Turning & UI Toggle */}
          <div className="absolute inset-0 z-20 flex" onClick={() => setShowUI(!showUI)}>
            <div className="w-[30%] h-full" onClick={(e) => { e.stopPropagation(); goPrevious(); }} />
            <div className="w-[40%] h-full flex-1" />
            <div className="w-[30%] h-full" onClick={(e) => { e.stopPropagation(); goNext(); }} />
          </div>
          <Document
            file={documentFile}
            onLoadSuccess={({ numPages: loadedPages }) => {
              setNumPages(loadedPages);
              setPageNumber(Math.max(1, resumePage || Math.min(1, loadedPages)));
            }}
            loading={<div className="p-10 text-center text-sm text-[var(--text-muted)]">Loading PDF preview...</div>}
            error={<div className="p-10 text-center text-sm text-[var(--danger)]">Could not load PDF.</div>}
          >
            <div
              key={pageNumber}
              className={`pdf-page-wrap ${
                pageTurnDirection === "forward"
                  ? "pdf-page-flip-forward"
                  : pageTurnDirection === "backward"
                    ? "pdf-page-flip-backward"
                    : ""
              }`}
              style={{
                filter: isBlurred ? 'blur(8px)' : 'none',
                userSelect: isBlurred ? 'none' : 'auto',
                pointerEvents: isBlurred ? 'none' : 'auto',
                opacity: isBlurred ? 0.7 : 1,
                transition: 'filter 0.3s ease',
              }}
            >
              <Page pageNumber={pageNumber} width={pageWidth} renderTextLayer renderAnnotationLayer={false} />
            </div>
          </Document>

          {showLockOverlay ? (
            <div className="absolute inset-x-6 bottom-6 rounded-xl border border-[var(--glass-border)] bg-[var(--surface)]/95 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Preview limit reached</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Unlock full access to continue reading all pages.</p>
              <NeuButton className="mt-3 text-xs" onClick={onUnlockRequest}>Unlock Full Ebook</NeuButton>
            </div>
          ) : null}
        </div>

        {/* Notes Sidebar */}
        {showNotes && showUI && (
          <aside className="glass-surface h-fit rounded-2xl p-4 animate-fade-in relative z-30">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">📝 Notes</h3>
              <span className="text-xs text-[var(--text-muted)]">Page {pageNumber}</span>
            </div>

            {/* Bookmarks list */}
            {bookmarks.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Bookmarks</p>
                <div className="flex flex-wrap gap-1">
                  {bookmarks.map((bm) => (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => {
                        setPageTurnDirection(bm.pageNumber > pageNumber ? "forward" : "backward");
                        setPageNumber(bm.pageNumber);
                      }}
                      className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                        bm.pageNumber === pageNumber
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                      }`}
                    >
                      p.{bm.pageNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Write a note for this page..."
                className="neu-inset min-h-[80px] w-full rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <NeuButton variant="ghost" className="text-xs" onClick={appendSelectedTextToDraft}>
                  Use Selection
                </NeuButton>
                <NeuButton className="text-xs" onClick={onAddNote}>
                  Save Note
                </NeuButton>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No notes yet.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="neu-raised rounded-xl p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">Page {note.pageNumber}</span>
                      <button type="button" onClick={() => onDeleteNote(note.id)} className="text-xs text-[var(--danger)] hover:underline">
                        Delete
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-[var(--text-primary)] whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Page Navigation Footer */}
      {showUI && (
        <div className="glass-surface flex items-center justify-between rounded-2xl p-3 mb-20 md:mb-0 relative z-30 transition-opacity duration-300">
          <NeuButton variant="ghost" onClick={goPrevious} disabled={pageNumber <= 1}>
            ← Previous
          </NeuButton>
          <p className="text-sm text-[var(--text-secondary)]">
            Page {pageNumber} of {purchased ? numPages || 1 : maxAllowedPage}
          </p>
          <NeuButton variant="ghost" onClick={goNext} disabled={pageNumber >= maxAllowedPage}>
            Next →
          </NeuButton>
        </div>
      )}

      {!purchased && numPages > previewPages ? (
        <p className="text-center text-sm text-[var(--warning)]">
          Preview mode active. Buy this ebook to unlock all {numPages} pages.
        </p>
      ) : null}

      {viewerMessage ? <p className="text-center text-xs text-[var(--text-muted)]">{viewerMessage}</p> : null}
    </div>
  );
}
