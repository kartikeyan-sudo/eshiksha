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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 pb-24 md:px-8 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">My Orders</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Your purchase history</p>
        </div>
        <Link href="/">
          <NeuButton variant="secondary" className="text-xs">Browse Ebooks</NeuButton>
        </Link>
      </div>

      {loading ? (
        <div className="glass-surface rounded-2xl p-12 text-center text-sm text-[var(--text-muted)]">
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center space-y-4">
          <span className="text-5xl">📦</span>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">No orders yet</h2>
          <p className="text-sm text-[var(--text-muted)]">Start exploring ebooks and make your first purchase!</p>
          <Link href="/">
            <NeuButton>Browse Ebooks</NeuButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
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
                    className="h-16 w-12 rounded-lg object-cover shadow-sm"
                    loading="lazy"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{order.ebookTitle}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
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

              <div className="flex gap-2">
                <Link href={`/ebook/${order.ebookId}`}>
                  <NeuButton variant="ghost" className="text-xs">Read</NeuButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
