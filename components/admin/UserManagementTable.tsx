"use client";

import { useState } from "react";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { getClientToken } from "@/lib/auth";
import { setUserActive, setUserBlocked } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

type UserManagementTableProps = {
  users: AdminUser[];
  onUpdated?: () => void;
};

export function UserManagementTable({ users, onUpdated }: UserManagementTableProps) {
  const [loadingKey, setLoadingKey] = useState<string>("");

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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
