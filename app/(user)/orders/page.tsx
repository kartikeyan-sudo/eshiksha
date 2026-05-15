"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <div className="w-full min-h-screen pt-32 pb-20 container mx-auto px-6 space-y-16 animate-fade-in">
       {/* Header */}
      <div className="space-y-4">
        <h1 className="text-6xl font-black tracking-tighter text-white">ORDER HISTORY</h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
          {orders.length} Protocols successfully unlocked
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
           <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Syncing with blockchain...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center space-y-8">
           <div className="text-6xl">📦</div>
           <h3 className="text-2xl font-black text-white">No Transmissions Found</h3>
           <p className="text-white/40 font-medium">Your order history is currently empty.</p>
           <Link href="/" className="btn-premium inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
           {orders.map((order) => (
             <div key={order.id} className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-white/10 transition-all">
                <div className="flex items-center gap-6 flex-1">
                   {order.coverUrl && (
                     <img src={order.coverUrl} className="w-16 h-20 object-cover rounded-xl shadow-xl" />
                   )}
                   <div className="space-y-1">
                      <h3 className="text-lg font-black text-white">{order.ebookTitle}</h3>
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold text-blue-400">{formatINR(order.amount)}</span>
                         <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                           order.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                         }`}>
                           {order.status}
                         </span>
                      </div>
                      <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">
                         Order Date: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                   </div>
                </div>

                <div className="flex gap-4">
                   <Link href={`/ebook/${order.ebookId}`} className="px-6 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-tighter">View Protocol</Link>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
