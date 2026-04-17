import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type NeuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)]",
  secondary: "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--glass-border)] hover:border-[var(--accent)]/30",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
};

export function NeuButton({ className, variant = "primary", loading, children, disabled, ...props }: NeuButtonProps) {
  return (
    <button
      className={cn(
        "neu-btn inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
