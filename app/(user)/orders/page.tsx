"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { getClientToken } from "@/lib/auth";
import { listOrders } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export default function UserOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getClientToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    listOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [router]);

  const getStatusTone = (status: string): "info" | "success" | "warning" | "danger" => {
    if (status === "completed") return "success";
    if (status === "delivered") return "info";
    if (status === "payment_review") return "danger";
    return "warning";
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 pb-24 md:px-8 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--accent)]/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Transaction History
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">My Orders</h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] font-medium max-w-md uppercase tracking-tight">
            {orders.length} secure protocol acquisitions recorded.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
           <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--accent)] rounded-full animate-spin" />
           <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Retrieving Records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl">📦</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">No Acquisitions</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs uppercase font-medium">Your procurement history is currently empty.</p>
          </div>
          <Link href="/">
            <button className="px-8 py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest">Explore Marketplace</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 stagger-children">
          {orders.map((order) => (
            <div
              key={order.id}
              className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl hover:border-[var(--accent)] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300"
            >
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-18 md:h-32 md:w-24 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl">
                  {order.coverUrl && (
                    <img src={order.coverUrl} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Order #{order.id}</span>
                    <NeuBadge tone={getStatusTone(order.status)} className="uppercase text-[8px] font-black tracking-widest">
                      {order.status.replace("_", " ")}
                    </NeuBadge>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight line-clamp-1">{order.ebookTitle}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                     <span>{formatINR(order.amount)}</span>
                     <span className="h-1 w-1 rounded-full bg-white/20" />
                     <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 md:mt-0">
                <Link href={`/ebook/${order.ebookId}`} className="flex-1 md:flex-none">
                  <button className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-[0.95]">
                    {order.status === 'completed' || order.status === 'delivered' ? 'Read Protocol' : 'View Detail'}
                  </button>
                </Link>
                {order.paymentMethod && (
                  <div className="hidden lg:flex flex-col items-end">
                     <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Gateway</p>
                     <p className="text-[10px] font-black text-white uppercase">{order.paymentMethod}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
