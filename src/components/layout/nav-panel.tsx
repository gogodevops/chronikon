"use client";

import * as React from "react";
import { BookOpen, ChevronRight, Filter, List, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  buildNavTypeSections,
  type NavBookGroup,
  type NavFlatEntry,
} from "@/lib/nav-entry-groups";

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
  parentEntryId?: string | null;
  parentEntryTitle?: string | null;
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
  onClearFilters?: () => void;
  canCreateEntry?: boolean;
  onNewEntry?: () => void;
}

const DEFAULT_TOPICS: FilterChip[] = [
  { id: "apokryphen", label: "Apokryphen" },
  { id: "kanon", label: "Kanon" },
  { id: "funde", label: "Funde & Editionen" },
];

const DEFAULT_TYPES: FilterChip[] = [
  { id: "book", label: "Buch", color: "#5b8def" },
  { id: "person", label: "Person", color: "#e8945a" },
  { id: "place", label: "Ort", color: "#e05a5a" },
  { id: "text", label: "Text", color: "#4caf82" },
  { id: "discovery", label: "Fund", color: "#a78bfa" },
  { id: "note", label: "Notiz", color: "#7a756a" },
];

const DEFAULT_CONFIDENCE: FilterChip[] = [
  { id: "verified", label: "Gesichert", color: "#4caf82" },
  { id: "likely", label: "Vermutlich", color: "#5b8def" },
  { id: "disputed", label: "Streitig", color: "#e8945a" },
  { id: "unknown", label: "Unbekannt", color: "#7a756a" },
];

