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
    <div className="brutalist-card bg-white border-4 border-black overflow-hidden shadow-[8px_8px_0px_black]">
      <div className="border-b-4 border-black px-6 py-4 flex items-center justify-between bg-gray-50">
        <h2 className="text-2xl font-['Anton'] uppercase tracking-tight">Personnel Directory</h2>
        <span className="font-['Bebas_Neue'] text-lg text-gray-500 uppercase">{users.length} Active Agents</span>
      </div>

      {users.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-['Bebas_Neue'] text-xl text-gray-500 uppercase">No personnel records found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-white">
                <th className="px-6 py-4 font-['Bebas_Neue'] text-lg uppercase tracking-widest text-black">Identifier</th>
                <th className="px-6 py-4 font-['Bebas_Neue'] text-lg uppercase tracking-widest text-black">Protocol</th>
                <th className="px-6 py-4 font-['Bebas_Neue'] text-lg uppercase tracking-widest text-black">Status</th>
                <th className="px-6 py-4 font-['Bebas_Neue'] text-lg uppercase tracking-widest text-black">Acquisitions</th>
                <th className="px-6 py-4 font-['Bebas_Neue'] text-lg uppercase tracking-widest text-black">Operations</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b-2 border-black last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-black">{user.email}</td>
                  <td className="px-6 py-4">
                    <NeuBadge tone={user.role === "admin" ? "info" : "neutral"}>{user.role}</NeuBadge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                       <NeuBadge tone={user.isActive ? "success" : "warning"}>{user.isActive ? "ACTIVE" : "INACTIVE"}</NeuBadge>
                       <NeuBadge tone={user.isBlocked ? "danger" : "success"}>{user.isBlocked ? "BLOCKED" : "CLEAR"}</NeuBadge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.purchasedBooks && user.purchasedBooks.length > 0 ? (
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-2">
                        {user.purchasedBooks.map((book) => (
                          <div key={book.id} className="text-xs flex items-center justify-between border-b border-black/10 py-1 last:border-0">
                            <span className="truncate max-w-[120px] font-bold text-[#b83227]" title={book.title}>
                              {book.title}
                            </span>
                            <span className="text-gray-400">₹{book.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No assets acquired</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <NeuButton
                        variant="secondary"
                        className="text-xs py-1 px-3 min-h-0"
                        onClick={() => updateBlocked(user, !user.isBlocked)}
                        loading={loadingKey === `block-${user.id}`}
                      >
                        {user.isBlocked ? "CLEAR" : "BLOCK"}
                      </NeuButton>
                      <NeuButton
                        variant="secondary"
                        className="text-xs py-1 px-3 min-h-0"
                        onClick={() => updateActive(user, !user.isActive)}
                        loading={loadingKey === `active-${user.id}`}
                      >
                        {user.isActive ? "DISABLE" : "ENABLE"}
                      </NeuButton>
                      <button
                        className="px-3 py-1 border-2 border-black bg-white font-['Bebas_Neue'] text-xs hover:bg-black hover:text-white transition-all disabled:opacity-50"
                        onClick={() => handleDownloadUserPdf(user)}
                        disabled={loadingKey === `pdf-${user.id}`}
                      >
                        {loadingKey === `pdf-${user.id}` ? "EXPORTING..." : "EXPORT DATA"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NeuToast 
        open={toast.open} 
        message={toast.message} 
        variant={toast.variant} 
        onClose={() => setToast({ ...toast, open: false })} 
      />
    </div>
  );
}
