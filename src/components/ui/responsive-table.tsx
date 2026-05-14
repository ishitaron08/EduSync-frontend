import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ResponsiveTableProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string;
  table: ReactNode;
  renderCard: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  className?: string;
};

export function ResponsiveTable<T>({
  items,
  getKey,
  table,
  renderCard,
  empty,
  className
}: ResponsiveTableProps<T>) {
  if (items.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={cn("min-w-0 max-w-full", className)}>
      <div className="hidden max-w-full overflow-x-auto rounded-xl border border-[var(--border-subtle)] [-webkit-overflow-scrolling:touch] md:block">
        {table}
      </div>
      <div className="space-y-3 md:hidden">
        {items.map((item, index) => (
          <div key={getKey(item, index)}>
            {renderCard(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
