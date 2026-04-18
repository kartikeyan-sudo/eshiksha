"use client";

import { useEffect, useState } from "react";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { BackButton } from "@/components/ui/BackButton";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuToast } from "@/components/ui/NeuToast";
import { listAdminUsers, downloadUsersExportPdf } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" as "success" | "error" });

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

  const handleDownloadReport = async () => {
    const token = getClientToken();
    if (!token) return;
    
    try {
      setDownloading(true);
      await downloadUsersExportPdf(token);
      setToast({ open: true, message: "PDF Report Downloaded Successfully!", variant: "success" });
    } catch (error) {
      setToast({ open: true, message: "Failed to download PDF", variant: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
          <p className="text-sm text-[var(--text-muted)]">Control user account status, access, and permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <BackButton />
          <NeuButton 
            variant="secondary"
            onClick={handleDownloadReport}
            loading={downloading}
          >
            <span className="flex items-center gap-2">
              📄 Download Activity PDF
            </span>
          </NeuButton>
        </div>
      </div>
      <UserManagementTable users={users} onUpdated={loadUsers} />

      <NeuToast 
        open={toast.open} 
        message={toast.message} 
        variant={toast.variant} 
        onClose={() => setToast({ ...toast, open: false })} 
      />
    </div>
  );
}
