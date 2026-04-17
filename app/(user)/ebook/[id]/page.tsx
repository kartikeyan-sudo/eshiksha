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
    return <div className="mx-auto w-full max-w-6xl px-4 py-8 text-center text-sm text-[var(--text-muted)]">Loading ebook...</div>;
  }

  if (!ebook) {
    return <div className="mx-auto w-full max-w-6xl px-4 py-8 text-center text-sm text-[var(--danger)]">{error || "Ebook not found"}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <BackButton className="mb-4" />
      <EbookDetailView ebook={ebook} />
    </div>
  );
}
