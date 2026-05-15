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
  loading: () => <div className="border-2 border-black p-10 text-center font-['Bebas_Neue'] text-xl uppercase">Preparing reader...</div>,
});

const EmbedPdfPreview = dynamic(() => import("@/components/ebook/EmbedPdfPreview").then((mod) => mod.EmbedPdfPreview), {
  ssr: false,
  loading: () => <div className="border-2 border-black p-10 text-center font-['Bebas_Neue'] text-xl uppercase">Preparing preview...</div>,
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
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function EbookDetailView({ ebook }: EbookDetailViewProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(Boolean(ebook.hasPurchased || ebook.isFree));
  const [previewPages, setPreviewPages] = useState(ebook.previewPages);
  const [buying, setBuying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<Ebook[]>([]);
  const [isPaymentReview, setIsPaymentReview] = useState(Boolean(ebook.isPaymentReview));
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiDetails, setUpiDetails] = useState({ upiId: "", amount: 0 });
  const [accessInfo, setAccessInfo] = useState<{ pdfUrl?: string; token?: string }>({});

  useEffect(() => {
    void trackEbookView(ebook.id).catch(() => null);
    listRelatedBooks(ebook.id, ebook.category).then(setRelatedBooks).catch(() => []);
    
    const token = getClientToken();
    if (token) {
      getEbookAccess(ebook.id, token).then((access) => {
        if (access.isPaymentReview) setIsPaymentReview(true);
        if (access.pdfUrl) setAccessInfo({ pdfUrl: access.pdfUrl, token });
      }).catch(() => null);
    }
  }, [ebook.id, ebook.category]);

  const openReader = async () => {
    const token = getClientToken();
    if (!token) {
      router.push("/login");
      return;
    }
    window.open(`/ebook/${ebook.id}/read`, '_blank');
  };

  const buyNow = async () => {
    const token = getClientToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setBuying(true);
    try {
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) throw new Error("Payment gateway failed");

      const order = await createRazorpayOrder(ebook.id, token);
      if (order.isUpi) {
        setUpiDetails({ upiId: order.adminUpiId || "", amount: ebook.price });
        setShowUpiModal(true);
        return;
      }

      // Razorpay logic (simplified for brevity, usually handled in separate hook)
      // For now, I'll keep the existing logic but redesign the trigger
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "EShikhsha",
        description: `Purchase ${ebook.title}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          await verifyRazorpayPayment(ebook.id, response, token);
          setHasAccess(true);
          setToastVariant("success");
          setMessage("Protocol Acquired.");
          setShowToast(true);
        },
        theme: { color: "#222" }
      });
      rzp.open();
    } catch (err) {
      setToastVariant("error");
      setMessage("Acquisition Failed.");
      setShowToast(true);
    } finally {
      setBuying(false);
    }
  };

  const handleUpiSubmit = async (utr: string) => {
    const token = getClientToken();
    if (!token) return;
    try {
      await submitUpiPayment(ebook.id, utr, token);
      setShowUpiModal(false);
      setIsPaymentReview(true);
      setToastVariant("success");
      setMessage("Verification process initialized.");
      setShowToast(true);
    } catch (err) {
      setToastVariant("error");
      setMessage("Submission error.");
      setShowToast(true);
    }
  };

  return (
    <div className="space-y-24 bg-white min-h-screen">
      {/* Detail Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left: Static Cover */}
        <div className="brutalist-card p-4 bg-gray-50 border-4 border-black shadow-[12px_12px_0px_black]">
           <div className="aspect-[3/4] overflow-hidden border-2 border-black">
              <img src={ebook.coverUrl} alt={ebook.title} className="w-full h-full object-cover" />
           </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-8">
           <div className="space-y-4">
              <div className="flex gap-4">
                 <NeuBadge tone="info" className="text-lg">{ebook.category || "General"}</NeuBadge>
                 {hasAccess && <NeuBadge tone="success" className="text-lg">✓ OWNED</NeuBadge>}
              </div>
              <h1 className="text-5xl md:text-7xl font-['Anton'] uppercase tracking-tighter leading-[0.9]">
                {ebook.title}
              </h1>
              <div className="text-4xl font-['Anton'] text-[#b83227]">
                {ebook.isFree ? "OPEN ACCESS" : `₹${ebook.price}`}
              </div>
           </div>

           <div className="brutalist-divider" />

           <p className="font-['Inter'] text-lg leading-relaxed text-gray-700">
             {ebook.description}
           </p>

           <div className="grid grid-cols-3 gap-6 font-['Bebas_Neue'] text-center">
              <div className="p-4 border-2 border-black shadow-[4px_4px_0px_black]">
                 <div className="text-sm text-gray-400">Pages</div>
                 <div className="text-2xl">{previewPages}+</div>
              </div>
              <div className="p-4 border-2 border-black shadow-[4px_4px_0px_black]">
                 <div className="text-sm text-gray-400">Views</div>
                 <div className="text-2xl">{ebook.viewsCount || 0}</div>
              </div>
              <div className="p-4 border-2 border-black shadow-[4px_4px_0px_black]">
                 <div className="text-sm text-gray-400">Status</div>
                 <div className="text-2xl">{hasAccess ? "Unlocked" : "Locked"}</div>
              </div>
           </div>

           <div className="pt-8 flex flex-col sm:flex-row gap-6">
              {!hasAccess && (
                <button 
                  onClick={buyNow}
                  disabled={buying || isPaymentReview}
                  className="flex-1 brutalist-button accent text-2xl py-6"
                >
                  {isPaymentReview ? "REVIEW PENDING" : buying ? "PROCESSING" : "INITIALIZE ACQUISITION"}
                </button>
              )}
              <button 
                onClick={openReader}
                className={`flex-1 brutalist-button ${hasAccess ? 'primary' : 'secondary'} text-2xl py-6`}
              >
                {hasAccess ? "ACCESS TERMINAL" : "PREVIEW PROTOCOL"}
              </button>
           </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="space-y-8 border-t-4 border-black pt-16">
         <h2 className="text-5xl font-['Anton']">Intel Preview</h2>
         <div className="brutalist-card p-2 bg-gray-200 border-4 border-black shadow-[8px_8px_0px_black]">
            <EmbedPdfPreview
               fileUrl={accessInfo.pdfUrl || ebook.previewUrl || ""}
               title={ebook.title}
               previewPages={previewPages}
               token={accessInfo.token}
               onUnlockRequest={buyNow}
            />
         </div>
      </section>

      {/* Ratings */}
      <section className="border-t-4 border-black pt-16">
         <EbookRatingPanel ebookId={ebook.id} />
      </section>

      {/* Related */}
      {relatedBooks.length > 0 && (
        <section className="space-y-12 border-t-4 border-black pt-16 pb-24">
           <h2 className="text-5xl font-['Anton']">Similar Payloads</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {relatedBooks.map(item => (
                <EbookCard key={item.id} ebook={item} />
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
