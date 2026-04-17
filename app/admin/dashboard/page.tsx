"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuButton } from "@/components/ui/NeuButton";
import { getClientToken } from "@/lib/auth";
import { getAdminDashboardStats, listAdminUsers, listEbooks } from "@/lib/api";
import type { AdminDashboardStats, AdminUser, Ebook } from "@/lib/types";
import { formatINR } from "@/lib/utils";

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export default function AdminDashboardPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    listEbooks()
      .then((result) => {
        if (!cancelled) setEbooks(result);
      })
      .catch(() => {
        if (!cancelled) setEbooks([]);
      });

    const token = getClientToken();
    if (token) {
      Promise.all([listAdminUsers(token).catch(() => []), getAdminDashboardStats(token).catch(() => null)]).then(
        ([usersResult, statsResult]) => {
          if (cancelled) return;
          setUsers(usersResult);
          setDashboardStats(statsResult);
        },
      );
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatINR(dashboardStats?.totalRevenue ?? 0),
        icon: "💰",
        color: "var(--success)",
      },
      {
        label: "Today Revenue",
        value: formatINR(dashboardStats?.todayRevenue ?? 0),
        icon: "📈",
        color: "var(--info)",
      },
      {
        label: "Total Users",
        value: (dashboardStats?.totalUsers ?? users.length).toString(),
        icon: "👥",
        color: "var(--accent)",
      },
      {
        label: "Total Sales",
        value: (dashboardStats?.totalSales ?? dashboardStats?.totalPurchases ?? 0).toString(),
        icon: "🛒",
        color: "var(--accent-secondary)",
      },
    ],
    [dashboardStats, users.length],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Welcome back, Admin</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/orders">
            <NeuButton variant="ghost" className="text-xs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Orders
            </NeuButton>
          </Link>
          <Link href="/admin/dashboard/upload">
            <NeuButton>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Upload Ebook
            </NeuButton>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <NeuBadge tone="info" className="text-[10px]">{stat.label}</NeuBadge>
            </div>
            <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Recent Transactions */}
      <section className="glass-surface rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>💳</span> Recent Transactions
          </h2>
          <Link href="/admin/dashboard/orders" className="text-xs text-[var(--accent)] hover:underline">
            View All →
          </Link>
        </div>

        {dashboardStats?.recentTransactions && dashboardStats.recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {dashboardStats.recentTransactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <span className="transaction-amount">+{formatINR(tx.amount)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.ebookTitle}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{tx.userEmail}</p>
                </div>
                <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                  {timeAgo(tx.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--glass-border)] p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">No transactions yet</p>
          </div>
        )}
      </section>

      {/* Two Column: Top Selling + Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Ebooks */}
        <section className="glass-surface rounded-2xl p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <span>🔥</span> Trending Books
          </h2>
          {dashboardStats?.topSellingEbooks?.length ? (
            <div className="space-y-2">
              {dashboardStats.topSellingEbooks.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                    #{index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</span>
                  <NeuBadge tone="success">{item.purchasesCount} sales</NeuBadge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No sales data yet</p>
          )}
        </section>

        {/* Quick Stats */}
        <section className="glass-surface rounded-2xl p-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <span>📊</span> Platform Stats
          </h2>
          <div className="space-y-3">
            {[
              { label: "Active Users", value: dashboardStats?.activeUsers ?? 0, total: dashboardStats?.totalUsers ?? 0 },
              { label: "Total Ebooks", value: dashboardStats?.totalEbooks ?? ebooks.length, total: null },
              { label: "Conversion Rate", value: `${dashboardStats?.conversionRate ?? 0}%`, total: null },
              { label: "Total Purchases", value: dashboardStats?.totalPurchases ?? 0, total: null },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] px-4 py-3">
                <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{item.value}</span>
                  {item.total !== null && (
                    <span className="text-xs text-[var(--text-muted)]">/ {item.total} total</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Quick Links */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/dashboard/users", label: "Manage Users", icon: "👥", count: dashboardStats?.totalUsers ?? users.length },
          { href: "/admin/dashboard/ebooks", label: "Manage Ebooks", icon: "📚", count: dashboardStats?.totalEbooks ?? ebooks.length },
          { href: "/admin/dashboard/categories", label: "Categories", icon: "🏷️", count: null },
          { href: "/admin/dashboard/upload", label: "Upload Ebook", icon: "📤", count: null },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="stat-card flex items-center gap-3 cursor-pointer">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                {item.count !== null && (
                  <p className="text-xs text-[var(--text-muted)]">{item.count} total</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
