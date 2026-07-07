import * as React from "react";

import { cn } from "@/lib/utils";

/** Shared card surface */
export function ChCard({
  className,
  hover,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-surface-2/70",
        hover && "transition-colors hover:border-accent/25 hover:bg-surface-3/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section label used across panels */
export function ChSectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Composer form wrapper */
export function ChComposer({
  title,
  icon: Icon,
  children,
  className,
  onSubmit,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "mt-4 rounded-xl border border-dashed border-border/70 bg-surface-2/40 p-4",
        className,
      )}
    >
      <h5 className="mb-3 flex items-center gap-2 text-[0.78rem] font-medium text-foreground">
        {Icon && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface-3 text-accent">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
        {title}
      </h5>
      {children}
    </form>
  );
}

/** Metadata pill in detail header */
export function ChMetaPill({
  label,
  value,
  color,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-3/50 px-2.5 py-1.5">
      <dt className="text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className="mt-0.5 text-[0.78rem] font-medium leading-snug"
        style={color ? { color } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

/** Empty state block */
export function ChEmpty({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/50 bg-surface-2/30 px-4 py-6 text-center text-[0.8rem] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

const VIEW_MAX_WIDTH = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-none",
} as const;

/** Full-height page shell — scroll only inside the content area */
export function ViewFrame({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  maxWidth = "lg",
  fixedBody = false,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: keyof typeof VIEW_MAX_WIDTH;
  fixedBody?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-background",
        className,
      )}
    >
      <header className="shrink-0 border-b border-border/60 px-5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-0.5 text-[0.68rem] font-medium uppercase tracking-widest text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions}
        </div>
      </header>
      <div
        className={cn(
          "min-h-0 flex-1",
          fixedBody ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          contentClassName,
        )}
      >
        {fixedBody ? (
          children
        ) : (
          <div
            className={cn(
              "mx-auto w-full px-5 py-4",
              VIEW_MAX_WIDTH[maxWidth],
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
