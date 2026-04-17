import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-center px-4 py-10 md:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Welcome</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">Sign in to continue learning</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Your library, notes, and reading progress are waiting.</p>
      </div>
      <LoginForm />
    </div>
  );
}
