import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "success" | "warning" | "destructive" | "outline" | "accent";

const variants: Record<Variant, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
  accent: "bg-accent/10 text-accent ring-1 ring-inset ring-accent/25",
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/25",
  warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
  destructive: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25",
  outline: "border border-border text-foreground bg-surface",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
