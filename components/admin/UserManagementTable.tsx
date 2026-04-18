"use client";

import { useState } from "react";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuToast } from "@/components/ui/NeuToast";
import { getClientToken } from "@/lib/auth";
import { setUserActive, setUserBlocked, downloadUserSpecificExportPdf } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

type UserManagementTableProps = {
  users: AdminUser[];
  onUpdated?: () => void;
};

export function UserManagementTable({ users, onUpdated }: UserManagementTableProps) {
  const [loadingKey, setLoadingKey] = useState<string>("");
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" as "success" | "error" });

  const updateBlocked = async (user: AdminUser, isBlocked: boolean) => {
    const token = getClientToken();
    if (!token) return;

    const key = `block-${user.id}`;
    setLoadingKey(key);
    try {
      await setUserBlocked(user.id, isBlocked, token);
      onUpdated?.();
    } finally {
      setLoadingKey("");
    }
  };

  const updateActive = async (user: AdminUser, isActive: boolean) => {
    const token = getClientToken();
    if (!token) return;

    const key = `active-${user.id}`;
    setLoadingKey(key);
    try {
      await setUserActive(user.id, isActive, token);
      onUpdated?.();
    } finally {
      setLoadingKey("");
    }
  };

  const handleDownloadUserPdf = async (user: AdminUser) => {
    const token = getClientToken();
    if (!token) return;

    const key = `pdf-${user.id}`;
    setLoadingKey(key);
    try {
      await downloadUserSpecificExportPdf(user.id, token);
      setToast({ open: true, message: `Report for User #${user.id} downloaded!`, variant: "success" });
    } catch (error) {
      setToast({ open: true, message: "Failed to download PDF", variant: "error" });
    } finally {
      setLoadingKey("");
    }
  };

  return (
    <div className="neu-raised rounded-2xl overflow-hidden">
      <div className="border-b border-[var(--glass-border)] px-5 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Users</h2>
        <span className="text-sm text-[var(--text-muted)]">{users.length} users</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)]">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Email</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Role</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Purchased Books</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[var(--glass-border)] last:border-0 hover:bg-[var(--accent-soft)] transition-colors">
                <td className="px-5 py-4 text-[var(--text-primary)]">{user.email}</td>
                <td className="px-5 py-4">
                  <NeuBadge tone={user.role === "admin" ? "info" : "default"}>{user.role}</NeuBadge>
                </td>
                <td className="px-5 py-4 flex items-center gap-2">
                  <NeuBadge tone={user.isActive ? "success" : "warning"}>{user.isActive ? "Active" : "Inactive"}</NeuBadge>
                  <NeuBadge tone={user.isBlocked ? "danger" : "success"}>{user.isBlocked ? "Blocked" : "Unblocked"}</NeuBadge>
                </td>
                <td className="px-5 py-4">
                  {user.purchasedBooks && user.purchasedBooks.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {user.purchasedBooks.map((book) => (
                        <div key={book.id} className="text-xs flex items-center justify-between border-b border-[var(--glass-border)] py-1 last:border-0">
                          <span className="truncate max-w-[120px] font-medium text-[var(--accent)]" title={book.title}>
                            {book.title}
                          </span>
                          <span className="text-[var(--text-muted)]">₹{book.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)] italic">No purchases</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <NeuButton
                      variant="ghost"
                      className="text-xs min-h-[32px] px-3 py-1"
                      onClick={() => updateBlocked(user, !user.isBlocked)}
                      loading={loadingKey === `block-${user.id}`}
                    >
                      {user.isBlocked ? "Unblock" : "Block"}
                    </NeuButton>
                    <NeuButton
                      variant="ghost"
                      className="text-xs min-h-[32px] px-3 py-1"
                      onClick={() => updateActive(user, !user.isActive)}
                      loading={loadingKey === `active-${user.id}`}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </NeuButton>
                    <NeuButton
                      variant="secondary"
                      className="text-xs min-h-[32px] px-3 py-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                      onClick={() => handleDownloadUserPdf(user)}
                      loading={loadingKey === `pdf-${user.id}`}
                    >
                      Download PDF
                    </NeuButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NeuToast 
        open={toast.open} 
        message={toast.message} 
        variant={toast.variant} 
        onClose={() => setToast({ ...toast, open: false })} 
      />
    </div>
  );
}
