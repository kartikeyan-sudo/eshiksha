import { cn } from "@/lib/utils";

type Variant = "raised" | "glass" | "inset";

type NeuCardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
};

const variantClass: Record<Variant, string> = {
  raised: "neu-raised",
  glass: "glass-surface",
  inset: "neu-inset",
};

export function NeuCard({ className, variant = "raised", ...props }: NeuCardProps) {
  return (
    <div
      className={cn(
        variantClass[variant],
        "rounded-2xl p-5",
        className,
      )}
      {...props}
    />
  );
}
