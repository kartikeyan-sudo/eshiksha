"use client";

import { useEffect, useState } from "react";

export function GlobalLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1 second loading screen per request

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
