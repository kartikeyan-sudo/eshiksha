import Link from "next/link";
import { NeuButton } from "@/components/ui/NeuButton";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
      <div className="neu-raised w-full rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Unauthorized</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          You do not have permission to access this area.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <NeuButton variant="secondary">Go Home</NeuButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
