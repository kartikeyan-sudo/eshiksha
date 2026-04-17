"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearClientAuth, getClientToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";

type AdminSessionGuardProps = {
  children: React.ReactNode;
};

export function AdminSessionGuard({ children }: AdminSessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const validate = async () => {
      const token = getClientToken();
      if (!token) {
        clearClientAuth();
        router.replace("/admin?reason=session-expired");
        return;
      }

      try {
        const result = await getCurrentUser(token);
        if (result.user.role !== "admin") {
          clearClientAuth();
          router.replace("/unauthorized");
          return;
        }

        if (mounted) {
          setChecking(false);
        }
      } catch {
        clearClientAuth();
        router.replace("/admin?reason=session-expired");
      }
    };

    void validate();

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
