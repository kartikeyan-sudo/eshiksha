"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRazorpayOrder, downloadEbookFile, getEbookAccess, listRelatedBooks, purchaseEbook, trackEbookView, verifyRazorpayPayment, getPurchaseSettings, submitAlreadyPaid } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuModal } from "@/components/ui/NeuModal";
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
  const [hasAccess, setHasAccess] = useState(Boolean(ebook.hasPurchased || ebook.isFree));
  const [previewPages, setPreviewPages] = useState(ebook.previewPages);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [buying, setBuying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<Ebook[]>([]);
  const [allowAlreadyPaid, setAllowAlreadyPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentReview, setIsPaymentReview] = useState(false);

  useEffect(() => {
    void trackEbookView(ebook.id).catch(() => null);

    listRelatedBooks(ebook.id, ebook.category)
      .then(setRelatedBooks)
      .catch(() => setRelatedBooks([]));

    getPurchaseSettings()
      .then((res) => setAllowAlreadyPaid(res.allowAlreadyPaid))
      .catch(() => null);

    const token = getClientToken();
    if (token) {
      getEbookAccess(ebook.id, token)
        .then((access) => {
          if (access.isPaymentReview) setIsPaymentReview(true);
        })
        .catch(() => null);
    }
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

    window.open(`/ebook/${ebook.id}/read`, '_blank');
  };

  const handleBuyClick = () => {
    if (allowAlreadyPaid && !ebook.isFree) {
      setShowPaymentModal(true);
    } else {
      buyNow();
    }
  };

  const handleAlreadyPaid = async () => {
    setShowPaymentModal(false);
    const token = getClientToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setBuying(true);
    try {
      await submitAlreadyPaid(ebook.id, token);
      setIsPaymentReview(true);
      setToastVariant("success");
      setMessage("Payment submitted for review.");
      setShowToast(true);
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Could not submit payment");
      setShowToast(true);
    } finally {
      setBuying(false);
    }
  };

  const buyNow = async () => {
    setShowPaymentModal(false);
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
    <div className="space-y-10 animate-fade-in">
      {/* ═══════ MAIN DETAIL SECTION ═══════ */}
      <section className="ebook-detail-hero">
        {/* Cover Image Container */}
        <div className="ebook-detail-cover">
          <div className="ebook-cover-wrapper">
            <img
              src={ebook.coverUrl}
              alt={ebook.title}
              className="ebook-cover-img"
            />
            {/* Floating badges on cover */}
            <div className="ebook-cover-overlay">
              {ebook.isFree ? (
                <span className="ebook-price-float free">FREE</span>
              ) : (
                <span className="ebook-price-float">{formatINR(ebook.price)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="ebook-detail-info">
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <NeuBadge tone={hasAccess ? "success" : "warning"}>{hasAccess ? "✓ Purchased" : "Preview Mode"}</NeuBadge>
            {ebook.isFree && <NeuBadge tone="success">Free</NeuBadge>}
            {ebook.category && <NeuBadge tone="info">{ebook.category}</NeuBadge>}
          </div>

          {/* Title */}
          <h1 className="ebook-detail-title">{ebook.title}</h1>

          {/* Rating */}
          {hasRating && (
            <div className="flex items-center gap-3">
              <RatingStars rating={ebook.averageRating || 0} />
              <span className="text-sm text-[var(--text-muted)]">
                {(ebook.averageRating || 0).toFixed(1)} · {ebook.ratingsCount || 0} review{(ebook.ratingsCount || 0) !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="ebook-detail-desc">{ebook.description}</p>

          {/* Tags */}
          {ebook.tags && ebook.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {ebook.tags.map((tag) => (
                <span key={tag} className="ebook-tag">#{tag}</span>
              ))}
            </div>
          ) : null}

          {/* Stats row */}
          <div className="ebook-detail-stats">
            {ebook.viewsCount ? (
              <span className="ebook-stat-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {ebook.viewsCount} views
              </span>
            ) : null}
            <span className="ebook-stat-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {previewPages} preview pages
            </span>
          </div>

          {/* Divider */}
          <div className="ebook-detail-divider" />

          {/* Price + Actions */}
          <div className="ebook-detail-actions">
            <div className="ebook-price-section">
              <span className="ebook-price-label">Price</span>
              <span className="ebook-price-value">{ebook.isFree ? "Free" : formatINR(ebook.price)}</span>
            </div>

            <div className="ebook-action-buttons">
              {!hasAccess && (
                <NeuButton 
                  className={`ebook-buy-btn ${isPaymentReview ? 'review-mode' : ''}`}
                  onClick={isPaymentReview ? () => {} : handleBuyClick} 
                  loading={buying}
                  disabled={isPaymentReview}
                >
                  {isPaymentReview ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      Under Review
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                      Buy Now
                    </>
                  )}
                </NeuButton>
              )}
              
              <NeuButton 
                variant={hasAccess ? "primary" : "secondary"} 
                className="ebook-read-btn"
                onClick={openReader} 
                loading={loadingAccess}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                </svg>
                {hasAccess ? "Read Full Ebook" : "Open Preview"}
              </NeuButton>
              
              {hasAccess && (
                <NeuButton variant="secondary" className="ebook-download-btn" onClick={downloadEbook} loading={downloading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </NeuButton>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ RATINGS ═══════ */}
      <EbookRatingPanel ebookId={ebook.id} />

      {/* ═══════ RELATED BOOKS ═══════ */}
      {relatedBooks.length > 0 && (
        <section className="space-y-5">
          <h2 className="section-title">
            <span>📚</span> You May Also Like
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

      <NeuModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Select Payment Method">
        <div className="flex flex-col gap-4 mt-4">
          <NeuButton onClick={buyNow} className="w-full py-4 font-bold">
            <span className="flex items-center gap-2 m-auto text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Proceed with Razorpay
            </span>
          </NeuButton>
          <NeuButton variant="secondary" onClick={handleAlreadyPaid} className="w-full py-4 font-bold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            I have already paid
          </NeuButton>
        </div>
      </NeuModal>
    </div>
  );
}
