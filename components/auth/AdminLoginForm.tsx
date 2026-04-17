"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { setClientAuth } from "@/lib/auth";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuInput } from "@/components/ui/NeuInput";
import { NeuToast } from "@/components/ui/NeuToast";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginAdmin(email, password);
      setClientAuth(response.token, response.user.role);
      setToastVariant("success");
      setMessage("Admin authenticated. Redirecting...");
      setToast(true);
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Admin login failed");
      setToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="animate-fade-in w-full max-w-sm mx-auto">
        {/* Dark glass card for serious tone */}
        <div className="neu-raised rounded-2xl p-8 border border-[var(--glass-border)]">
          {/* Shield Icon */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Admin Access</h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Restricted area — authorized personnel only</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <NeuInput
              type="email"
              label="Admin Email"
              placeholder="admin@eshikhsha.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
            <NeuInput
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />

            <NeuButton type="submit" className="w-full" loading={loading}>
              Authenticate
            </NeuButton>
          </form>
        </div>

        {/* Security notice */}
        <p className="mt-4 text-center text-xs text-[var(--text-muted)] opacity-60">
          This page is not publicly linked. All login attempts are logged.
        </p>
      </div>

      <NeuToast message={message} open={toast} variant={toastVariant} onClose={() => setToast(false)} />
    </>
  );
}
