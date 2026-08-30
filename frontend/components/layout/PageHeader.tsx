import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Consistent page header used across every authenticated page: bold 2xl
 * title, optional subtitle, and an optional right-aligned action slot.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}