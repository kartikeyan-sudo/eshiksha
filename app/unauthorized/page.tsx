import Link from "next/link";
import { NeuButton } from "@/components/ui/NeuButton";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-3xl items-center justify-center px-4 py-10 md:px-8">
      <div className="glass-surface w-full rounded-2xl p-8 text-center md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--danger)]">Access Denied</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">Unauthorized</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-muted)]">
          You do not have permission to access this page. Please sign in with the correct account.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <NeuButton variant="secondary">Go Home</NeuButton>
          </Link>
          <Link href="/login">
            <NeuButton>Sign In</NeuButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
