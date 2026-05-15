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
const PAGE_SIZE = 12;

function getStatusTone(status: string): "info" | "success" | "warning" | "danger" {
  if (status === "completed") return "success";
  if (status === "delivered") return "info";
  if (status === "payment_review") return "danger";
  return "warning";
}

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
        pageSize: PAGE_SIZE,
      });

      setOrders(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      setOrders([]);
      setTotal(0);
      setTotalPages(1);
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
    setPage(1);
  }, [filterStatus, searchQuery]);

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
      setToast({ open: true, message: "Security clearance updated.", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : "Update failed", variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const onDeleteOrder = async (order: AdminOrder) => {
    const token = getClientToken();
    if (!token) return;

    const ok = window.confirm(`Permanently purge order #${order.id}? This action is irreversible.`);
    if (!ok) return;

    setDeletingId(order.id);
    try {
      await deleteAdminOrder(order.id, token);
      await fetchOrders();
      setToast({ open: true, message: "Order purged from records.", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : "Purge failed", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const onToggleAlreadyPaid = async () => {
    const token = getClientToken();
    if (!token || allowAlreadyPaid === null) return;
    try {
      const newValue = !allowAlreadyPaid;
      await updateAdminSettings(token, { allow_already_paid: newValue });
      setAllowAlreadyPaid(newValue);
      setToast({ open: true, message: `System: 'Already Paid' flow ${newValue ? 'active' : 'inactive'}`, variant: "success" });
    } catch (error) {
      setToast({ open: true, message: "System override failed", variant: "error" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <BackButton />
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Command Center: Orders</h1>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{total} Active Procurement Entries</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {allowAlreadyPaid !== null && (
            <button 
              onClick={onToggleAlreadyPaid}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${
                allowAlreadyPaid ? "bg-[var(--accent)]/10 border-[var(--accent)] text-white" : "bg-white/5 border-white/5 text-[var(--text-muted)]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${allowAlreadyPaid ? "bg-white animate-pulse" : "bg-white/20"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">Manual Payments: {allowAlreadyPaid ? "ON" : "OFF"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 lg:col-span-5 relative">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Intelligence... (Email, ID, Ebook)"
            className="w-full h-14 bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--text-muted)] placeholder:uppercase placeholder:font-black placeholder:text-[9px] placeholder:tracking-widest"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</div>
        </div>
        
        <div className="md:col-span-8 lg:col-span-7 flex overflow-x-auto gap-2 no-scrollbar">
          {["", ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`h-14 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterStatus === status ? "bg-white text-black" : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
              }`}
            >
              {status || "All Records"}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
           <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--accent)] rounded-full animate-spin" />
           <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Synchronizing Database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 space-y-6 hover:border-[var(--accent)]/50 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl font-black italic">#{order.id}</span>
              </div>

              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Subscriber</p>
                  <h3 className="text-sm font-black text-white truncate max-w-[200px]">{order.userEmail}</h3>
                </div>
                <NeuBadge tone={getStatusTone(order.status)} className="text-[8px] font-black uppercase tracking-widest">
                  {order.status}
                </NeuBadge>
              </div>

              <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/5">
                 {order.coverUrl && (
                   <img src={order.coverUrl} className="h-16 w-12 rounded-lg object-cover shadow-2xl" />
                 )}
                 <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Protocol Title</p>
                    <h4 className="text-xs font-black text-white uppercase line-clamp-2 tracking-tight">{order.ebookTitle}</h4>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Payload</p>
                    <p className="text-lg font-black text-[var(--success)]">{formatINR(order.amount)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Timestamp</p>
                    <p className="text-[10px] font-bold text-white uppercase">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</p>
                 </div>
              </div>

              {order.utrNumber && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                   <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">UTR Verification Required</p>
                   <p className="text-xs font-mono text-white tracking-widest">{order.utrNumber}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                 <select 
                   value={order.status}
                   onChange={(e) => onStatusChange(order.id, e.target.value as any)}
                   className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[var(--accent)]"
                 >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-black">{opt}</option>)}
                 </select>
                 
                 <button 
                   onClick={() => onDeleteOrder(order)}
                   disabled={deletingId === order.id}
                   className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 text-[var(--danger)] flex items-center justify-center hover:bg-[var(--danger)]/10 transition-all"
                 >
                    {deletingId === order.id ? "..." : "🗑️"}
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-12">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
            className="h-12 px-6 rounded-xl bg-white/5 text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-30"
          >
            ← Back
          </button>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Vector {page} / {totalPages}</span>
          <button 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="h-12 px-6 rounded-xl bg-white/5 text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}

      <NeuToast message={toast.message} open={toast.open} variant={toast.variant} onClose={() => setToast((p) => ({ ...p, open: false }))} />
    </div>
  );
}
