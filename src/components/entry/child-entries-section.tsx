"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SerializedChildEntry } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ChildEntriesSection({
  children: childEntries,
  onNavigate,
  onCreateChild,
  canEdit = true,
}: {
  children: SerializedChildEntry[];
  onNavigate?: (entryId: string) => void;
  onCreateChild?: () => void;
  canEdit?: boolean;
}) {
  return (
    <section className="mb-4 rounded-xl border border-border/70 bg-surface-2/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[0.72rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Untereinträge ({childEntries.length})
        </h3>
        {canEdit && onCreateChild && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-[0.68rem] text-accent hover:border-accent/40 hover:bg-accent-dim"
            onClick={onCreateChild}
          >
            <Plus className="h-3 w-3" />
            Untereintrag anlegen
          </Button>
        )}
      </div>

      {childEntries.length === 0 ? (
        <p className="text-[0.78rem] text-muted-foreground">
          Noch keine Kapitel, Seiten oder Abschnitte — z. B. für einzelne
          Buchteile anlegen.
        </p>
      ) : (
        <ul className="space-y-1">
          {childEntries.map((child) => {
            const discussionCount = child.questionCount + child.commentCount;
            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onNavigate?.(child.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-surface/50 px-2.5 py-2 text-left text-[0.8rem] transition-colors hover:border-accent/30 hover:bg-surface-3/50",
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: child.typeColor }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {child.title}
                  </span>
                  <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                    {child.typeLabel}
                    {discussionCount > 0 ? ` · ${discussionCount} Disk.` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
