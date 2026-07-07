import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent-dim text-accent border border-accent/30",
        secondary: "bg-surface-2 text-muted-foreground border border-border",
        outline: "border border-border text-foreground",
        destructive: "bg-destructive/15 text-destructive border border-destructive/30",
        success: "bg-green/15 text-green border border-green/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
