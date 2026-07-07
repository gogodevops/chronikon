import { CONF_META, TYPE_META } from "@/lib/constants";
import type { EntryType } from "@prisma/client";

export type EntryMarkdownInput = {
  title: string;
  type: string;
  summary?: string | null;
  body?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  confidence?: string;
  language?: string | null;
  author?: string | null;
  placeName?: string | null;
  topics?: string[];
  parentEntryTitle?: string | null;
  sources?: { title: string; ref?: string | null }[];
};

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} v.Chr.`;
  return `${year} n.Chr.`;
}

/** Einzeleintrag als Markdown — zum Einfügen in ChatGPT & Co. */
export function entryToMarkdown(
  entry: EntryMarkdownInput,
  projectName?: string,
): string {
  const type = entry.type as EntryType;
  const typeLabel = TYPE_META[type]?.label ?? entry.type;
  const confLabel = entry.confidence
    ? CONF_META[entry.confidence as keyof typeof CONF_META]?.label
    : undefined;

  const lines: string[] = [];

  if (projectName) {
    lines.push(`# ${entry.title}`);
    lines.push("");
    lines.push(`*Projekt: ${projectName}*`);
  } else {
    lines.push(`# ${entry.title}`);
  }

  lines.push("");
  lines.push(`- **Typ:** ${typeLabel}`);
  if (entry.yearStart != null && entry.yearEnd != null) {
    lines.push(
      `- **Zeitraum:** ${formatYear(entry.yearStart)} – ${formatYear(entry.yearEnd)}`,
    );
  }
  if (entry.pageStart != null && entry.pageEnd != null) {
    lines.push(`- **Seiten:** ${entry.pageStart}–${entry.pageEnd}`);
  }
  if (confLabel) lines.push(`- **Einordnung:** ${confLabel}`);
  if (entry.parentEntryTitle) {
    lines.push(`- **Übergeordnet:** ${entry.parentEntryTitle}`);
  }
  if (entry.author) lines.push(`- **Autor:** ${entry.author}`);
  if (entry.language) lines.push(`- **Sprache:** ${entry.language}`);
  if (entry.placeName) lines.push(`- **Ort:** ${entry.placeName}`);
  if (entry.topics?.length) {
    lines.push(`- **Themen:** ${entry.topics.join(", ")}`);
  }

  if (entry.summary) {
    lines.push("");
    lines.push("## Zusammenfassung");
    lines.push("");
    lines.push(entry.summary);
  }

  if (entry.body) {
    lines.push("");
    lines.push("## Inhalt");
    lines.push("");
    lines.push(entry.body);
  }

  if (entry.sources?.length) {
    lines.push("");
    lines.push("## Quellen");
    for (const s of entry.sources) {
      lines.push(`- ${s.title}${s.ref ? ` (${s.ref})` : ""}`);
    }
  }

  return lines.join("\n");
}
