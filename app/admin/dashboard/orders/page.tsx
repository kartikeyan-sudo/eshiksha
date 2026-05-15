"use client";

import { useCallback, useEffect, useState } from "react";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuToast } from "@/components/ui/NeuToast";
import { BackButton } from "@/components/ui/BackButton";
import { getClientToken } from "@/lib/auth";
import { deleteAdminOrder, listAdminOrders, updateOrderStatus, getAdminSettings, updateAdminSettings } from "@/lib/api";
import type { AdminOrder } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const STATUS_OPTIONS = ["pending", "payment_review", "completed", "delivered"] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" as "success" | "error" });
  const [allowAlreadyPaid, setAllowAlreadyPaid] = useState<boolean | null>(null);

  const fetchOrders = useCallback(async () => {
    const token = getClientToken();
    if (!token) return;

    setLoading(true);
    try {
      const settingsResult = await getAdminSettings(token);
      setAllowAlreadyPaid(settingsResult.allow_already_paid);

      const result = await listAdminOrders(token, {
        status: filterStatus || undefined,
        q: searchQuery || undefined,
        page,
        pageSize: 10,
      });

      setOrders(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page, searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const onStatusChange = async (orderId: number, newStatus: (typeof STATUS_OPTIONS)[number]) => {
    const token = getClientToken();
    if (!token) return;

    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, token);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      setToast({ open: true, message: "Security Clearance Updated", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: "Override Failed", variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const onDeleteOrder = async (order: AdminOrder) => {
    const token = getClientToken();
    if (!token) return;

    const ok = window.confirm(`Permanently purge order record #${order.id}?`);
    if (!ok) return;

    setDeletingId(order.id);
    try {
      await deleteAdminOrder(order.id, token);
      await fetchOrders();
      setToast({ open: true, message: "Record Purged", variant: "success" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="brutalist-header">
        <h1 className="font-['Anton']">Order Oversight</h1>
        <p className="font-['Bebas_Neue'] text-2xl uppercase">Central Intelligence Command</p>
        <p className="tagline font-['Anton'] text-[#b83227] text-xl mt-2 uppercase tracking-wider">Restricted Admin Terminal // Session ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
      </header>

      <main className="section-container space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b-4 border-black pb-8">
           <div className="space-y-1">
              <h2 className="text-4xl">System Logs</h2>
              <p className="font-['Bebas_Neue'] text-gray-500 tracking-widest">{total} Total Acquisitions</p>
           </div>
           
           <div className="flex flex-wrap gap-4 items-center">
              <input 
                type="search"
                placeholder="Search Email/ID/Title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="px-6 py-3 border-2 border-black font-['Inter'] uppercase text-xs tracking-widest focus:shadow-[4px_4px_0px_black] outline-none transition-all"
              />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-6 py-3 border-2 border-black font-['Bebas_Neue'] uppercase tracking-widest outline-none bg-white cursor-pointer"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
           </div>
        </div>

        {loading ? (
          <div className="py-20 text-center border-2 border-black shadow-[8px_8px_0px_black]">
             <p className="font-['Bebas_Neue'] text-4xl animate-pulse">Scanning Databanks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="brutalist-card p-6 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex-1 space-y-2">
                   <div className="flex items-center gap-4">
                      <span className="font-['Anton'] text-2xl">#{order.id}</span>
                      <NeuBadge tone={order.status === 'completed' ? 'success' : 'warning'}>{order.status}</NeuBadge>
                   </div>
                   <h3 className="text-xl font-black font-['Inter'] uppercase tracking-tight">{order.ebookTitle}</h3>
                   <p className="font-['Inter'] text-sm text-gray-500">USER: {order.userEmail} // AMT: {formatINR(order.amount)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                   <select 
                     value={order.status}
                     onChange={(e) => onStatusChange(order.id, e.target.value as any)}
                     className="px-4 py-2 border-2 border-black font-['Bebas_Neue'] uppercase text-sm tracking-wider cursor-pointer outline-none bg-white"
                   >
                     {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                   <button 
                     onClick={() => onDeleteOrder(order)}
                     className="px-4 py-2 border-2 border-black bg-red-600 text-white font-['Bebas_Neue'] uppercase tracking-widest hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_black] transition-all"
                   >
                     Purge
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-4 border-t-4 border-black pt-8">
             <button 
               disabled={page === 1}
               onClick={() => setPage(p => p - 1)}
               className="brutalist-button sm"
             >
               Prev
             </button>
             <span className="flex items-center font-['Bebas_Neue'] text-2xl px-6 border-2 border-black">{page} / {totalPages}</span>
             <button 
               disabled={page === totalPages}
               onClick={() => setPage(p => p + 1)}
               className="brutalist-button sm"
             >
               Next
             </button>
          </div>
        )}
      </main>

      <footer className="mt-24 bg-black text-white p-12 text-center font-['Bebas_Neue'] tracking-[0.2em] uppercase">
         <p>Terminal Lock Active // Do Not Leave Unattended</p>
      </footer>

      <NeuToast message={toast.message} open={toast.open} variant={toast.variant} onClose={() => setToast(p => ({...p, open: false}))} />
    </div>
  );
}
