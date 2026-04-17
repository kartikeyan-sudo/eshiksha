import { cn } from "@/lib/utils";

type Shape = "card" | "text" | "avatar" | "row";

type SkeletonLoaderProps = {
  shape?: Shape;
  count?: number;
  className?: string;
};

function SingleSkeleton({ shape = "card", className }: { shape: Shape; className?: string }) {
  const shapeClasses: Record<Shape, string> = {
    card: "h-64 w-full rounded-2xl",
    text: "h-4 w-full rounded-lg",
    avatar: "h-12 w-12 rounded-full",
    row: "h-16 w-full rounded-xl",
  };

  return (
    <div
      className={cn("skeleton-shimmer", shapeClasses[shape], className)}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function SkeletonLoader({ shape = "card", count = 1, className }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SingleSkeleton key={i} shape={shape} className={className} />
      ))}
    </>
  );
}
