import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 md:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Restricted</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">Admin Console Access</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Authenticate to manage users, content, and platform operations.</p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
