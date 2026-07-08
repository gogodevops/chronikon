import { ENTRY_LANGUAGE_HINT } from "@/lib/languages";
import {
  formatPeriodYearRange,
  formatPublicationYear,
  resolveBookStoredYears,
} from "@/lib/historical-year-fields";

export type KiAttachmentInput = {
  name: string;
  label?: string | null;
  mimeType?: string;
  ocrStatus?: string;
  extractedText?: string | null;
};

export type KiChildEntryInput = {
  title: string;
  typeLabel: string;
  yearStart?: number;
  yearEnd?: number;
  pageStart?: number | null;
  pageEnd?: number | null;
};

export type KiTemplateVars = {
  PROJECT: string;
  TITLE: string;
  ENTRY_TITLE: string;
  AUTHOR: string;
  YEAR: string;
  PUBLISHED_YEAR: string;
  ENTRY_BODY: string;
  ENTRY: string;
  LANGUAGE: string;
  PAGE_START: string;
  PAGE_END: string;
  OCR_TEXT: string;
  PARENT_OCR_TEXT: string;
  ATTACHMENTS_LIST: string;
  CHILD_ENTRIES: string;
  ENTRIES: string;
};

const OCR_TRUNCATE = 12000;
const PAGE_EXCERPT_TRUNCATE = 8000;

function formatYearRange(yearStart?: number | null, yearEnd?: number | null): string {
  if (yearStart == null && yearEnd == null) {
    return "(nicht angegeben)";
  }
  const formatYear = (year: number) =>
    year < 0 ? `${Math.abs(year)} v.Chr.` : `${year} n.Chr.`;
  if (yearStart != null && yearEnd != null && yearStart !== yearEnd) {
    return `${formatYear(yearStart)} – ${formatYear(yearEnd)}`;
  }
  const year = yearStart ?? yearEnd!;
  return formatYear(year);
}

export function buildAttachmentsList(
  attachments: KiAttachmentInput[],
): string {
  if (attachments.length === 0) {
    return "(keine Anhänge — PDF unter Material hochladen)";
  }

  return attachments
    .map((attachment, index) => {
      const label = attachment.label ? ` — ${attachment.label}` : "";
      const textStatus = attachment.extractedText?.trim()
        ? " · Text extrahiert"
        : attachment.ocrStatus === "failed"
          ? " · Extraktion fehlgeschlagen"
          : attachment.ocrStatus === "pending"
            ? " · ausstehend"
            : "";
      return `${index + 1}. ${attachment.name}${label} (${attachment.mimeType ?? "unbekannt"})${textStatus}`;
    })
    .join("\n");
}

export function buildOcrText(attachments: KiAttachmentInput[]): string {
  const blocks = attachments
    .filter((attachment) => attachment.extractedText?.trim())
    .map((attachment) => {
      const text = attachment.extractedText!.trim();
      const truncated =
        text.length > OCR_TRUNCATE
          ? `${text.slice(0, OCR_TRUNCATE)}\n\n[… Text gekürzt …]`
          : text;
      return `### ${attachment.name}\n\n${truncated}`;
    });

  if (blocks.length === 0) {
    return "(kein extrahierter PDF-Text — digitales PDF unter Material hochladen)";
  }

  return blocks.join("\n\n---\n\n");
}

export function buildParentOcrExcerpt(
  parentAttachments: KiAttachmentInput[],
  pageStart?: number | null,
  pageEnd?: number | null,
): string {
  const fullText = parentAttachments
    .map((a) => a.extractedText?.trim())
    .filter(Boolean)
    .join("\n\n");

  if (!fullText) {
    return "(kein Buch-PDF-Text am übergeordneten Buch — zuerst PDF hochladen und Text extrahieren lassen)";
  }

  let excerpt = fullText;
  if (pageStart != null && pageEnd != null && pageStart > 0) {
    const approxCharsPerPage = Math.max(
      1200,
      Math.floor(fullText.length / Math.max(pageEnd, pageStart)),
    );
    const startIdx = Math.max(0, (pageStart - 1) * approxCharsPerPage);
    const endIdx = Math.min(
      fullText.length,
      pageEnd * approxCharsPerPage,
    );
    excerpt = fullText.slice(startIdx, endIdx);
    if (excerpt.length < fullText.length) {
      excerpt = `[Seiten ${pageStart}–${pageEnd}, geschätzter Ausschnitt]\n\n${excerpt}`;
    }
  }

  if (excerpt.length > PAGE_EXCERPT_TRUNCATE) {
    return `${excerpt.slice(0, PAGE_EXCERPT_TRUNCATE)}\n\n[… Ausschnitt gekürzt …]`;
  }
  return excerpt;
}

