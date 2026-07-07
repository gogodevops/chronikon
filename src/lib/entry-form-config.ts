import type { EntryType } from "@prisma/client";

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
  showLanguage: boolean;
  bookMetadataBox?: boolean;
};

export const ENTRY_FORM_CONFIG: Record<EntryType, EntryFormFieldConfig> = {
  person: {
    titleLabel: "Name",
    titlePlaceholder: "z. B. Mehmed II.",
    showAuthor: false,
    showPlaceName: false,
    showYears: true,
    yearStartLabel: "Geboren (Jahr)",
    yearEndLabel: "Gestorben (Jahr)",
    yearEndOptional: true,
    showLanguage: false,
  },
  book: {
    titleLabel: "Titel",
    titlePlaceholder: "z. B. Geschichte des Osmanischen Reiches",
    titleEmphasized: true,
    showAuthor: true,
    authorLabel: "Autor",
    showPlaceName: false,
    showYears: true,
    yearStartLabel: "Erscheinungsjahr",
    yearEndLabel: "Bis (optional)",
    yearEndOptional: true,
    showLanguage: true,
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
    showLanguage: true,
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
    showLanguage: false,
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
    showLanguage: false,
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
    showLanguage: true,
  },
};

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
    case "book": {
      if (start !== 0 && (end === 0 || end === start)) {
        return {
          show: true,
          pillLabel: "Erscheinungsjahr",
          value: yearLabel(start),
        };
      }
      return {
        show: true,
        pillLabel: "Erscheinungsjahr",
        value: `${yearLabel(start)} – ${yearLabel(end)}`,
      };
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
