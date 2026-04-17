"use client";

import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuToast } from "@/components/ui/NeuToast";
import {
  clearDbLogs,
  clearOrderHistory,
  deleteAdminUser,
  downloadUsersPdf,
  getAdminDbStats,
  listAdminUsers,
} from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { AdminDbStats, AdminUser } from "@/lib/types";

const EMPTY_STATS: AdminDbStats = {
  users: 0,
  purchases: 0,
  paymentTransactions: 0,
  readingProgress: 0,
  bookmarks: 0,
  notes: 0,
};

export default function AdminDatabasePage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminDbStats>(EMPTY_STATS);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [beforeDate, setBeforeDate] = useState<string>("");
  const [loadingAction, setLoadingAction] = useState<string>("");
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" as "success" | "error" });

  const selectedUser = useMemo(
    () => users.find((u) => u.id === Number(selectedUserId)),
    [selectedUserId, users],
  );

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToast({ open: true, message, variant });
  };

  const loadData = async () => {
    const token = getClientToken();
    if (!token) {
      setUsers([]);
      setStats(EMPTY_STATS);
      return;
    }

    const [usersResult, statsResult] = await Promise.all([
      listAdminUsers(token).catch(() => []),
      getAdminDbStats(token).catch(() => EMPTY_STATS),
    ]);

    setUsers(usersResult);
    setStats(statsResult);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setLoadingAction(key);
    try {
      await action();
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed", "error");
    } finally {
      setLoadingAction("");
    }
  };

  const onDeleteUser = async () => {
    const token = getClientToken();
    if (!token || !selectedUser) return;

    const ok = window.confirm(
      `Delete user ${selectedUser.email}? This will also remove their orders, bookmarks, notes, and progress data.`,
    );
    if (!ok) return;

    await runAction("delete-user", async () => {
      await deleteAdminUser(selectedUser.id, token);
      setSelectedUserId("");
      showToast("User data deleted");
    });
  };

  const onExportUsersPdf = async () => {
    const token = getClientToken();
    if (!token) return;

    await runAction("export-users", async () => {
      const blob = await downloadUsersPdf(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eshiksha-users-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Users PDF downloaded");
    });
  };

  const onClearOrders = async () => {
    const token = getClientToken();
    if (!token) return;

    const scope = beforeDate ? `before ${beforeDate}` : "all";
    const ok = window.confirm(`Clear ${scope} order history? This cannot be undone.`);
    if (!ok) return;

    await runAction("clear-orders", async () => {
      await clearOrderHistory(token, beforeDate || undefined);
      showToast("Order history cleared");
    });
  };

  const onClearLogs = async (target: "readingProgress" | "bookmarks" | "notes" | "all") => {
    const token = getClientToken();
    if (!token) return;

    const ok = window.confirm(`Clear ${target} logs? This cannot be undone.`);
    if (!ok) return;

    await runAction(`clear-logs-${target}`, async () => {
      await clearDbLogs(target, token);
      showToast(`Cleared ${target} logs`);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">🗄️ DB Management</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage free-tier database usage by deleting old data, exporting users, and clearing logs.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Purchases" value={stats.purchases} />
        <StatCard label="Payments" value={stats.paymentTransactions} />
        <StatCard label="Progress" value={stats.readingProgress} />
        <StatCard label="Bookmarks" value={stats.bookmarks} />
        <StatCard label="Notes" value={stats.notes} />
      </div>

      <section className="glass-surface rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">👤 User Data Controls</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Delete a specific user and cascade-remove all related records.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.email} ({user.role})
              </option>
            ))}
          </select>

          <NeuButton
            variant="danger"
            onClick={onDeleteUser}
            disabled={!selectedUserId}
            loading={loadingAction === "delete-user"}
          >
            Delete Selected User Data
          </NeuButton>
        </div>
      </section>

      <section className="glass-surface rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">📄 Export Users</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Download a PDF containing user IDs, emails, roles, and account status.
        </p>
        <NeuButton onClick={onExportUsersPdf} loading={loadingAction === "export-users"}>
          Download Users PDF
        </NeuButton>
      </section>

      <section className="glass-surface rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">📦 Order History Cleanup</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Clear all orders, or clear only orders before a specific date.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="date"
            value={beforeDate}
            onChange={(e) => setBeforeDate(e.target.value)}
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <NeuButton variant="danger" onClick={onClearOrders} loading={loadingAction === "clear-orders"}>
            Clear Order History
          </NeuButton>
        </div>
      </section>

      <section className="glass-surface rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">🧹 Log Cleanup</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Clear activity tables that grow over time: reading progress, bookmarks, and notes.
        </p>

        <div className="flex flex-wrap gap-2">
          <NeuButton
            variant="ghost"
            onClick={() => onClearLogs("readingProgress")}
            loading={loadingAction === "clear-logs-readingProgress"}
          >
            Clear Progress Logs
          </NeuButton>
          <NeuButton
            variant="ghost"
            onClick={() => onClearLogs("bookmarks")}
            loading={loadingAction === "clear-logs-bookmarks"}
          >
            Clear Bookmark Logs
          </NeuButton>
          <NeuButton
            variant="ghost"
            onClick={() => onClearLogs("notes")}
            loading={loadingAction === "clear-logs-notes"}
          >
            Clear Notes Logs
          </NeuButton>
          <NeuButton
            variant="danger"
            onClick={() => onClearLogs("all")}
            loading={loadingAction === "clear-logs-all"}
          >
            Clear All Logs
          </NeuButton>
        </div>
      </section>

      <NeuToast
        message={toast.message}
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-surface rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
