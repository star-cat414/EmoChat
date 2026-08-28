import * as React from "react";

import { cn } from "@/lib/utils";

export const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    src?: string | null;
    alt?: string;
    size?: "sm" | "md" | "lg";
  }
>(({ className, src, alt = "", size = "md", children, ...props }, ref) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
  };
  return (
    <span
      ref={ref}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-foreground font-semibold",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        children
      )}
    </span>
  );
});
Avatar.displayName = "Avatar";

export function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}
