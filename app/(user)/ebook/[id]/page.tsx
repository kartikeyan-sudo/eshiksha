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
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[var(--text-muted)]">Loading ebook details...</div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        <div className="glass-surface rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-[var(--danger)]">{error || "Ebook not found"}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Try going back to the catalog and opening the book again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <BackButton className="mb-4" />
      <EbookDetailView ebook={ebook} />
    </div>
  );
}
