"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/api";
import { setClientAuth } from "@/lib/auth";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuInput } from "@/components/ui/NeuInput";
import { NeuCheckbox } from "@/components/ui/NeuCheckbox";
import { NeuToast } from "@/components/ui/NeuToast";

export function SignupForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
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
    if (!agreed) return;

    setLoading(true);

    try {
      const response = await registerUser(email, password);
      setClientAuth(response.token, response.user.role);
      setToastVariant("success");
      setMessage("Account created successfully");
      setToast(true);
      router.replace("/");
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Registration failed");
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create Account</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Join EShikhsha and start learning</p>
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
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <NeuCheckbox
            checked={agreed}
            onChange={setAgreed}
            label="I agree to the Terms of Service and Privacy Policy"
          />

          <NeuButton type="submit" className="w-full" loading={loading} disabled={!agreed}>
            Create Account
          </NeuButton>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>

      <NeuToast message={message} open={toast} variant={toastVariant} onClose={() => setToast(false)} />
    </>
  );
}
