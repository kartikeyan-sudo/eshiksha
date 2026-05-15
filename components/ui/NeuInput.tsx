import { cn } from "@/lib/utils";

type NeuInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function NeuInput({ className, label, error, id, ...props }: NeuInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "neu-inset w-full min-h-[44px] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)]",
          "placeholder:text-[var(--text-muted)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          "transition-shadow duration-200",
          error && "ring-2 ring-[var(--danger)]",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
