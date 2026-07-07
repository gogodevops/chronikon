"use client";

import { cn } from "@/lib/utils";
import { PROJECT_ICON_OPTIONS } from "@/lib/project-icons";

export function ProjectIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
      {PROJECT_ICON_OPTIONS.map(({ symbol, label }) => (
        <button
          key={symbol}
          type="button"
          title={label}
          onClick={() => onChange(symbol)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
            value === symbol
              ? "border-accent bg-accent-dim ring-1 ring-accent/30"
              : "border-border/80 bg-surface-2/50 hover:border-accent/40 hover:bg-surface-3",
          )}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
