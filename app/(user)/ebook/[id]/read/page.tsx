"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { getEbookAccess } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import { NeuToast } from "@/components/ui/NeuToast";
import type { Ebook } from "@/lib/types";

const PdfViewer = dynamic(() => import("@/components/ebook/PdfViewer").then((mod) => mod.PdfViewer), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen text-[var(--text-muted)]">Loading reader...</div>,
});

export default function EbookReadPage() {
  const params = useParams();
  const router = useRouter();
  const rawEbookId = params.id;
  const ebookId = Array.isArray(rawEbookId) ? rawEbookId[0] : rawEbookId;
  const ebookIdNumber = Number(ebookId);
  
  const [pdfUrl, setPdfUrl] = useState("");
  const [viewerToken, setViewerToken] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [previewPages, setPreviewPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchEbookAccess = async () => {
      if (!ebookId) {
        setLoading(false);
        return;
      }

      const token = getClientToken();
      if (!token) {
        setToastVariant("error");
        setMessage("Please login to read this ebook");
        setShowToast(true);
        router.push("/login");
        return;
      }

      try {
        const access = await getEbookAccess(ebookId, token);
        setPdfUrl(access.pdfUrl);
        setViewerToken(token);
        setHasAccess(access.hasAccess);
        setPreviewPages(access.previewPages);
      } catch (error) {
        setToastVariant("error");
        setMessage(error instanceof Error ? error.message : "Could not load reader");
        setShowToast(true);
        // Optionally redirect back after delay
        setTimeout(() => window.close(), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchEbookAccess();
  }, [ebookId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--text-muted)]">Loading reader...</div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-[var(--text-muted)]">Could not load the ebook</div>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)]"
        >
          Close window
        </button>
      </div>
    );
  }

  if (!Number.isFinite(ebookIdNumber)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-[var(--text-muted)]">Invalid ebook id</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)]"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PdfViewer
        ebookId={ebookIdNumber}
        title={`Ebook ${ebookId}`}
        fileUrl={pdfUrl}
        token={viewerToken}
        previewPages={previewPages}
        purchased={hasAccess}
        onUnlockRequest={() => {
          setToastVariant("error");
          setMessage("Please purchase this ebook first");
          setShowToast(true);
        }}
      />
      
      <NeuToast message={message} open={showToast} variant={toastVariant} onClose={() => setShowToast(false)} />
    </div>
  );
}
