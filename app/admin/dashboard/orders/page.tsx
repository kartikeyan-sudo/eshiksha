"use client";

import { useCallback, useEffect, useState } from "react";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuToast } from "@/components/ui/NeuToast";
import { BackButton } from "@/components/ui/BackButton";
import { getClientToken } from "@/lib/auth";
import { deleteAdminOrder, listAdminOrders, updateOrderStatus } from "@/lib/api";
import type { AdminOrder } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const STATUS_OPTIONS = ["pending", "completed", "delivered"] as const;
const PAGE_SIZE = 10;

function getStatusTone(status: string): "info" | "success" | "warning" {
  if (status === "completed") return "success";
  if (status === "delivered") return "info";
  return "warning";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const fetchOrders = useCallback(async () => {
    const token = getClientToken();
    if (!token) return;

    setLoading(true);
    try {
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
      setToast({ open: true, message: "Order status updated", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : "Failed to update", variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const onDeleteOrder = async (order: AdminOrder) => {
    const token = getClientToken();
    if (!token) return;

    const ok = window.confirm(
      `Delete order #${order.id} for ${order.userEmail}? This cannot be undone.`,
    );
    if (!ok) return;

    setDeletingId(order.id);
    try {
      await deleteAdminOrder(order.id, token);
      await fetchOrders();
      setToast({ open: true, message: "Order deleted", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: error instanceof Error ? error.message : "Failed to delete order", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">📦 Order Management</h1>
          <p className="text-sm text-[var(--text-muted)]">{total} orders</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search user or ebook"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] sm:w-56"
          />
          {["", ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`category-chip ${filterStatus === status ? "active" : ""}`}
            >
              {status || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-surface rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-[var(--surface)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Ebook</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">{order.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--text-primary)] truncate max-w-[200px]">{order.ebookTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[var(--success)]">{formatINR(order.amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <NeuBadge tone={getStatusTone(order.status)}>{order.status}</NeuBadge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => onStatusChange(order.id, e.target.value as (typeof STATUS_OPTIONS)[number])}
                          disabled={updatingId === order.id || deletingId === order.id}
                          className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <NeuButton
                          variant="danger"
                          className="min-h-[32px] px-3 py-1 text-xs"
                          onClick={() => onDeleteOrder(order)}
                          loading={deletingId === order.id}
                          disabled={updatingId === order.id}
                        >
                          Delete
                        </NeuButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <NeuButton variant="ghost" className="text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </NeuButton>
            <NeuButton variant="ghost" className="text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </NeuButton>
          </div>
        </div>
      )}

      <NeuToast message={toast.message} open={toast.open} variant={toast.variant} onClose={() => setToast((p) => ({ ...p, open: false }))} />
    </div>
  );
}
