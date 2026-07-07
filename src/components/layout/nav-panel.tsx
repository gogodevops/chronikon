"use client";

import * as React from "react";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export interface FilterChip {
  id: string;
  label: string;
  color?: string;
}

export interface SavedView {
  id: string;
  label: string;
}

export interface EntryListItem {
  id: string;
  title: string;
  type: string;
  typeColor: string;
  typeLabel: string;
  topic?: string;
}

export interface NavPanelProps {
  className?: string;
  topics?: FilterChip[];
  types?: FilterChip[];
  confidenceLevels?: FilterChip[];
  savedViews?: SavedView[];
  entries?: EntryListItem[];
  totalCount?: number;
  listLimit?: number;
  selectedEntryId?: string | null;
  searchQuery?: string;
  activeTopics?: Set<string>;
  activeTypes?: Set<string>;
  activeConfidence?: Set<string>;
  activeSavedView?: string | null;
  pinnedNote?: boolean;
  recentActivityEntryIds?: Set<string>;
  onSearchChange?: (query: string) => void;
  onTopicToggle?: (id: string) => void;
  onTypeToggle?: (id: string) => void;
  onConfidenceToggle?: (id: string) => void;
  onSavedViewSelect?: (id: string | null) => void;
  onEntrySelect?: (id: string) => void;
  onExpandList?: () => void;
  onCommandPaletteOpen?: () => void;
}

const DEFAULT_TOPICS: FilterChip[] = [
  { id: "apokryphen", label: "Apokryphen" },
  { id: "kanon", label: "Kanon" },
  { id: "funde", label: "Funde & Editionen" },
];

const DEFAULT_TYPES: FilterChip[] = [
  { id: "text", label: "Text", color: "#4caf82" },
  { id: "book", label: "Buch", color: "#5b8def" },
  { id: "person", label: "Person", color: "#e8945a" },
  { id: "place", label: "Ort", color: "#e05a5a" },
  { id: "discovery", label: "Fund", color: "#a78bfa" },
];

const DEFAULT_CONFIDENCE: FilterChip[] = [
  { id: "verified", label: "Gesichert", color: "#4caf82" },
  { id: "likely", label: "Vermutlich", color: "#5b8def" },
  { id: "disputed", label: "Streitig", color: "#e8945a" },
  { id: "unknown", label: "Unbekannt", color: "#7a756a" },
];

function FilterGroup({
  title,
  activeCount,
  defaultOpen = true,
  children,
}: {
  title: string;
  activeCount?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group mb-1 border-b border-border pb-1 last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground select-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
        {title}
        {activeCount != null && activeCount > 0 && (
          <span className="ml-auto rounded-full bg-accent-dim px-1.5 py-0.5 text-[0.6rem] text-accent">
            {activeCount}
          </span>
        )}
      </summary>
      <div className="pb-1 pt-1">{children}</div>
    </details>
  );
}

function FilterChipButton({
  chip,
  active,
  onClick,
}: {
  chip: FilterChip;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mr-1.5 mb-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 text-[0.75rem] transition-colors",
        active
          ? "border-accent bg-accent-dim text-accent"
          : "border-border hover:border-muted",
      )}
    >
      {chip.color && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: chip.color }}
        />
      )}
      {chip.label}
    </button>
  );
}

