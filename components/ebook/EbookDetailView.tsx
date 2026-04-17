"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRazorpayOrder, downloadEbookFile, getEbookAccess, listRelatedBooks, purchaseEbook, trackEbookView, verifyRazorpayPayment } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuToast } from "@/components/ui/NeuToast";
import { EbookRatingPanel } from "@/components/ebook/EbookRatingPanel";
import { EbookCard } from "@/components/ebook/EbookCard";
import type { Ebook } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const PdfViewer = dynamic(() => import("@/components/ebook/PdfViewer").then((mod) => mod.PdfViewer), {
  ssr: false,
  loading: () => <div className="neu-raised rounded-2xl p-10 text-center text-sm text-[var(--text-muted)]">Preparing reader...</div>,
});

const EmbedPdfPreview = dynamic(() => import("@/components/ebook/EmbedPdfPreview").then((mod) => mod.EmbedPdfPreview), {
  ssr: false,
  loading: () => <div className="neu-raised rounded-2xl p-10 text-center text-sm text-[var(--text-muted)]">Preparing preview...</div>,
});

type EbookDetailViewProps = {
  ebook: Ebook;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    const timeoutMs = 10000;
    const startedAt = Date.now();

    const checkLoaded = () => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }

      window.setTimeout(checkLoaded, 120);
    };

    const existing = document.querySelector('script[data-razorpay="checkout"]') as HTMLScriptElement | null;
    if (existing) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      existing.addEventListener("load", checkLoaded, { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      checkLoaded();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "checkout";
    script.onload = checkLoaded;
    script.onerror = () => resolve(false);
    document.body.appendChild(script);

    checkLoaded();
  });
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="rating-stars text-lg" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`} className="rating-star filled">★</span>
      ))}
      {half && <span className="rating-star filled">★</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`} className="rating-star">★</span>
      ))}
    </span>
  );
}

