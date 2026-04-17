"use client";

import { useEffect, useState } from "react";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { BackButton } from "@/components/ui/BackButton";
import { listAdminUsers } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadUsers = async () => {
    const token = getClientToken();
    if (!token) {
      setUsers([]);
      return;
    }

    const result = await listAdminUsers(token).catch(() => []);
    setUsers(result);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = getClientToken();
      if (!token) {
        if (!cancelled) setUsers([]);
        return;
      }

      const result = await listAdminUsers(token).catch(() => []);
      if (!cancelled) setUsers(result);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
          <p className="text-sm text-[var(--text-muted)]">Control user account status, access, and permissions.</p>
        </div>
        <BackButton />
      </div>
      <UserManagementTable users={users} onUpdated={loadUsers} />
    </div>
  );
}
