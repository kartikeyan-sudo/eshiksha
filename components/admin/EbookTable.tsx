"use client";

import { useState } from "react";
import { NeuBadge } from "@/components/ui/NeuBadge";
import { NeuButton } from "@/components/ui/NeuButton";
import { deleteEbook } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { Ebook } from "@/lib/types";
import { formatINR } from "@/lib/utils";

type EbookTableProps = {
  ebooks: Ebook[];
  onDeleted?: () => void;
};

export function EbookTable({ ebooks, onDeleted }: EbookTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const onDelete = async (ebookId: number) => {
    const token = getClientToken();
    if (!token) return;

    setDeletingId(ebookId);
    try {
      await deleteEbook(ebookId, token);
      onDeleted?.();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="neu-raised rounded-2xl overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-[var(--glass-border)] px-5 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">All Ebooks</h2>
        <span className="text-sm text-[var(--text-muted)]">{ebooks.length} items</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)]">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Ebook</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hidden sm:table-cell">Category</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Price</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hidden md:table-cell">Status</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ebooks.map((ebook) => (
              <tr key={ebook.id} className="border-b border-[var(--glass-border)] last:border-0 hover:bg-[var(--accent-soft)] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={ebook.coverUrl} alt={ebook.title} className="h-10 w-7 rounded-md object-cover flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)] line-clamp-1">{ebook.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">ID #{ebook.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <NeuBadge tone="info">Preview {ebook.previewPages}</NeuBadge>
                </td>
                <td className="px-5 py-4">
                  <span className="font-semibold text-[var(--text-primary)]">{formatINR(ebook.price)}</span>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <NeuBadge tone="success">Published</NeuBadge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <NeuButton variant="ghost" className="text-xs min-h-[32px] px-3 py-1" disabled>View</NeuButton>
                    <NeuButton
                      variant="ghost"
                      className="text-xs min-h-[32px] px-3 py-1 text-[var(--danger)]"
                      onClick={() => onDelete(ebook.id)}
                      loading={deletingId === ebook.id}
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
    </div>
  );
}
