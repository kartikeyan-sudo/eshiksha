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
import { UpiPaymentModal } from "@/components/ebook/UpiPaymentModal";
import { submitUpiPayment } from "@/lib/api";
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
  const [isPaymentReview, setIsPaymentReview] = useState(Boolean(ebook.isPaymentReview));
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiDetails, setUpiDetails] = useState({ upiId: "", amount: 0 });

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
    buyNow();
  };

  const handleUpiSubmit = async (utr: string) => {
    const token = getClientToken();
    if (!token) return;

    setBuying(true);
    try {
      await submitUpiPayment(ebook.id, utr, token);
      setShowUpiModal(false);
      setIsPaymentReview(true);
      setToastVariant("success");
      setMessage("Soon the payment will be verified by the team and your ebook will be delivered to you!");
      setShowToast(true);
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Submission failed");
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

      // Request fresh order state from backend (respects real-time UPI/Razorpay toggle)
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

      if (order.isUpi) {
        setUpiDetails({
          upiId: order.adminUpiId || "",
          amount: order.ebook?.price || ebook.price,
        });
        setShowUpiModal(true);
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
      {/* ═══════ PREMIUM MATTE DETAIL ═══════ */}
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
        {/* Left: Cover */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-transparent blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-2xl">
              <img
                src={ebook.coverUrl}
                alt={ebook.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
                <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-black font-black text-sm">
                  {ebook.isFree ? "FREE ACCESS" : formatINR(ebook.price)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest">
                {ebook.category || "General Protocol"}
              </span>
              {hasAccess && (
                <span className="px-3 py-1 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-black uppercase tracking-widest">
                  ✓ Owned
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
              {ebook.title}
            </h1>

            {hasRating && (
              <div className="flex items-center gap-4 py-2">
                <RatingStars rating={ebook.averageRating || 0} />
                <span className="text-sm text-[var(--text-muted)] font-bold">
                  {(ebook.averageRating || 0).toFixed(1)} PROTOCOL SCORE
                </span>
              </div>
            )}
          </div>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-medium border-l-2 border-white/10 pl-6">
            {ebook.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Views</div>
                <div className="text-xl font-bold text-white">{ebook.viewsCount || 0}</div>
             </div>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Preview</div>
                <div className="text-xl font-bold text-white">{previewPages} Pages</div>
             </div>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Access</div>
                <div className="text-xl font-bold text-white">{hasAccess ? "Full" : "Limited"}</div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {!hasAccess && (
              <button 
                onClick={handleBuyClick}
                disabled={isPaymentReview || buying}
                className="flex-1 px-8 py-5 rounded-2xl bg-white text-black font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {isPaymentReview ? "UNDER REVIEW" : buying ? "PROCESSING..." : `UNLOCK PROTOCOL — ${formatINR(ebook.price)}`}
              </button>
            )}
            
            <button 
              onClick={openReader}
              className={`flex-1 px-8 py-5 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                hasAccess ? "bg-white text-black" : "bg-white/5 border border-white/10 text-white"
              }`}
            >
              {hasAccess ? "OPEN READER" : "READ PREVIEW"}
            </button>
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

      <UpiPaymentModal
        open={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        onSubmit={handleUpiSubmit}
        upiId={upiDetails.upiId}
        amount={upiDetails.amount}
        ebookTitle={ebook.title}
        loading={buying}
      />
    </div>
  );
}
