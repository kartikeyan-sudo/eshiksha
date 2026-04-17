"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearClientAuth, getClientToken } from "@/lib/auth";

type AdminSessionGuardProps = {
  children: React.ReactNode;
};

const ADMIN_SESSION_CACHE_KEY = "eshikhsha-admin-session-ok";
const ADMIN_SESSION_CACHE_TTL_MS = 2 * 60 * 1000;

function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { role?: string; exp?: number };
  } catch {
    return null;
  }
}

function hasFreshAdminSessionCache() {
  try {
    const stampRaw = sessionStorage.getItem(ADMIN_SESSION_CACHE_KEY);
    if (!stampRaw) return false;

    const stamp = Number(stampRaw);
    if (!Number.isFinite(stamp)) return false;
    return Date.now() - stamp < ADMIN_SESSION_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

function setAdminSessionCache() {
  try {
    sessionStorage.setItem(ADMIN_SESSION_CACHE_KEY, String(Date.now()));
  } catch {
    // Ignore cache-write errors and proceed with normal auth flow.
  }
}

export function AdminSessionGuard({ children }: AdminSessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const validate = () => {
      const token = getClientToken();
      if (!token) {
        clearClientAuth();
        router.replace("/admin?reason=session-expired");
        return;
      }

      const payload = decodeJwtPayload(token);
      if (!payload) {
        clearClientAuth();
        router.replace("/admin?reason=session-expired");
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp <= now) {
        clearClientAuth();
        router.replace("/admin?reason=session-expired");
        return;
      }

      if (payload.role !== "admin") {
        clearClientAuth();
        router.replace("/unauthorized");
        return;
      }

      if (!hasFreshAdminSessionCache()) {
        setAdminSessionCache();
      }

      if (mounted) {
        setChecking(false);
      }
    };

    validate();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 text-center text-sm text-[var(--text-muted)]">
        Validating admin session...
      </div>
    );
  }

  return <>{children}</>;
}