export function buildChildEntriesList(
  children: KiChildEntryInput[],
): string {
  if (children.length === 0) {
    return "(keine Untereinträge)";
  }

  return children
    .map((child, index) => {
      const pages =
        child.pageStart != null && child.pageEnd != null
          ? ` S. ${child.pageStart}–${child.pageEnd}`
          : "";
      const years =
        child.yearStart != null && child.yearEnd != null
          ? ` (${child.yearStart}–${child.yearEnd})`
          : "";
      return `${index + 1}. ${child.title} [${child.typeLabel}]${pages || years}`;
    })
    .join("\n");
}

export function buildEntryKiVars(input: {
  project: string;
  entryTitle: string;
  entryMarkdown: string;
  language?: string | null;
  author?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  publishedYearStart?: number | null;
  publishedYearEnd?: number | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  attachments?: KiAttachmentInput[];
  parentAttachments?: KiAttachmentInput[];
  childEntries?: KiChildEntryInput[];
  entriesPlaceholder?: string;
}): KiTemplateVars {
  const attachments = input.attachments ?? [];
  const parentAttachments = input.parentAttachments ?? [];
  const entryBody = input.entryMarkdown;
  const resolvedBookYears = resolveBookStoredYears({
    yearStart: input.yearStart ?? 0,
    yearEnd: input.yearEnd ?? 0,
    publishedYearStart: input.publishedYearStart,
    publishedYearEnd: input.publishedYearEnd,
  });

  return {
    PROJECT: input.project,
    TITLE: input.entryTitle,
    ENTRY_TITLE: input.entryTitle,
    AUTHOR: input.author?.trim() || "(nicht angegeben)",
    YEAR:
      formatPeriodYearRange(
        resolvedBookYears.periodStart,
        resolvedBookYears.periodEnd,
      ) || formatYearRange(input.yearStart, input.yearEnd),
    PUBLISHED_YEAR:
      formatPublicationYear(
        resolvedBookYears.publishedStart,
        resolvedBookYears.publishedEnd,
      ) || "(nicht angegeben)",
    ENTRY_BODY: entryBody,
    ENTRY: entryBody,
    LANGUAGE: ENTRY_LANGUAGE_HINT,
    PAGE_START:
      input.pageStart != null ? String(input.pageStart) : "(nicht angegeben)",
    PAGE_END: input.pageEnd != null ? String(input.pageEnd) : "(nicht angegeben)",
    ATTACHMENTS_LIST: buildAttachmentsList(attachments),
    OCR_TEXT: buildOcrText(attachments),
    PARENT_OCR_TEXT: buildParentOcrExcerpt(
      parentAttachments,
      input.pageStart,
      input.pageEnd,
    ),
    CHILD_ENTRIES: buildChildEntriesList(input.childEntries ?? []),
    ENTRIES:
      input.entriesPlaceholder ??
      "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren)",
  };
}

export function hasOcrContent(attachments: KiAttachmentInput[]): boolean {
  return attachments.some((attachment) => attachment.extractedText?.trim());
}

export function hasEntryContent(input: {
  body?: string | null;
  summary?: string | null;
}): boolean {
  return !!(input.body?.trim() || input.summary?.trim());
}

export function isBookSubEntry(input: {
  parentEntryType?: string | null;
  pageStart?: number | null;
  pageEnd?: number | null;
}): boolean {
  return input.parentEntryType === "book";
}
