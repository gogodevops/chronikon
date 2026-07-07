import type { Confidence, EntryType } from "@prisma/client";
import { CONF_META, TYPE_META } from "@/lib/constants";
import { formatHistoricalYear } from "@/lib/timeline-years";

export type VersionSnapshotState = {
  type: EntryType;
  typeLabel: string;
  title: string;
  summary: string | null;
  summaryPreview: string | null;
  yearStart: number;
  yearEnd: number;
  yearRangeLabel: string;
  confidence: Confidence;
  confidenceLabel: string;
  topics: string[];
};

export type VersionFieldChange = {
  field: string;
  label: string;
  before: string;
  after: string;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function formatYearRangeLabel(start: number, end: number): string {
  if (start === end) return formatHistoricalYear(start);
  return `${formatHistoricalYear(start)} – ${formatHistoricalYear(end)}`;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function extractTopics(snapshot: Record<string, unknown>): string[] {
  if (!Array.isArray(snapshot.topics)) return [];
  if (snapshot.topics.length > 0 && typeof snapshot.topics[0] === "string") {
    return snapshot.topics as string[];
  }
  return (snapshot.topics as { topic?: { name?: string } }[])
    .map((t) => t.topic?.name)
    .filter((name): name is string => !!name);
}

function normalizeState(raw: {
  type: EntryType;
  title: string;
  summary: string | null;
  yearStart: number;
  yearEnd: number;
  confidence: Confidence;
  topics: string[];
}): VersionSnapshotState {
  const summary = raw.summary;
  return {
    type: raw.type,
    typeLabel: TYPE_META[raw.type]?.label ?? raw.type,
    title: raw.title,
    summary,
    summaryPreview: summary ? truncate(summary, 160) : null,
    yearStart: raw.yearStart,
    yearEnd: raw.yearEnd,
    yearRangeLabel: formatYearRangeLabel(raw.yearStart, raw.yearEnd),
    confidence: raw.confidence,
    confidenceLabel: CONF_META[raw.confidence]?.label ?? raw.confidence,
    topics: raw.topics,
  };
}

export function parseVersionSnapshot(snapshot: unknown): VersionSnapshotState {
  const defaults = {
    type: "note" as EntryType,
    title: "Unbenannt",
    summary: null as string | null,
    yearStart: 0,
    yearEnd: 0,
    confidence: "likely" as Confidence,
    topics: [] as string[],
  };

  if (!snapshot || typeof snapshot !== "object") {
    return normalizeState(defaults);
  }

  const s = snapshot as Record<string, unknown>;
  const type = (asString(s.type) ?? defaults.type) as EntryType;
  const confidence = (asString(s.confidence) ?? defaults.confidence) as Confidence;

  return normalizeState({
    type,
    title: asString(s.title) ?? defaults.title,
    summary: asString(s.summary),
    yearStart: asNumber(s.yearStart),
    yearEnd: asNumber(s.yearEnd),
    confidence,
    topics: extractTopics(s),
  });
}

export function currentEntryState(entry: {
  type: EntryType;
  title: string;
  summary: string | null;
  yearStart: number;
  yearEnd: number;
  confidence: Confidence;
  topics: string[];
}): VersionSnapshotState {
  return normalizeState(entry);
}

export function diffVersionStates(
  before: VersionSnapshotState,
  after: VersionSnapshotState,
): VersionFieldChange[] {
  const fields: Array<{
    key: string;
    label: string;
    format: (state: VersionSnapshotState) => string;
  }> = [
    { key: "title", label: "Titel", format: (s) => s.title },
    { key: "type", label: "Typ", format: (s) => s.typeLabel },
    { key: "years", label: "Zeitraum", format: (s) => s.yearRangeLabel },
    { key: "confidence", label: "Vertrauen", format: (s) => s.confidenceLabel },
    { key: "topics", label: "Thema", format: (s) => s.topics.join(", ") || "—" },
    {
      key: "summary",
      label: "Zusammenfassung",
      format: (s) => (s.summaryPreview ? s.summaryPreview : "—"),
    },
  ];

  const changes: VersionFieldChange[] = [];
  for (const field of fields) {
    const beforeValue = field.format(before);
    const afterValue = field.format(after);
    if (beforeValue !== afterValue) {
      changes.push({
        field: field.key,
        label: field.label,
        before: beforeValue,
        after: afterValue,
      });
    }
  }
  return changes;
}

export function formatVersionDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatChangedBy(
  name: string | null,
  email: string | null,
): string {
  if (name) return name;
  if (email) return email;
  return "Unbekannt";
}
