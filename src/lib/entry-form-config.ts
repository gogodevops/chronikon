import type { EntryType } from "@prisma/client";

import {
  formatPeriodYearRange,
  formatPublicationYear,
  resolveBookStoredYears,
} from "@/lib/historical-year-fields";
import { formatPersonLifeRange } from "@/lib/person-date-fields";
import { formatHistoricalYear } from "@/lib/timeline-years";

export type EntryFormFieldConfig = {
  titleLabel: string;
  titlePlaceholder?: string;
  titleEmphasized?: boolean;
  showAuthor: boolean;
  authorLabel?: string;
  showPlaceName: boolean;
  placeNameLabel?: string;
  showYears: boolean;
  yearStartLabel: string;
  yearEndLabel: string;
  yearEndOptional: boolean;
  showPublishedYears?: boolean;
  publishedYearStartLabel?: string;
  publishedYearEndLabel?: string;
  bookMetadataBox?: boolean;
  showDateParts?: boolean;
};

export const ENTRY_FORM_CONFIG: Record<EntryType, EntryFormFieldConfig> = {
  person: {
    titleLabel: "Name",
    titlePlaceholder: "z. B. Mehmed II.",
    showAuthor: false,
    showPlaceName: false,
    showYears: true,
    showDateParts: true,
    yearStartLabel: "Geboren (Jahr)",
    yearEndLabel: "Gestorben (Jahr)",
    yearEndOptional: true,
  },
  book: {
    titleLabel: "Titel",
    titlePlaceholder: "z. B. Geschichte des Osmanischen Reiches",
    titleEmphasized: true,
    showAuthor: true,
    authorLabel: "Autor",
    showPlaceName: false,
    showYears: true,
    showPublishedYears: true,
    publishedYearStartLabel: "Erscheinungsjahr (Druckjahr)",
    publishedYearEndLabel: "Druckjahr bis (optional)",
    yearStartLabel: "Von",
    yearEndLabel: "Bis",
    yearEndOptional: true,
    bookMetadataBox: true,
  },
  text: {
    titleLabel: "Bezeichnung",
    titlePlaceholder: "z. B. Belagerung von Konstantinopel 1453",
    showAuthor: false,
    showPlaceName: false,
    showYears: true,
    yearStartLabel: "Von (Jahr)",
    yearEndLabel: "Bis (Jahr)",
    yearEndOptional: true,
  },
  place: {
    titleLabel: "Name",
    titlePlaceholder: "z. B. Konstantinopel",
    showAuthor: false,
    showPlaceName: false,
    showYears: false,
    yearStartLabel: "",
    yearEndLabel: "",
    yearEndOptional: true,
  },
  discovery: {
    titleLabel: "Bezeichnung",
    titlePlaceholder: "z. B. Nag-Hammadi-Kodex I",
    showAuthor: false,
    showPlaceName: true,
    placeNameLabel: "Fundort",
    showYears: true,
    yearStartLabel: "Datierung von (Jahr)",
    yearEndLabel: "Datierung bis (Jahr)",
    yearEndOptional: true,
  },
  note: {
    titleLabel: "Titel",
    titlePlaceholder: "Kurzer Titel der Notiz",
    showAuthor: false,
    showPlaceName: false,
    showYears: false,
    yearStartLabel: "",
    yearEndLabel: "",
    yearEndOptional: true,
  },
};

export type RequiredField = "title" | "author" | "placeName" | "pageStart";

export function getRequiredFields(
  type: string,
  isBookChild: boolean,
): RequiredField[] {
  if (isBookChild) return ["title", "pageStart"];
  switch (type) {
    case "book":
      return ["title", "author"];
    case "discovery":
      return ["title", "placeName"];
    case "person":
    case "place":
    case "text":
    case "note":
    default:
      return ["title"];
  }
}

export function getMissingRequiredLabels(
  type: string,
  isBookChild: boolean,
  fields: {
    title: string;
    author: string;
    placeName: string;
    pageStart: string;
  },
): string[] {
  const config = getEntryFormConfig(type);
  const missing: string[] = [];
  for (const key of getRequiredFields(type, isBookChild)) {
    if (key === "title" && !fields.title.trim()) {
      missing.push(config.titleLabel);
    }
    if (key === "author" && !fields.author.trim()) {
      missing.push(config.authorLabel ?? "Autor");
    }
    if (key === "placeName" && !fields.placeName.trim()) {
      missing.push(config.placeNameLabel ?? "Fundort");
    }
    if (key === "pageStart" && !fields.pageStart.trim()) {
      missing.push("Seite von");
    }
  }
  return missing;
}

export function isEntryFormComplete(
  type: string,
  isBookChild: boolean,
  fields: {
    title: string;
    author: string;
    placeName: string;
    pageStart: string;
  },
): boolean {
  return getMissingRequiredLabels(type, isBookChild, fields).length === 0;
}

export function getEntryFormConfig(type: string): EntryFormFieldConfig {
  return ENTRY_FORM_CONFIG[type as EntryType] ?? ENTRY_FORM_CONFIG.text;
}

export type EntryYearMeta = {
  show: boolean;
  pillLabel: string;
  value: string;
};

function yearLabel(year?: number | null): string {
  if (year == null || year === 0) return "—";
  return formatHistoricalYear(year);
}

