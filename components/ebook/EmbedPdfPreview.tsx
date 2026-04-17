"use client";

import { PDFViewer } from "@embedpdf/react-pdf-viewer";

type EmbedPdfPreviewProps = {
  fileUrl: string;
  title: string;
  previewPages: number;
  onUnlockRequest: () => void;
};

export function EmbedPdfPreview({ fileUrl, title, previewPages, onUnlockRequest }: EmbedPdfPreviewProps) {
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

      <div className="h-[520px] w-full bg-[var(--surface)]">
        <PDFViewer
          config={{
            src: fileUrl,
            theme: { preference: "light" },
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </section>
  );
}
