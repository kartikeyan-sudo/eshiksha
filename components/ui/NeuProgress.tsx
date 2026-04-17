type NeuProgressProps = {
  value: number;
  className?: string;
};

export function NeuProgress({ value, className }: NeuProgressProps) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`neu-inset h-2.5 w-full rounded-full ${className || ""}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--info)] transition-all duration-700 ease-out"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