export function EbookDetailView({ ebook }: EbookDetailViewProps) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState("");
  const [viewerToken, setViewerToken] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(Boolean(ebook.hasPurchased || ebook.isFree));
  const [previewPages, setPreviewPages] = useState(ebook.previewPages);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [buying, setBuying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<Ebook[]>([]);

  useEffect(() => {
    void trackEbookView(ebook.id).catch(() => null);

    // Fetch related books
    listRelatedBooks(ebook.id, ebook.category)
      .then(setRelatedBooks)
      .catch(() => setRelatedBooks([]));
  }, [ebook.id, ebook.category]);

  const openReader = async () => {
    const token = getClientToken();
    if (!token) {
      setToastVariant("error");
      setMessage("Please login to access preview");
      setShowToast(true);
      router.push("/login");
      return;
    }

    setLoadingAccess(true);

    try {
      const access = await getEbookAccess(ebook.id, token);
      setPdfUrl(access.pdfUrl);
      setViewerToken(token);
      setHasAccess(access.hasAccess);
      setPreviewPages(access.previewPages);
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Could not open reader");
      setShowToast(true);
    } finally {
      setLoadingAccess(false);
    }
  };

  const buyNow = async () => {
    const token = getClientToken();
    if (!token) {
      setToastVariant("error");
      setMessage("Please login to purchase");
      setShowToast(true);
      router.push("/login");
      return;
    }

    setBuying(true);

    try {
      if (ebook.isFree) {
        await purchaseEbook(ebook.id, token);
        const access = await getEbookAccess(ebook.id, token);
        setPdfUrl(access.pdfUrl);
        setViewerToken(token);
        setHasAccess(access.hasAccess);
        setPreviewPages(access.previewPages);
        setToastVariant("success");
        setMessage("Ebook unlocked.");
        setShowToast(true);
        return;
      }

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error("Could not load payment gateway. Please try again.");
      }

      const order = await createRazorpayOrder(ebook.id, token);

      if (order.alreadyPurchased || order.isFree) {
        const accessResult = await getEbookAccess(ebook.id, token);
        setPdfUrl(accessResult.pdfUrl);
        setViewerToken(token);
        setHasAccess(accessResult.hasAccess);
        setPreviewPages(accessResult.previewPages);
        setToastVariant("success");
        setMessage(order.message || "Access granted.");
        setShowToast(true);
        return;
      }

      if (!order.orderId || !order.keyId || !order.amount || !order.currency) {
        throw new Error("Payment order creation failed");
      }

      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error("Payment gateway is not available in this browser session"));
          return;
        }

        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "EShikhsha",
          description: `Purchase ${ebook.title}`,
          order_id: order.orderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await verifyRazorpayPayment(ebook.id, response, token);
              resolve();
            } catch (verifyError) {
              reject(verifyError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
          theme: {
            color: "#7c3aed",
          },
        });

        rzp.open();
      });

      const access = await getEbookAccess(ebook.id, token);
      setPdfUrl(access.pdfUrl);
      setViewerToken(token);
      setHasAccess(access.hasAccess);
      setPreviewPages(access.previewPages);
      setToastVariant("success");
      setMessage("Purchase successful. Full access granted.");
      setShowToast(true);
      
      // Auto-open reader and scroll to it
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);

    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Purchase failed");
      setShowToast(true);
    } finally {
      setBuying(false);
    }
  };

  const downloadEbook = async () => {
    const token = getClientToken();
    if (!token) {
      setToastVariant("error");
      setMessage("Please login to download");
      setShowToast(true);
      router.push("/login");
      return;
    }

    setDownloading(true);
    try {
      const blob = await downloadEbookFile(ebook.id, token);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${ebook.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Download failed");
      setShowToast(true);
    } finally {
      setDownloading(false);
    }
  };

  const hasRating = (ebook.averageRating || 0) > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Main Info Section */}
      <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="premium-card overflow-hidden">
          <img src={ebook.coverUrl} alt={ebook.title} className="h-full w-full object-cover" />
        </div>

        <div className="glass-surface rounded-2xl p-6 md:p-8">
          {/* Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <NeuBadge tone={hasAccess ? "success" : "warning"}>{hasAccess ? "Purchased" : "Preview Mode"}</NeuBadge>
            {ebook.isFree && <NeuBadge tone="success">Free</NeuBadge>}
            {ebook.category && <NeuBadge tone="info">{ebook.category}</NeuBadge>}
            <NeuBadge tone="info">{previewPages} preview pages</NeuBadge>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-[var(--text-primary)] leading-tight">{ebook.title}</h1>

          {/* Rating */}
          {hasRating && (
            <div className="mt-3 flex items-center gap-2">
              <RatingStars rating={ebook.averageRating || 0} />
              <span className="text-sm text-[var(--text-muted)]">
                {(ebook.averageRating || 0).toFixed(1)} ({ebook.ratingsCount || 0} review{(ebook.ratingsCount || 0) !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          {/* Description */}
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{ebook.description}</p>

          {/* Tags */}
          {ebook.tags && ebook.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {ebook.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            {ebook.viewsCount ? (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {ebook.viewsCount} views
              </span>
            ) : null}
            <span>{previewPages} preview pages</span>
          </div>

          {/* Price + Actions */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-3xl font-bold text-[var(--accent)]">{ebook.isFree ? "Free" : formatINR(ebook.price)}</p>
            <div className="flex flex-wrap gap-2">
              <NeuButton onClick={openReader} loading={loadingAccess}>
                {hasAccess ? "Read Full Ebook" : "Open Preview"}
              </NeuButton>
              {!hasAccess ? (
                <NeuButton variant="secondary" onClick={buyNow} loading={buying}>
                  Buy Now
                </NeuButton>
              ) : (
                <NeuButton variant="secondary" onClick={downloadEbook} loading={downloading}>
                  Download PDF
                </NeuButton>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PDF Viewer */}
      {pdfUrl ? (
        <PdfViewer
          ebookId={ebook.id}
          title={ebook.title}
          fileUrl={pdfUrl}
          token={viewerToken}
          previewPages={previewPages}
          purchased={hasAccess}
          onUnlockRequest={buyNow}
        />
      ) : null}

      {/* Ratings */}
      <EbookRatingPanel ebookId={ebook.id} />

      {/* Related Books */}
      {relatedBooks.length > 0 && (
        <section className="space-y-4">
          <h2 className="section-title">
            <span>🔁</span> Related Books
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {relatedBooks.map((item) => (
              <div key={item.id}>
                <EbookCard ebook={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      <NeuToast message={message} open={showToast} variant={toastVariant} onClose={() => setShowToast(false)} />
    </div>
  );
}
