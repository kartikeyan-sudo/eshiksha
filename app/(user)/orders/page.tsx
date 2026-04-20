"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuButton } from "@/components/ui/NeuButton";
import { getClientToken } from "@/lib/auth";
import { listOrders } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/utils";

function getStatusTone(status: string): "info" | "success" | "warning" {
  if (status === "completed") return "success";
  if (status === "delivered") return "info";
  return "warning";
}

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
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 pb-24 md:px-8 md:pb-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">My Orders</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {loading ? "Loading..." : `${orders.length} purchase${orders.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/">
          <NeuButton variant="secondary" className="text-xs gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            Browse Ebooks
          </NeuButton>
        </Link>
      </div>

      {loading ? (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-[var(--accent-soft)] border-t-[var(--accent)]" />
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <span className="text-5xl">📦</span>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">No orders yet</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">Start exploring ebooks and make your first purchase!</p>
          <Link href="/">
            <NeuButton>Browse Ebooks</NeuButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {orders.map((order) => (
            <div
              key={order.id}
              className="premium-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                {order.coverUrl && (
                  <img
                    src={order.coverUrl}
                    alt={order.ebookTitle}
                    className="h-16 w-12 rounded-lg object-cover shadow-sm flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">{order.ebookTitle}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-sm font-bold text-[var(--accent)]">{formatINR(order.amount)}</span>
                    <NeuBadge tone={getStatusTone(order.status)}>{order.status}</NeuBadge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/ebook/${order.ebookId}`}>
                  <NeuButton variant="secondary" className="text-xs gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                    </svg>
                    Read
                  </NeuButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
