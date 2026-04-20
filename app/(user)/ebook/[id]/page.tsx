"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EbookDetailView } from "@/components/ebook/EbookDetailView";
import { BackButton } from "@/components/ui/BackButton";
import { getEbook } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { Ebook } from "@/lib/types";

export default function EbookPage() {
  const params = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;

    const token = getClientToken();

    getEbook(params.id, token)
      .then((data) => {
        setEbook(data);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load ebook");
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 animate-fade-in">
        <div className="glass-surface rounded-2xl p-12 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-[var(--accent-soft)] border-t-[var(--accent)]" />
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading ebook details...</p>
        </div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 animate-fade-in">
        <BackButton className="mb-6" />
        <div className="empty-state">
          <span className="text-5xl">📖</span>
          <h2 className="text-xl font-semibold text-[var(--danger)]">{error || "Ebook not found"}</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">Try going back to the catalog and opening the book again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:px-8 md:pb-8 animate-fade-in">
      <BackButton className="mb-6" label="Back to Catalog" />
      <EbookDetailView ebook={ebook} />
    </div>
  );
}
