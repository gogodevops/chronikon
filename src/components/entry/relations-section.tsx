"use client";

import * as React from "react";
import { Link2, Plus } from "lucide-react";

import { RelationsList } from "@/components/entry/entry-tab-content";
import { RelationComposer } from "@/components/entry/relation-composer";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { cn } from "@/lib/utils";
import type { LinkableEntryResult } from "@/lib/queries";
import type { SerializedRelation } from "@/lib/queries";

export const RELATIONS_SECTION_ID = "entry-section-verknuepfungen";
export const OPEN_RELATIONS_EVENT = "chronikon:open-relations";

export function RelationsSection({
  entryId,
  relations = [],
  relationSearchResults = [],
  relationSearchError = null,
  onRelationSearch,
  onNavigateEntry,
  onRelationSubmit,
  onRelationDelete,
  canEdit = true,
  hint,
}: {
  entryId: string;
  relations?: SerializedRelation[];
  relationSearchResults?: LinkableEntryResult[];
  relationSearchError?: string | null;
  onRelationSearch?: (query: string) => void;
  onNavigateEntry?: (entryId: string, projectSlug?: string) => void;
  onRelationSubmit?: (
    data: unknown,
  ) => boolean | void | Promise<boolean | void>;
  onRelationDelete?: (
    relationId: string,
    otherEntryTitle?: string,
    typeLabel?: string,
  ) => void;
  canEdit?: boolean;
  hint?: string;
}) {
  const [open, setOpen] = React.useState(relations.length > 0);
  const [showComposer, setShowComposer] = React.useState(false);

  React.useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      if (canEdit) setShowComposer(true);
    };
    window.addEventListener(OPEN_RELATIONS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_RELATIONS_EVENT, handleOpen);
  }, [canEdit]);

  React.useEffect(() => {
    if (relations.length > 0) setOpen(true);
  }, [relations.length]);

  const sectionActions =
    canEdit && onRelationSubmit ? (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setShowComposer((value) => !value);
        }}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[0.68rem] font-medium transition-colors",
          showComposer
            ? "border-accent/40 bg-accent-dim/50 text-accent"
            : "border-border/70 bg-surface-3/50 text-muted-foreground hover:border-accent/30 hover:text-accent",
        )}
      >
        <Plus className="h-3 w-3" />
        Hinzufügen
      </button>
    ) : undefined;

  return (
    <div id={RELATIONS_SECTION_ID}>
      <CollapsibleSection
        title="Verknüpfungen"
        count={relations.length}
        hint={hint}
        open={open}
        onOpenChange={setOpen}
        actions={sectionActions}
      >
        <RelationsList
          relations={relations}
          onNavigate={onNavigateEntry}
          onDelete={onRelationDelete}
          canEdit={canEdit}
        />
        {canEdit && onRelationSubmit && showComposer && (
          <RelationComposer
            entryId={entryId}
            searchResults={relationSearchResults}
            searchError={relationSearchError}
            onSearch={onRelationSearch}
            onSubmit={async (data) => {
              const ok = await onRelationSubmit(data);
              if (ok !== false) setShowComposer(false);
              return ok;
            }}
            onCancel={() => setShowComposer(false)}
          />
        )}
        {canEdit && onRelationSubmit && !showComposer && relations.length === 0 && (
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[0.78rem] text-accent hover:underline"
          >
            <Link2 className="h-3.5 w-3.5" />
            Verknüpfung hinzufügen
          </button>
        )}
      </CollapsibleSection>
    </div>
  );
}
