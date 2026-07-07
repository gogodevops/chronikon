"use client";

import * as React from "react";
import { Link2 } from "lucide-react";
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
  onSearch?: (query: string) => void;
  onSubmit?: (data: RelationFormData) => void;
}

const DEFAULT_RELATION_TYPES = (
  Object.entries(RELATION_LABELS) as [RelationType, string][]
).map(([value, label]) => ({ value, label }));

export function RelationComposer({
  relationTypes = DEFAULT_RELATION_TYPES,
  searchResults = [],
  onSearch,
  onSubmit,
}: RelationComposerProps) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const [relationType, setRelationType] = React.useState<RelationType>(
    relationTypes[0]?.value ?? "discusses",
  );

  React.useEffect(() => {
    onSearch?.(query);
  }, [query, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    onSubmit?.({
      targetEntryId: selected.id,
      targetTitle: selected.title,
      relationType,
    });
    setQuery("");
    setSelected(null);
  };

  return (
    <ChComposer title="Neue Verknüpfung" icon={Link2} onSubmit={handleSubmit}>
      <Input
        placeholder="Eintrag in allen Projekten suchen…"
        value={selected ? selected.title : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
        }}
        className="mb-2 h-9 border-border/70 bg-surface-3/50"
      />

      {searchResults.length > 0 && !selected && (
        <div className="mb-2 max-h-[140px] overflow-y-auto rounded-lg border border-border/60 bg-surface-3/30 p-1">
          {searchResults.map((result) => (
            <button
              key={result.id}
              type="button"
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

      <Button type="submit" size="sm" disabled={!selected}>
        Verknüpfung speichern
      </Button>
    </ChComposer>
  );
}
