"use client";

import * as React from "react";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import type { TimelineOptions } from "vis-timeline";
import { Focus, Maximize2, Search, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

import { TYPE_META } from "@/lib/constants";
import type { SerializedEntryListItem } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import {
  computeFocusBounds,
  dateToYear,
  filterTimelineEntries,
  formatHistoricalYear,
  formatYearRange,
  getDisplayRange,
  getTimelinePresetWindow,
  TIMELINE_ZOOM_PRESETS,
  truncateTitle,
  type TimelineZoomPresetId,
  yearToDate,
} from "@/lib/timeline-years";
import { cn } from "@/lib/utils";

import "vis-timeline/styles/vis-timeline-graph2d.min.css";

type LaneMode = "type" | "topic";

function buildGroups(entries: SerializedEntryListItem[], mode: LaneMode) {
  const groups = new DataSet<{
    id: string;
    content: string;
    order: number;
    className?: string;
  }>();

  if (mode === "type") {
    const types = [...new Set(entries.map((e) => e.type))];
    types
      .sort((a, b) => {
        const order = Object.keys(TYPE_META);
        return order.indexOf(a) - order.indexOf(b);
      })
      .forEach((type, i) => {
        const meta = TYPE_META[type as keyof typeof TYPE_META];
        const color = meta?.color ?? "#888";
        groups.add({
          id: type,
          content: `<span class="tl-lane-dot" style="background:${color}"></span>${meta?.label ?? type}`,
          order: i,
          className: "tl-group-row",
        });
      });
    return groups;
  }

  const topics = [...new Set(entries.map((e) => e.topic || "Sonstiges"))].sort();
  topics.forEach((topic, i) => {
    groups.add({
      id: topic,
      content: topic,
      order: i,
      className: "tl-group-row",
    });
  });
  return groups;
}

function buildItems(entries: SerializedEntryListItem[], mode: LaneMode) {
  const items = new DataSet<{
    id: string;
    group: string;
    subgroup: string;
    content: string;
    start: Date;
    end?: Date;
    type?: string;
    title: string;
    className?: string;
    style?: string;
  }>();

  for (const entry of entries) {
    const meta = TYPE_META[entry.type as keyof typeof TYPE_META];
    const color = meta?.color ?? "#888";
    const group = mode === "type" ? entry.type : entry.topic || "Sonstiges";
    const display = getDisplayRange(entry);
    const fullRange = `${formatHistoricalYear(entry.yearStart)} – ${formatHistoricalYear(entry.yearEnd)}`;
    const cappedNote = display.capped ? `\nAnzeige gekürzt (${fullRange})` : "";

    const item: Parameters<typeof items.add>[0] = {
      id: entry.id,
      group,
      subgroup: entry.id,
      content: truncateTitle(entry.title, 36),
      start: yearToDate(display.start),
      title: `${entry.title}\n${fullRange}${cappedNote}`,
      className: cn(
        "tl-item",
        display.kind === "point" ? "tl-item-point" : "tl-item-range",
        display.capped && "tl-item-capped",
      ),
      style: `background-color:color-mix(in srgb, ${color} 36%, transparent);border-color:${color};color:#e8e4dc;`,
    };

    if (display.kind === "point") {
      item.type = "point";
    } else {
      item.end = yearToDate(Math.max(display.end, display.start + 1));
    }

    items.add(item);
  }

  return items;
}

export function TimelineView({
  entries,
  onSelect,
}: {
  entries: SerializedEntryListItem[];
  onSelect?: (id: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<Timeline | null>(null);
  const onSelectRef = React.useRef(onSelect);
  const [laneMode, setLaneMode] = React.useState<LaneMode>("type");
  const [rangeLabel, setRangeLabel] = React.useState("");
  const [preset, setPreset] = React.useState<TimelineZoomPresetId>("focus");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeMatchIndex, setActiveMatchIndex] = React.useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  onSelectRef.current = onSelect;

  const visibleEntries = React.useMemo(
    () => filterTimelineEntries(entries, searchQuery),
    [entries, searchQuery],
  );

  const focusBounds = React.useMemo(
    () => computeFocusBounds(visibleEntries),
    [visibleEntries],
  );

  const applyWindow = React.useCallback(
    (min: number, max: number, animate = true) => {
      const timeline = timelineRef.current;
      if (!timeline) return;
      timeline.setWindow(yearToDate(min), yearToDate(max), {
        animation: animate
          ? { duration: 350, easingFunction: "easeInOutQuad" }
          : false,
      });
      setRangeLabel(formatYearRange(min, max));
    },
    [],
  );

  const timelineOptions = React.useMemo<TimelineOptions>(
    () => ({
      orientation: { axis: "top", item: "top" },
      stack: true,
      stackSubgroups: true,
      horizontalScroll: true,
      verticalScroll: true,
      zoomKey: "ctrlKey",
      multiselect: false,
      selectable: true,
      showCurrentTime: false,
      showMajorLabels: true,
      showMinorLabels: true,
      margin: { axis: 10, item: { horizontal: 6, vertical: 8 } },
      groupOrder: "order",
      groupHeightMode: "fixed",
      groupHeight: 32,
      zoomMin: 1000 * 60 * 60 * 24 * 30,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 8000,
      start: yearToDate(focusBounds.min),
      end: yearToDate(focusBounds.max),
      format: {
        minorLabels: (date) => formatHistoricalYear(dateToYear(date)),
        majorLabels: (date) => {
          const y = dateToYear(date);
          if (Math.abs(y) >= 1000) {
            return y < 0
              ? `${Math.ceil(Math.abs(y) / 100) * 100} v.Chr.`
              : `${Math.floor(y / 100) * 100}`;
          }
          return formatHistoricalYear(y);
        },
      },
    }),
    [focusBounds.min, focusBounds.max],
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const groups = buildGroups(visibleEntries, laneMode);
    const items = buildItems(visibleEntries, laneMode);

    const timeline = new Timeline(el, items, groups, {
      ...timelineOptions,
      xss: { disabled: true },
    });
    timelineRef.current = timeline;

    timeline.on("rangechanged", () => {
      const win = timeline.getWindow();
      setRangeLabel(
        formatYearRange(dateToYear(win.start), dateToYear(win.end)),
      );
    });

    timeline.on("select", (props) => {
      const id = props.items[0];
      if (id) onSelectRef.current?.(String(id));
    });

    setRangeLabel(formatYearRange(focusBounds.min, focusBounds.max));

    return () => {
      timeline.destroy();
      timelineRef.current = null;
    };
  }, [visibleEntries, laneMode, timelineOptions, focusBounds.min, focusBounds.max]);

  React.useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery]);

  React.useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline || !searchQuery.trim() || visibleEntries.length === 0) return;

    const entry = visibleEntries[activeMatchIndex];
    if (!entry) return;

    timeline.setSelection([entry.id]);
    timeline.focus(entry.id, {
      animation: { duration: 300, easingFunction: "easeInOutQuad" },
    });
  }, [searchQuery, visibleEntries, activeMatchIndex]);

  React.useEffect(() => {
    if (!searchQuery.trim() || visibleEntries.length === 0) return;
    applyWindow(focusBounds.min, focusBounds.max);
    setPreset("focus");
  }, [searchQuery, visibleEntries, focusBounds.min, focusBounds.max, applyWindow]);

  const zoomIn = () => {
    timelineRef.current?.zoomIn(0.4, {
      animation: { duration: 250, easingFunction: "easeInOutQuad" },
    });
  };

  const zoomOut = () => {
    timelineRef.current?.zoomOut(0.4, {
      animation: { duration: 250, easingFunction: "easeInOutQuad" },
    });
  };

  const setZoomPreset = (p: TimelineZoomPresetId) => {
    setPreset(p);
    const { min, max } = getTimelinePresetWindow(p, visibleEntries);
    applyWindow(min, max);
  };

  const goToMatch = (delta: number) => {
    if (!visibleEntries.length) return;
    setActiveMatchIndex(
      (i) => (i + delta + visibleEntries.length) % visibleEntries.length,
    );
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveMatchIndex(0);
    searchInputRef.current?.focus();
  };

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/80 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Timeline</h2>
          <p className="text-[0.72rem] text-muted-foreground">
            {hasSearch
              ? `${visibleEntries.length} von ${entries.length} Einträgen`
              : `${entries.length} Einträge`}{" "}
            · Klick öffnet Detail
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative flex items-center gap-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="In Timeline suchen…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    goToMatch(e.shiftKey ? -1 : 1);
                  }
                  if (e.key === "Escape") clearSearch();
                }}
                className="h-8 w-44 border-border/70 bg-surface-2/80 pl-8 pr-8 text-[0.75rem] sm:w-52"
              />
              {hasSearch && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  title="Suche löschen"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {hasSearch && (
              <div className="flex items-center gap-0.5">
                <span className="min-w-[4.5rem] text-center text-[0.68rem] tabular-nums text-muted-foreground">
                  {visibleEntries.length === 0
                    ? "Keine Treffer"
                    : `${activeMatchIndex + 1}/${visibleEntries.length}`}
                </span>
                <button
                  type="button"
                  disabled={visibleEntries.length === 0}
                  onClick={() => goToMatch(-1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border/80 text-muted-foreground hover:border-accent/40 hover:text-accent disabled:opacity-40"
                  title="Vorheriger Treffer (Shift+Enter)"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={visibleEntries.length === 0}
                  onClick={() => goToMatch(1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border/80 text-muted-foreground hover:border-accent/40 hover:text-accent disabled:opacity-40"
                  title="Nächster Treffer (Enter)"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex max-w-[min(100%,28rem)] gap-0.5 overflow-x-auto rounded-lg border border-border/80 bg-surface-2/50 p-0.5 [scrollbar-width:thin]">
            {TIMELINE_ZOOM_PRESETS.map((zoomPreset) => {
              const Icon =
                zoomPreset.id === "focus"
                  ? Focus
                  : zoomPreset.id === "all"
                    ? Maximize2
                    : null;
              return (
                <button
                  key={zoomPreset.id}
                  type="button"
                  title={zoomPreset.title}
                  onClick={() => setZoomPreset(zoomPreset.id)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[0.68rem] font-medium whitespace-nowrap transition-all",
                    preset === zoomPreset.id
                      ? "bg-accent-dim text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {zoomPreset.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/80 hover:border-accent/40 hover:text-accent"
            onClick={zoomOut}
            title="Herauszoomen"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[11rem] text-center text-[0.72rem] tabular-nums text-muted-foreground">
            {rangeLabel}
          </span>
          <button
            type="button"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/80 hover:border-accent/40 hover:text-accent"
            onClick={zoomIn}
            title="Hineinzoomen"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <select
            value={laneMode}
            onChange={(e) => setLaneMode(e.target.value as LaneMode)}
            className="cursor-pointer rounded-lg border border-border/80 bg-surface-2/80 px-2.5 py-1.5 text-[0.72rem] text-foreground"
          >
            <option value="type">Lanes: Typ</option>
            <option value="topic">Lanes: Thema</option>
          </select>
        </div>
      </div>

      <div className="chronikon-timeline relative min-h-0 flex-1 overflow-hidden p-4">
        {hasSearch && visibleEntries.length === 0 && (
          <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-xl border border-dashed border-border/80 bg-surface/80">
            <p className="text-sm text-muted-foreground">
              Keine Einträge für „{searchQuery.trim()}“
            </p>
          </div>
        )}
        <div
          ref={containerRef}
          className="h-full min-h-[360px] rounded-xl border border-border/80 bg-surface shadow-inner"
        />
      </div>
    </div>
  );
}
