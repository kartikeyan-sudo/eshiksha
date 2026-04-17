"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/api";
import { setClientAuth } from "@/lib/auth";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuInput } from "@/components/ui/NeuInput";
import { NeuCheckbox } from "@/components/ui/NeuCheckbox";
import { NeuToast } from "@/components/ui/NeuToast";

export function LoginForm() {
  const router = useRouter();
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      setClientAuth(response.token, response.user.role);
      router.replace("/");
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Login failed");
      setToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="glass-surface animate-fade-in w-full max-w-md rounded-2xl p-8 mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white text-xl font-bold shadow-lg">
            ES
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome Back</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Sign in to access your ebooks</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <NeuInput
            type="email"
            label="Email Address"
            placeholder="you@example.com"
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

          <div className="flex items-center justify-between">
            <NeuCheckbox checked={remember} onChange={setRemember} label="Remember me" />
            <button type="button" className="text-xs text-[var(--accent)] hover:underline">
              Forgot password?
            </button>
          </div>

          <NeuButton type="submit" className="w-full" loading={loading}>
            Sign In
          </NeuButton>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
          <span className="text-xs text-[var(--text-muted)]">or</span>
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
        </div>

        {/* Social (placeholder) */}
        <div className="grid grid-cols-2 gap-3">
          <NeuButton variant="secondary" className="text-xs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1.5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </NeuButton>
          <NeuButton variant="secondary" className="text-xs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1.5">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </NeuButton>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>

      <NeuToast message={message} open={toast} variant={toastVariant} onClose={() => setToast(false)} />
    </>
  );
}
