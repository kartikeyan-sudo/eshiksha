import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-center px-4 py-10 md:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Get Started</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">Create your EShikhsha account</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Access premium ebooks, track progress, and build your learning path.</p>
      </div>
      <SignupForm />
    </div>
  );
}
