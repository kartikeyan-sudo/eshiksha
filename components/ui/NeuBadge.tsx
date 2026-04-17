import { cn } from "@/lib/utils";

type Tone = "default" | "info" | "success" | "warning" | "danger";

type NeuBadgeProps = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

const toneClass: Record<Tone, string> = {
  default: "bg-[var(--accent-soft)] text-[var(--text-primary)]",
  info: "bg-[var(--info)]/15 text-[var(--info)]",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
  danger: "bg-[var(--danger)]/15 text-[var(--danger)]",
};

export function NeuBadge({ children, tone = "default", className }: NeuBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClass[tone], className)}>
      {children}
    </span>
  );
}
