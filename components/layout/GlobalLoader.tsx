"use client";

import { useEffect, useState } from "react";

const LOADER_SEEN_KEY = "eshikhsha-loader-seen";

export function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(LOADER_SEEN_KEY) === "1";
      if (seen) {
        setLoading(false);
        return;
      }

      setLoading(true);
      sessionStorage.setItem(LOADER_SEEN_KEY, "1");
    } catch {
      setLoading(true);
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 260);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg)] transition-opacity duration-300">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent-soft)] border-t-[var(--accent)]"></div>
      <p className="mt-4 font-semibold text-[var(--text-primary)] animate-pulse">Loading EShikhsha...</p>
    </div>
  );
}
