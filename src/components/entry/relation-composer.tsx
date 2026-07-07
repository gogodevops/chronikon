"use client";

import * as React from "react";
import { Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChComposer } from "@/components/ui/chronikon-shell";
import { RELATION_LABELS } from "@/lib/constants";
import type { RelationType } from "@prisma/client";

export interface RelationFormData {
  targetEntryId: string;
  targetTitle: string;
  relationType: RelationType;
}

export interface RelationComposerProps {
  entryId: string;
  relationTypes?: { value: RelationType; label: string }[];
  searchResults?: {
    id: string;
    title: string;
    typeColor?: string;
    projectSlug?: string;
    projectName?: string;
    projectIcon?: string;
    isCurrentProject?: boolean;
  }[];
  searchError?: string | null;
  onSearch?: (query: string) => void;
  onSubmit?: (data: RelationFormData) => boolean | void | Promise<boolean | void>;
  onCancel?: () => void;
}

const DEFAULT_RELATION_TYPES = (
  Object.entries(RELATION_LABELS) as [RelationType, string][]
).map(([value, label]) => ({ value, label }));

export function RelationComposer({
  relationTypes = DEFAULT_RELATION_TYPES,
  searchResults = [],
  searchError = null,
  onSearch,
  onSubmit,
  onCancel,
}: RelationComposerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const [relationType, setRelationType] = React.useState<RelationType>(
    relationTypes[0]?.value ?? "discusses",
  );
  const [browseActive, setBrowseActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setBrowseActive(true);
    onSearch?.("");
    inputRef.current?.focus();
  }, [onSearch]);

  React.useEffect(() => {
    if (!browseActive && !query.trim()) return;
    onSearch?.(query);
  }, [query, browseActive, onSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || submitting) return;

    setSubmitting(true);
    try {
      const ok = await onSubmit?.({
        targetEntryId: selected.id,
        targetTitle: selected.title,
        relationType,
      });
      if (ok !== false) {
        setQuery("");
        setSelected(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showResults = !selected && browseActive;
  const showEmptyHint =
    showResults && !searchError && searchResults.length === 0;

  return (
    <ChComposer title="Verknüpfung hinzufügen" icon={Link2} onSubmit={handleSubmit}>
      <div className="mb-2 flex items-start gap-2">
        <Input
          ref={inputRef}
          placeholder="Eintrag suchen (Titel)…"
          value={selected ? selected.title : query}
          onFocus={() => {
            setBrowseActive(true);
            onSearch?.(query);
          }}
          onBlur={() => {
            window.setTimeout(() => setBrowseActive(false), 150);
          }}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
            setBrowseActive(true);
          }}
          className="h-9 flex-1 border-border/70 bg-surface-3/50"
        />
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-9 w-9 shrink-0 text-muted-foreground"
            title="Abbrechen"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {searchError && (
        <p className="mb-2 text-[0.72rem] text-destructive">{searchError}</p>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="mb-2 max-h-[180px] overflow-y-auto rounded-lg border border-border/60 bg-surface-3/30 p-1">
          {!query.trim() && (
            <p className="px-2 py-1 text-[0.68rem] text-muted-foreground">
              Zuletzt bearbeitete Einträge — oder Titel eingeben
            </p>
          )}
          {searchResults.map((result) => (
            <button
              key={result.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSelected({ id: result.id, title: result.title })}
              className="mb-0.5 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[0.78rem] transition-colors last:mb-0 hover:bg-accent-dim/50 hover:text-accent"
            >
              {result.typeColor && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: result.typeColor }}
                />
              )}
              <span className="min-w-0 flex-1 truncate">{result.title}</span>
              {result.projectName && !result.isCurrentProject && (
                <span className="shrink-0 rounded bg-accent-dim px-1.5 py-px text-[0.62rem] text-accent">
                  {result.projectIcon} {result.projectName}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showEmptyHint && (
        <p className="mb-2 text-[0.72rem] text-muted-foreground">
          {query.trim()
            ? "Keine passenden Einträge — anderen Suchbegriff versuchen."
            : "Keine weiteren Einträge in diesem Projekt verfügbar."}
        </p>
      )}

      <Select
        value={relationType}
        onValueChange={(v) => setRelationType(v as RelationType)}
      >
        <SelectTrigger className="mb-3 h-9 border-border/70 bg-surface-3/50">
          <SelectValue placeholder="Relationstyp" />
        </SelectTrigger>
        <SelectContent>
          {relationTypes.map((rt) => (
            <SelectItem key={rt.value} value={rt.value}>
              {rt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" size="sm" disabled={!selected || submitting}>
        {submitting ? "Speichern…" : "Verknüpfung speichern"}
      </Button>
    </ChComposer>
  );
}
