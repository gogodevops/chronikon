"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatEntryPageRange } from "@/lib/entry-hierarchy";
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
  const createButton =
    canEdit && onCreateChild ? (
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
    ) : null;

  if (childEntries.length === 0) {
    return (
      <CollapsibleSection
        title="Untereinträge"
        count={0}
        actions={createButton}
      >
        <p className="pt-1 text-[0.78rem] text-muted-foreground">
          Noch keine Kapitel, Seiten oder Abschnitte — z. B. für einzelne
          Buchteile anlegen.
        </p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title="Untereinträge"
      count={childEntries.length}
      actions={createButton}
    >
      <ul className="space-y-1 pt-1">
        {childEntries.map((child) => {
          const pageLabel = formatEntryPageRange(child.pageStart, child.pageEnd);
          const openCount = child.questionCount + child.commentCount;

          return (
            <li key={child.id}>
              <button
                type="button"
                onClick={() => onNavigate?.(child.id)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-surface/50 px-2.5 py-2 text-left text-[0.8rem] transition-colors hover:border-accent/30 hover:bg-surface-3/50",
                )}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: child.typeColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-medium leading-snug">
                    <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                      ↳
                    </span>
                    {pageLabel && (
                      <span
                        className="shrink-0 font-semibold tabular-nums text-accent"
                        title="Seitenbereich"
                      >
                        {pageLabel}
                      </span>
                    )}
                    <span className="truncate">{child.title}</span>
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                    {child.typeLabel}
                    {openCount > 0 ? ` · ${openCount} offen` : ""}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </CollapsibleSection>
  );
}
