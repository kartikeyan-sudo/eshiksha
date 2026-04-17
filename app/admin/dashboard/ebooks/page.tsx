"use client";

import { useEffect, useState } from "react";
import { EbookTable } from "@/components/admin/EbookTable";
import { BackButton } from "@/components/ui/BackButton";
import { listEbooks } from "@/lib/api";
import type { Ebook } from "@/lib/types";

export default function AdminEbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);

  const loadEbooks = async () => {
    const result = await listEbooks().catch(() => []);
    setEbooks(result);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await listEbooks().catch(() => []);
      if (!cancelled) setEbooks(result);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <BackButton />
      <EbookTable ebooks={ebooks} onDeleted={loadEbooks} />
    </div>
  );
}