/** Formatiert Jahresangaben für die Detailansicht — typabhängige Labels. */
export function getEntryYearMeta(
  type: string,
  yearStart?: number | null,
  yearEnd?: number | null,
  publishedYearStart?: number | null,
  publishedYearEnd?: number | null,
): EntryYearMeta {
  const metas = getEntryYearMetas(
    type,
    yearStart,
    yearEnd,
    publishedYearStart,
    publishedYearEnd,
  );
  return metas[0] ?? { show: false, pillLabel: "", value: "" };
}

export function getEntryYearMetas(
  type: string,
  yearStart?: number | null,
  yearEnd?: number | null,
  publishedYearStart?: number | null,
  publishedYearEnd?: number | null,
  dateParts?: {
    dateStartMonth?: number | null;
    dateStartDay?: number | null;
    dateEndMonth?: number | null;
    dateEndDay?: number | null;
  },
): EntryYearMeta[] {
  const start = yearStart ?? 0;
  const end = yearEnd ?? 0;

  switch (type) {
    case "person": {
      const life = formatPersonLifeRange(
        start,
        dateParts?.dateStartMonth,
        dateParts?.dateStartDay,
        end,
        dateParts?.dateEndMonth,
        dateParts?.dateEndDay,
      );
      if (!life) return [];
      return [{ show: true, pillLabel: "Lebensdaten", value: life }];
    }
    case "book": {
      const resolved = resolveBookStoredYears({
        yearStart: start,
        yearEnd: end,
        publishedYearStart,
        publishedYearEnd,
      });
      const metas: EntryYearMeta[] = [];
      const pubValue = formatPublicationYear(
        resolved.publishedStart,
        resolved.publishedEnd,
      );
      if (pubValue) {
        metas.push({
          show: true,
          pillLabel: "Erscheinungsjahr",
          value: pubValue,
        });
      }
      const periodValue = formatPeriodYearRange(
        resolved.periodStart,
        resolved.periodEnd,
      );
      if (periodValue) {
        metas.push({
          show: true,
          pillLabel: "Historischer Zeitraum",
          value: periodValue,
        });
      }
      return metas;
    }
    default:
      break;
  }

  const single = getEntryYearMetaLegacy(type, yearStart, yearEnd);
  return single.show ? [single] : [];
}

function getEntryYearMetaLegacy(
  type: string,
  yearStart?: number | null,
  yearEnd?: number | null,
): EntryYearMeta {
  const start = yearStart ?? 0;
  const end = yearEnd ?? 0;

  if (start === 0 && end === 0) {
    return { show: false, pillLabel: "", value: "" };
  }

  switch (type) {
    case "person": {
      const born = start !== 0 ? yearLabel(start) : null;
      const died = end !== 0 && end !== start ? yearLabel(end) : null;
      if (born && died) {
        return {
          show: true,
          pillLabel: "Lebensdaten",
          value: `${born} – ${died}`,
        };
      }
      if (born) {
        return { show: true, pillLabel: "Geboren", value: born };
      }
      if (died || (end !== 0 && end !== start)) {
        return { show: true, pillLabel: "Gestorben", value: yearLabel(end) };
      }
      return { show: false, pillLabel: "", value: "" };
    }
    case "discovery":
      return {
        show: true,
        pillLabel: "Datierung",
        value:
          start !== 0 && end !== 0 && end !== start
            ? `${yearLabel(start)} – ${yearLabel(end)}`
            : yearLabel(start || end),
      };
    case "place":
    case "note":
      return { show: false, pillLabel: "", value: "" };
    default:
      return {
        show: true,
        pillLabel: "Zeitraum",
        value: `${yearLabel(start)} – ${yearLabel(end)}`,
      };
  }
}

export function parseEntryYears(
  yearStartStr: string,
  yearEndStr: string,
  yearEndOptional: boolean,
): { yearStart: number; yearEnd: number } {
  const startParsed = parseInt(yearStartStr, 10);
  const endParsed = parseInt(yearEndStr, 10);
  const yearStart = Number.isFinite(startParsed) ? startParsed : 0;

  if (Number.isFinite(endParsed)) {
    return { yearStart, yearEnd: endParsed };
  }

  if (yearEndOptional && yearStart !== 0) {
    return { yearStart, yearEnd: yearStart };
  }

  return { yearStart, yearEnd: 0 };
}

/** Kurzformat für Tabellen und Listen. */
export function formatEntryYearSummary(entry: {
  type: string;
  yearStart: number;
  yearEnd: number;
  publishedYearStart?: number | null;
  publishedYearEnd?: number | null;
  dateStartMonth?: number | null;
  dateStartDay?: number | null;
  dateEndMonth?: number | null;
  dateEndDay?: number | null;
}): string {
  const metas = getEntryYearMetas(
    entry.type,
    entry.yearStart,
    entry.yearEnd,
    entry.publishedYearStart,
    entry.publishedYearEnd,
    {
      dateStartMonth: entry.dateStartMonth,
      dateStartDay: entry.dateStartDay,
      dateEndMonth: entry.dateEndMonth,
      dateEndDay: entry.dateEndDay,
    },
  );
  if (metas.length === 0) return "—";
  return metas.map((m) => m.value).join(" · ");
}
