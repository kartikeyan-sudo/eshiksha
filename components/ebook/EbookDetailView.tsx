"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  getEbookAccess, 
  trackEbookView, 
  createRazorpayOrder, 
  submitUpiPayment,
  getEbookAccessDetails
} from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import { NeuToast } from "@/components/ui/NeuToast";
import { UpiPaymentModal } from "@/components/ebook/UpiPaymentModal";
import type { Ebook } from "@/lib/types";
import { formatINR } from "@/lib/utils";

type EbookDetailViewProps = {
  ebook: Ebook;
};

const CATEGORY_ACCENTS: Record<string, string> = {
  "Lean Build": "accent-lean",
  "Bulky Build": "accent-bulky",
  "Shredded": "accent-shredded",
  "Power Lifter": "accent-power",
};

export default function EbookDetailView({ ebook }: EbookDetailViewProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(Boolean(ebook.hasPurchased || ebook.isFree));
  const [isPaymentReview, setIsPaymentReview] = useState(Boolean(ebook.isPaymentReview));
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiDetails, setUpiDetails] = useState({ upiId: "", amount: 0 });

  const accentClass = CATEGORY_ACCENTS[ebook.category || ""] || "accent-lean";

  useEffect(() => {
    void trackEbookView(ebook.id).catch(() => null);
    const token = getClientToken();
    if (token) {
      getEbookAccess(ebook.id, token)
        .then((access) => {
          if (access.isPaymentReview) setIsPaymentReview(true);
          if (access.hasAccess) setHasAccess(true);
        })
        .catch(() => null);
    }
  }, [ebook.id]);

  const handleBuyClick = async () => {
    const token = getClientToken();
    if (!token) {
      router.push(`/login?redirect=/ebook/${ebook.id}`);
      return;
    }

    setBuying(true);
    try {
      const order = await createRazorpayOrder(ebook.id, token);

      if (order.alreadyPurchased || order.isFree) {
        setHasAccess(true);
        setToastVariant("success");
        setMessage("Access granted.");
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

      // Razorpay Integration logic would go here if needed
      // But we are focusing on UPI and UI redesign for now
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Payment failed");
      setShowToast(true);
    } finally {
      setBuying(false);
    }
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

  return (
    <div className={`w-full min-h-screen pt-32 pb-20 ${accentClass}`}>
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* LEFT: Cover & Quick Actions */}
        <div className="lg:col-span-5 space-y-12">
          <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-white/5">
             <img src={ebook.coverUrl} alt={ebook.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
             
             {/* Category Tag */}
             <div className="absolute top-8 left-8">
                <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-xs font-black uppercase tracking-[0.2em] text-white border border-white/10">
                  {ebook.category || "Fitness Series"}
                </span>
             </div>
          </div>

          <div className="space-y-6">
             {hasAccess ? (
               <Link 
                href={`/ebook/${ebook.id}/read`}
                className="w-full py-5 rounded-full bg-white text-black font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
               >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                 Start Reading
               </Link>
             ) : isPaymentReview ? (
               <div className="w-full py-5 rounded-full bg-white/5 border border-white/10 text-white/40 font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-3 cursor-not-allowed">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  Under Review
               </div>
             ) : (
               <button 
                onClick={handleBuyClick}
                disabled={buying}
                className="w-full py-5 rounded-full bg-blue-500 text-white font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-blue-600 active:scale-95 transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] disabled:opacity-50"
               >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                 Unlock Full Protocol — {formatINR(ebook.price)}
               </button>
             )}
             <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Lifetime Access • Instant Delivery</p>
          </div>
        </div>

        {/* RIGHT: Details & Visuals */}
        <div className="lg:col-span-7 space-y-16">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
              {ebook.title}
            </h1>
            <p className="text-xl text-white/60 font-medium leading-relaxed max-w-2xl">
              {ebook.description}
            </p>
          </div>

          {/* INSIDE THE EBOOK (Visuals) */}
          <div className="space-y-8">
             <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 border-b border-white/5 pb-4">Inside the Protocol</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Macro Charts", val: "40+", icon: "📊" },
                  { title: "Workout Tables", val: "12", icon: "📋" },
                  { title: "Protein Guide", val: "High", icon: "🥩" },
                  { title: "Shopping List", val: "Budget", icon: "🛒" }
                ].map((stat, idx) => (
                  <div key={idx} className="glass-panel p-6 rounded-3xl flex items-center gap-6 group hover:border-white/20 transition-all">
                    <div className="text-3xl transform group-hover:scale-110 transition-transform">{stat.icon}</div>
                    <div>
                      <div className="text-2xl font-black text-white">{stat.val}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.title}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Calorie Calculator Preview */}
          <div className="glass-panel p-8 rounded-[3rem] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-xl font-black text-white">System Tools</h4>
                   <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">Premium Only</span>
                </div>
                <div className="space-y-4">
                   {[
                     { label: "BMR Calculator", progress: 100 },
                     { label: "Macro Ratio System", progress: 100 },
                     { label: "Progress Tracker", progress: 100 }
                   ].map((tool, idx) => (
                     <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                           <span>{tool.label}</span>
                           <span>Active</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-white/20 rounded-full" style={{ width: `${tool.progress}%` }} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Testimonial */}
          <div className="border-l-4 border-white/10 pl-8 py-4 italic">
             <p className="text-lg text-white/50 font-medium">
               "This protocol changed how I look at Indian food. I didn't have to give up my roti or rice to get shredded. Best investment in my fitness journey."
             </p>
             <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <span className="text-xs font-black uppercase tracking-widest text-white/80">Rahul S., Beta Tester</span>
             </div>
          </div>
        </div>

      </div>

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
