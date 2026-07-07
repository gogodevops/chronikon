"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const COLLAPSE_LIST_THRESHOLD = 3;

export function useCollapsibleList(
  itemIds: string[],
  defaultCollapsed = false,
) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    if (defaultCollapsed || itemIds.length > COLLAPSE_LIST_THRESHOLD) {
      return new Set();
    }
    return new Set(itemIds);
  });

  React.useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set<string>();
      for (const id of itemIds) {
        if (prev.has(id)) next.add(id);
      }
      return next;
    });
  }, [itemIds.join(",")]);

  const allExpanded =
    itemIds.length > 0 && expandedIds.size === itemIds.length;
  const noneExpanded = expandedIds.size === 0;

  const toggle = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    setExpandedIds(new Set(itemIds));
  }, [itemIds]);

  const collapseAll = React.useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return {
    expandedIds,
    allExpanded,
    noneExpanded,
    toggle,
    expandAll,
    collapseAll,
    isExpanded: (id: string) => expandedIds.has(id),
  };
}

export function CollapsibleListControls({
  onExpandAll,
  onCollapseAll,
  allExpanded,
  noneExpanded,
  className,
}: {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  allExpanded: boolean;
  noneExpanded: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-end gap-2", className)}>
      <button
        type="button"
        onClick={onExpandAll}
        disabled={allExpanded}
        className="cursor-pointer text-[0.72rem] text-accent hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
      >
        Alle aufklappen
      </button>
      <span className="text-[0.72rem] text-muted-foreground">·</span>
      <button
        type="button"
        onClick={onCollapseAll}
        disabled={noneExpanded}
        className="cursor-pointer text-[0.72rem] text-accent hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
      >
        Alle einklappen
      </button>
    </div>
  );
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen,
  actions,
  children,
  className,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-surface-2/40",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              !open && "-rotate-90",
            )}
          />
          <h3 className="text-[0.72rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
            {count !== undefined ? ` (${count})` : ""}
          </h3>
        </button>
        {actions}
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 px-3 pb-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function CollapsibleItem({
  id,
  isOpen,
  onToggle,
  header,
  children,
  className,
}: {
  id: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-surface-2/60 transition-colors",
        isOpen && "border-border",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3/30"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            !isOpen && "-rotate-90",
          )}
        />
        <div className="min-w-0 flex-1">{header}</div>
        <span className="shrink-0 text-[0.68rem] text-accent">
          {isOpen ? "Einklappen" : "Aufklappen"}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 px-3 pb-3 pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