export function NavPanel({
  className,
  topics = DEFAULT_TOPICS,
  types = DEFAULT_TYPES,
  confidenceLevels = DEFAULT_CONFIDENCE,
  savedViews = [],
  entries = [],
  totalCount,
  listLimit = 10,
  selectedEntryId,
  searchQuery = "",
  activeTopics = new Set(),
  activeTypes = new Set(),
  activeConfidence = new Set(),
  activeSavedView,
  pinnedNote = false,
  recentActivityEntryIds,
  onSearchChange,
  onTopicToggle,
  onTypeToggle,
  onConfidenceToggle,
  onSavedViewSelect,
  onEntrySelect,
  onExpandList,
  onCommandPaletteOpen,
}: NavPanelProps) {
  const total = totalCount ?? entries.length;
  const hiddenCount = Math.max(0, total - listLimit);
  const showing = Math.min(listLimit, total);

  return (
    <aside
      className={cn(
        "flex w-[var(--nav-panel-w)] shrink-0 flex-col border-r border-border/80 bg-surface min-h-0",
        className,
      )}
    >
      <div className="max-h-[45%] shrink-0 overflow-y-auto border-b border-border/80 bg-surface-2/20 p-3">
        <div className="relative mb-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Einträge suchen…"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-9 border-border/70 bg-surface-2/80 pl-8 pr-12 text-[0.82rem]"
          />
          <button
            type="button"
            title="Globale Suche (⌘K)"
            onClick={onCommandPaletteOpen}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded border border-border/60 bg-surface-3 px-1.5 py-0.5 text-[0.62rem] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
          >
            ⌘K
          </button>
        </div>

        <FilterGroup title="Themen" activeCount={activeTopics.size}>
          <div className="flex flex-wrap">
            {topics.map((chip) => (
              <FilterChipButton
                key={chip.id}
                chip={chip}
                active={activeTopics.has(chip.id)}
                onClick={() => onTopicToggle?.(chip.id)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Typ" activeCount={activeTypes.size}>
          <div className="flex flex-wrap">
            {types.map((chip) => (
              <FilterChipButton
                key={chip.id}
                chip={chip}
                active={activeTypes.has(chip.id)}
                onClick={() => onTypeToggle?.(chip.id)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Confidence" activeCount={activeConfidence.size}>
          <div className="flex flex-wrap">
            {confidenceLevels.map((chip) => (
              <FilterChipButton
                key={chip.id}
                chip={chip}
                active={activeConfidence.has(chip.id)}
                onClick={() => onConfidenceToggle?.(chip.id)}
              />
            ))}
          </div>
        </FilterGroup>

        {savedViews.length > 0 && (
          <FilterGroup title="Gespeicherte Ansichten">
            <div className="flex flex-col gap-0.5">
              {savedViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() =>
                    onSavedViewSelect?.(
                      activeSavedView === view.id ? null : view.id,
                    )
                  }
                  className={cn(
                    "cursor-pointer rounded-md px-2 py-1.5 text-left text-[0.78rem] text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    activeSavedView === view.id &&
                      "bg-accent-dim text-accent",
                  )}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </FilterGroup>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-3 py-2.5">
          <h3 className="text-[0.72rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Einträge
          </h3>
          <span className="rounded-md bg-surface-3/80 px-1.5 py-0.5 text-[0.68rem] tabular-nums text-muted-foreground">
            {total ? `${showing} / ${total}` : "0"}
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-1.5">
            {pinnedNote && (
              <p className="mb-1 border-b border-dashed border-border px-2 pb-1 text-[0.65rem] text-muted-foreground">
                Ausgewählter Eintrag (nicht in Top {listLimit})
              </p>
            )}

            {entries.length === 0 ? (
              <div className="mx-1.5 my-4 rounded-xl border border-dashed border-border/50 px-3 py-8 text-center">
                <BookOpen className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" strokeWidth={1.25} />
                <p className="text-[0.78rem] text-muted-foreground">
                  {searchQuery.trim()
                    ? "Keine Treffer"
                    : "Keine Einträge"}
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onEntrySelect?.(entry.id)}
                  className={cn(
                    "mb-1 flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                    selectedEntryId === entry.id
                      ? "border-accent/35 bg-accent-dim/50 shadow-[0_1px_8px_rgba(0,0,0,0.12)]"
                      : "border-transparent hover:border-border/60 hover:bg-surface-2/80",
                    pinnedNote &&
                      selectedEntryId === entry.id &&
                      "ring-1 ring-accent/20",
                  )}
                >
                  <span
                    className="mt-1 w-1 min-h-8 shrink-0 self-stretch rounded-full"
                    style={{ background: entry.typeColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-1.5 text-[0.8rem] font-medium leading-snug">
                      <span className="truncate">{entry.title}</span>
                      {recentActivityEntryIds?.has(entry.id) && (
                        <span
                          className="shrink-0 rounded-full bg-accent/15 px-1.5 py-px text-[0.58rem] font-semibold uppercase tracking-wider text-accent"
                          title="Aktivität in den letzten 7 Tagen"
                        >
                          Neu
                        </span>
                      )}
                    </h3>
                    <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                      {entry.typeLabel}
                      {entry.topic ? ` · ${entry.topic}` : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {hiddenCount > 0 && (
          <div className="shrink-0 border-t border-border p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed text-[0.75rem] text-muted-foreground hover:border-accent hover:text-accent"
              onClick={onExpandList}
            >
              + {hiddenCount} weitere anzeigen ({total} gesamt)
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