function PanelSection({
  step,
  icon: Icon,
  title,
  hint,
  children,
  className,
}: {
  step: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border/80 bg-surface-2/40",
        className,
      )}
    >
      <header className="shrink-0 border-b border-border/60 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-dim text-[0.65rem] font-bold text-accent">
            {step}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-accent/80" />
              <h2 className="text-[0.8rem] font-semibold text-foreground">
                {title}
              </h2>
            </div>
            {hint && (
              <p className="mt-0.5 text-[0.68rem] leading-snug text-muted-foreground">
                {hint}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

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
      className="group border-b border-border/50 last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground select-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
        {title}
        {activeCount != null && activeCount > 0 && (
          <span className="ml-auto rounded-full bg-accent-dim px-1.5 py-0.5 text-[0.6rem] text-accent">
            {activeCount}
          </span>
        )}
      </summary>
      <div className="px-3 pb-2.5 pt-0.5">{children}</div>
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
        "mr-1.5 mb-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors",
        active
          ? "border-accent bg-accent-dim text-accent"
          : "border-border/80 bg-surface/60 hover:border-muted hover:bg-surface-2",
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

function TypeSectionHeader({
  label,
  color,
}: {
  label: string;
  color?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      {color && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </span>
  );
}

function renderNavItem(
  group: NavBookGroup | NavFlatEntry,
  selectedEntryId: string | null | undefined,
  recentActivityEntryIds: Set<string> | undefined,
  onEntrySelect: ((id: string) => void) | undefined,
) {
  if (group.kind === "book") {
    if (group.children.length === 0) {
      return (
        <EntryNavButton
          key={group.book.id}
          entry={group.book}
          selectedEntryId={selectedEntryId}
          recentActivityEntryIds={recentActivityEntryIds}
          onEntrySelect={onEntrySelect}
        />
      );
    }

    return (
      <CollapsibleSection
        key={group.book.id}
        title={group.book.title}
        count={group.children.length + 1}
        defaultOpen={false}
        className="mb-2 border-border/50 bg-transparent"
      >
        <EntryNavButton
          entry={group.book}
          selectedEntryId={selectedEntryId}
          recentActivityEntryIds={recentActivityEntryIds}
          onEntrySelect={onEntrySelect}
        />
        {group.children.map((child) => (
          <EntryNavButton
            key={child.id}
            entry={child}
            selectedEntryId={selectedEntryId}
            recentActivityEntryIds={recentActivityEntryIds}
            onEntrySelect={onEntrySelect}
            nested
          />
        ))}
      </CollapsibleSection>
    );
  }

  return (
    <EntryNavButton
      key={group.entry.id}
      entry={group.entry}
      selectedEntryId={selectedEntryId}
      recentActivityEntryIds={recentActivityEntryIds}
      onEntrySelect={onEntrySelect}
    />
  );
}

function EntryNavButton({
  entry,
  selectedEntryId,
  recentActivityEntryIds,
  onEntrySelect,
  nested = false,
}: {
  entry: EntryListItem;
  selectedEntryId?: string | null;
  recentActivityEntryIds?: Set<string>;
  onEntrySelect?: (id: string) => void;
  nested?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onEntrySelect?.(entry.id)}
      className={cn(
        "mb-1.5 flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all",
        nested && "ml-3 border-l-2 border-l-accent/30",
        selectedEntryId === entry.id
          ? "border-accent/40 bg-accent-dim/60 shadow-[inset_3px_0_0_0_var(--accent)]"
          : "border-border/50 bg-surface/40 hover:border-border hover:bg-surface-2/80",
      )}
    >
      <span
        className="mt-1 w-1 min-h-8 shrink-0 self-stretch rounded-full"
        style={{ background: entry.typeColor }}
      />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 text-[0.82rem] font-medium leading-snug">
          {nested && (
            <span
              className="shrink-0 text-[0.68rem] text-muted-foreground"
              title={entry.parentEntryTitle ?? "Untereintrag"}
            >
              ↳
            </span>
          )}
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
          {entry.parentEntryTitle ? ` · in ${entry.parentEntryTitle}` : ""}
          {entry.topic ? ` · ${entry.topic}` : ""}
        </p>
      </div>
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
  onClearFilters,
  canCreateEntry = false,
  onNewEntry,
}: NavPanelProps) {
  const total = totalCount ?? entries.length;
  const hiddenCount = Math.max(0, total - listLimit);
  const showing = Math.min(listLimit, total);
  const activeFilterCount =
    activeTopics.size +
    activeTypes.size +
    activeConfidence.size +
    (activeSavedView ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const typeColors = Object.fromEntries(
    types.map((t) => [t.id, t.color]),
  ) as Record<string, string | undefined>;
  const typeSections = buildNavTypeSections(
    entries,
    typeColors,
    activeTypes.size > 0 ? activeTypes : undefined,
  );

  return (
    <aside
      className={cn(
        "flex w-[var(--nav-panel-w)] shrink-0 flex-col gap-2.5 border-r border-border/80 bg-surface p-2.5 min-h-0",
        className,
      )}
    >
      <PanelSection
        step="1"
        icon={Filter}
        title="Filtern & suchen"
        hint="Grenze die Liste ein — Ergebnisse erscheinen unten."
        className="max-h-[42%] shrink-0"
      >
        <div className="overflow-y-auto">
          <div className="border-b border-border/50 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Titel oder Stichwort…"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-9 border-border/70 bg-surface pl-8 pr-12 text-[0.82rem]"
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
          </div>

          {topics.length > 0 && (
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
          )}

          <FilterGroup title="Eintrags-Typ" activeCount={activeTypes.size}>
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

          <FilterGroup
            title="Zuverlässigkeit"
            activeCount={activeConfidence.size}
            defaultOpen={false}
          >
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
                      "cursor-pointer rounded-md px-2 py-1.5 text-left text-[0.78rem] text-muted-foreground hover:bg-surface hover:text-foreground",
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
      </PanelSection>

      {activeFilterCount > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-accent/20 bg-accent-dim/40 px-2.5 py-1.5">
          <span className="text-[0.72rem] text-accent">
            {activeFilterCount} Filter aktiv
          </span>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex cursor-pointer items-center gap-1 text-[0.68rem] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Zurücksetzen
            </button>
          )}
        </div>
      )}

      <PanelSection
        step="2"
        icon={List}
        title="Einträge"
        hint="Nach Typ gruppiert — Bereich aufklappen und Eintrag wählen."
        className="min-h-0 flex-1"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
            <span className="text-[0.68rem] text-muted-foreground">
              {total === 0
                ? "Keine Treffer"
                : `${showing} von ${total} angezeigt`}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {canCreateEntry && onNewEntry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[0.68rem] text-accent hover:border-accent/40 hover:bg-accent-dim"
                  onClick={onNewEntry}
                >
                  <Plus className="h-3 w-3" />
                  Neuer Eintrag
                </Button>
              )}
              {selectedEntryId && (
                <span className="rounded-md bg-accent-dim px-1.5 py-0.5 text-[0.62rem] text-accent">
                  1 ausgewählt
                </span>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {pinnedNote && (
                <p className="mb-2 rounded-md border border-dashed border-border/60 bg-surface/50 px-2 py-1.5 text-[0.65rem] text-muted-foreground">
                  Ausgewählter Eintrag liegt außerhalb der aktuellen Top-
                  {listLimit}-Liste.
                </p>
              )}

              {entries.length === 0 ? (
                <div className="mx-0.5 my-6 rounded-xl border border-dashed border-border/50 px-3 py-8 text-center">
                  <BookOpen
                    className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40"
                    strokeWidth={1.25}
                  />
                  <p className="text-[0.8rem] font-medium text-foreground">
                    {searchQuery.trim() || activeFilterCount > 0
                      ? "Keine Treffer"
                      : "Noch keine Einträge"}
                  </p>
                  <p className="mt-1 text-[0.72rem] text-muted-foreground">
                    {searchQuery.trim() || activeFilterCount > 0
                      ? "Filter anpassen oder zurücksetzen."
                      : "Lege den ersten Eintrag an."}
                  </p>
                  {canCreateEntry && onNewEntry && (
                    <Button
                      size="sm"
                      className="mt-4 gap-1.5"
                      onClick={onNewEntry}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Neuer Eintrag
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {typeSections.map((section) => (
                    <CollapsibleSection
                      key={section.typeId}
                      title={
                        <TypeSectionHeader
                          label={section.label}
                          color={section.color}
                        />
                      }
                      count={section.count}
                      defaultOpen={false}
                      className="border-border/50 bg-transparent"
                    >
                      {section.items.map((item) =>
                        renderNavItem(
                          item,
                          selectedEntryId,
                          recentActivityEntryIds,
                          onEntrySelect,
                        ),
                      )}
                    </CollapsibleSection>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {hiddenCount > 0 && (
            <div className="shrink-0 border-t border-border/50 p-2">
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
      </PanelSection>
    </aside>
  );
}
