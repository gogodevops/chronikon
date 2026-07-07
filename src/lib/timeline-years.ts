/** Konvertiert historische Jahre (inkl. v.Chr.) für vis-timeline Date-Achse */
const EPOCH_OFFSET = 10_000;

export function yearToDate(year: number): Date {
  return new Date(EPOCH_OFFSET + year, 6, 1);
}

export function toTimelineDate(value: Date | number | string): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function dateToYear(value: Date | number | string): number {
  return toTimelineDate(value).getFullYear() - EPOCH_OFFSET;
}

export function formatHistoricalYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} v.Chr.`;
  if (year === 0) return "0";
  return `${year} n.Chr.`;
}

export function formatYearRange(min: number, max: number): string {
  return `${formatHistoricalYear(min)} – ${formatHistoricalYear(max)}`;
}

export type TimelineDisplayRange = {
  start: number;
  end: number;
  kind: "point" | "range";
  capped: boolean;
};

/** Sichtbare Zeitspanne — lange Orte/Bücher werden gekappt, damit die Timeline lesbar bleibt */
export function getDisplayRange(entry: {
  type: string;
  yearStart: number;
  yearEnd: number;
}): TimelineDisplayRange {
  const span = entry.yearEnd - entry.yearStart;

  if (entry.type === "discovery" || span <= 3) {
    return {
      start: entry.yearStart,
      end: entry.yearStart,
      kind: "point",
      capped: false,
    };
  }

  if (entry.type === "person" && span <= 120) {
    return {
      start: entry.yearStart,
      end: entry.yearEnd,
      kind: "range",
      capped: false,
    };
  }

  if (entry.type === "place" && span > 200) {
    const visual = Math.min(60, Math.max(25, Math.round(span * 0.04)));
    return {
      start: entry.yearStart,
      end: entry.yearStart + visual,
      kind: "range",
      capped: true,
    };
  }

  if (
    (entry.type === "book" || entry.type === "note") &&
    entry.yearEnd > 1500 &&
    span > 80
  ) {
    return {
      start: entry.yearStart,
      end: entry.yearStart + 35,
      kind: "range",
      capped: true,
    };
  }

  if (span > 250) {
    const mid = Math.round((entry.yearStart + entry.yearEnd) / 2);
    return {
      start: mid - 40,
      end: mid + 40,
      kind: "range",
      capped: true,
    };
  }

  if (span <= 15) {
    return {
      start: entry.yearStart,
      end: entry.yearStart,
      kind: "point",
      capped: false,
    };
  }

  return {
    start: entry.yearStart,
    end: entry.yearEnd,
    kind: "range",
    capped: false,
  };
}

export function computeFocusBounds(
  entries: { type: string; yearStart: number; yearEnd: number }[],
): { min: number; max: number } {
  const relevant = entries.filter((e) => {
    const span = e.yearEnd - e.yearStart;
    return !(e.type === "place" && span > 400);
  });
  const pool = relevant.length ? relevant : entries;
  if (!pool.length) return { min: -100, max: 300 };

  let min = Infinity;
  let max = -Infinity;
  for (const e of pool) {
    min = Math.min(min, e.yearStart, e.yearEnd);
    max = Math.max(max, e.yearStart, e.yearEnd);
  }
  const pad = Math.max(40, Math.round((max - min) * 0.12));
  return { min: min - pad, max: max + pad };
}

export function computeFullBounds(
  entries: { yearStart: number; yearEnd: number }[],
): { min: number; max: number } {
  if (!entries.length) return { min: -500, max: 2025 };
  let min = Infinity;
  let max = -Infinity;
  for (const e of entries) {
    min = Math.min(min, e.yearStart, e.yearEnd);
    max = Math.max(max, e.yearStart, e.yearEnd);
  }
  const pad = Math.max(50, Math.round((max - min) * 0.06));
  return { min: min - pad, max: max + pad };
}

export function truncateTitle(title: string, max = 28): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}…`;
}

export function filterTimelineEntries<
  T extends {
    title: string;
    topic?: string;
    typeLabel: string;
    summary: string | null;
    placeName: string | null;
    legacyId: string | null;
  },
>(entries: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;

  return entries.filter((entry) => {
    const haystack = [
      entry.title,
      entry.topic,
      entry.typeLabel,
      entry.summary,
      entry.placeName,
      entry.legacyId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export type TimelineZoomPresetId =
  | "focus"
  | "antiquity"
  | "early-christian"
  | "late-antique"
  | "byzantine"
  | "medieval"
  | "ottoman"
  | "early-modern"
  | "modern"
  | "all";

export type TimelineZoomPreset = {
  id: TimelineZoomPresetId;
  label: string;
  title: string;
  dynamic?: "focus" | "all";
  min?: number;
  max?: number;
};

export const TIMELINE_ZOOM_PRESETS: TimelineZoomPreset[] = [
  {
    id: "focus",
    label: "Fokus",
    title: "Zoom auf die dichteste Eintrags-Periode",
    dynamic: "focus",
  },
  {
    id: "antiquity",
    label: "Antike",
    title: "800 v.Chr. – 500 n.Chr.",
    min: -800,
    max: 500,
  },
  {
    id: "early-christian",
    label: "Frühchrist.",
    title: "Frühchristentum · 1 – 400 n.Chr.",
    min: 1,
    max: 400,
  },
  {
    id: "late-antique",
    label: "Spätantike",
    title: "Spätantike · 200 – 600 n.Chr.",
    min: 200,
    max: 600,
  },
  {
    id: "byzantine",
    label: "Byzanz",
    title: "Byzantinisches Reich · 330 – 1453",
    min: 330,
    max: 1453,
  },
  {
    id: "medieval",
    label: "Mittelalter",
    title: "Mittelalter · 500 – 1500",
    min: 500,
    max: 1500,
  },
  {
    id: "ottoman",
    label: "Osmanisch",
    title: "Osmanisches Reich · 1300 – 1800",
    min: 1300,
    max: 1800,
  },
  {
    id: "early-modern",
    label: "Neuzeit",
    title: "Frühe Neuzeit · 1500 – 1900",
    min: 1500,
    max: 1900,
  },
  {
    id: "modern",
    label: "Moderne",
    title: "Moderne · 1800 – 2030",
    min: 1800,
    max: 2030,
  },
  {
    id: "all",
    label: "Gesamt",
    title: "Komplette Zeitspanne aller Einträge",
    dynamic: "all",
  },
];

export function getTimelinePresetWindow(
  presetId: TimelineZoomPresetId,
  entries: { type: string; yearStart: number; yearEnd: number }[],
): { min: number; max: number } {
  const preset = TIMELINE_ZOOM_PRESETS.find((p) => p.id === presetId);
  if (!preset) return computeFocusBounds(entries);
  if (preset.dynamic === "focus") return computeFocusBounds(entries);
  if (preset.dynamic === "all") return computeFullBounds(entries);
  return { min: preset.min!, max: preset.max! };
}
