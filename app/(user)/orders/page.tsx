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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="brutalist-header">
        <h1 className="font-['Anton']">Transaction Log</h1>
        <p className="font-['Bebas_Neue'] text-2xl uppercase">Procurement History</p>
        <p className="tagline font-['Anton'] text-[#b83227] text-xl mt-2 uppercase tracking-wider">Financial Clearance // Ledger V-26</p>
      </header>

      <main className="section-container space-y-16">
        
        <section className="p-0 w-full space-y-8">
          <div className="flex items-center justify-between border-b-4 border-black pb-4">
             <h2 className="text-4xl">Acquisition History</h2>
             <span className="font-['Bebas_Neue'] text-xl uppercase tracking-widest">{orders.length} Entries Recorded</span>
          </div>

          {loading ? (
            <div className="py-20 text-center border-2 border-black shadow-[8px_8px_0px_black]">
               <p className="font-['Bebas_Neue'] text-4xl animate-pulse">Retrieving Ledger...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-black">
               <h3 className="text-4xl mb-4 font-['Anton']">No Transactions</h3>
               <p className="font-['Inter'] mb-8 uppercase text-sm tracking-widest">Your procurement ledger is currently empty.</p>
               <Link href="/">
                  <button className="brutalist-button accent">Initiate Acquisition →</button>
               </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {orders.map((order) => (
                <div key={order.id} className="brutalist-card p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 border-2 border-black flex-shrink-0 bg-gray-50">
                       {order.coverUrl && <img src={order.coverUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-2xl font-['Anton'] uppercase">{order.ebookTitle}</h3>
                       <p className="font-['Bebas_Neue'] text-sm text-gray-500 uppercase tracking-widest">
                         Order #{order.id} // {new Date(order.createdAt).toLocaleDateString()}
                       </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 justify-center">
                     <div className="text-center md:text-right px-4">
                        <p className="font-['Bebas_Neue'] text-xs text-gray-400 uppercase tracking-widest">Payload Value</p>
                        <p className="font-['Anton'] text-xl text-[#b83227]">{formatINR(order.amount)}</p>
                     </div>
                     
                     <NeuBadge tone={order.status === 'completed' ? 'success' : 'warning'}>
                        {order.status}
                     </NeuBadge>

                     <Link href={`/ebook/${order.ebookId}`}>
                        <button className="brutalist-button primary py-2 px-4 text-sm">View Intel</button>
                     </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="mt-24 bg-black text-white p-12 text-center font-['Bebas_Neue'] tracking-[0.2em] uppercase">
         <p>Ledger Closed // End of Records</p>
      </footer>
    </div>
  );
}
