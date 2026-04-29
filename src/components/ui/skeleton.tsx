import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("nc-skeleton rounded-[8px]", className)} />;
}
