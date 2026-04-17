import { cn } from "@/lib/utils";

type NeuLoaderProps = {
  type?: "spinner" | "skeleton";
  className?: string;
};

export function NeuLoader({ type = "spinner", className }: NeuLoaderProps) {
  if (type === "skeleton") {
    return <div className={cn("skeleton-shimmer h-24 w-full rounded-xl", className)} aria-hidden="true" />;
  }

  return (
    <div
      className={cn("h-8 w-8 animate-spin rounded-full border-3 border-[var(--surface)] border-t-[var(--accent)]", className)}
      role="status"
      aria-label="Loading"
    />
  );
}
