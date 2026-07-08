import { formatHistoricalYear } from "@/lib/timeline-years";

export type YearEra = "ad" | "bc";

export function signedYearFromInput(yearStr: string, era: YearEra): number {
  const n = parseInt(yearStr.trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return era === "bc" ? -n : n;
}

export function inputFromSignedYear(year: number): { year: string; era: YearEra } {
  if (year === 0) return { year: "", era: "ad" };
  if (year < 0) return { year: String(Math.abs(year)), era: "bc" };
  return { year: String(year), era: "ad" };
}

export function parsePublicationYear(str: string): number {
  const n = parseInt(str.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function parseHistoricalYearRange(
  startStr: string,
  endStr: string,
  startEra: YearEra,
  endEra: YearEra,
  endOptional: boolean,
): { yearStart: number; yearEnd: number } {
  const yearStart = signedYearFromInput(startStr, startEra);
  const endParsed = signedYearFromInput(endStr, endEra);

  if (endParsed !== 0) {
    return { yearStart, yearEnd: endParsed };
  }

  if (endOptional && yearStart !== 0) {
    return { yearStart, yearEnd: yearStart };
  }

  return { yearStart, yearEnd: 0 };
}

export type ResolvedBookYears = {
  publishedStart: number;
  publishedEnd: number;
  periodStart: number;
  periodEnd: number;
};

/** Trennt gespeicherte Buch-Jahre: Erscheinungsjahr vs. behandelter Zeitraum. */
export function resolveBookStoredYears(entry: {
  yearStart: number;
  yearEnd: number;
  publishedYearStart?: number | null;
  publishedYearEnd?: number | null;
}): ResolvedBookYears {
  const pubStart = entry.publishedYearStart ?? 0;
  const pubEnd = entry.publishedYearEnd ?? 0;

  if (pubStart > 0) {
    return {
      publishedStart: pubStart,
      publishedEnd: pubEnd,
      periodStart: entry.yearStart,
      periodEnd: entry.yearEnd,
    };
  }

  const ys = entry.yearStart;
  const ye = entry.yearEnd;

  if (ys >= 1400 && (ye === 0 || ye === ys || (ye >= 1400 && ye - ys < 200))) {
    return {
      publishedStart: ys,
      publishedEnd: ye === 0 || ye === ys ? 0 : ye,
      periodStart: 0,
      periodEnd: 0,
    };
  }

  return {
    publishedStart: 0,
    publishedEnd: 0,
    periodStart: ys,
    periodEnd: ye,
  };
}

export function bookFormInitialFromEntry(entry: {
  type: string;
  yearStart: number;
  yearEnd: number;
  publishedYearStart?: number | null;
  publishedYearEnd?: number | null;
}): {
  publishedYearStart: string;
  publishedYearEnd: string;
  yearStart: string;
  yearEnd: string;
  eraStart: YearEra;
  eraEnd: YearEra;
} | null {
  if (entry.type !== "book") return null;

  const resolved = resolveBookStoredYears(entry);
  const periodFrom = inputFromSignedYear(resolved.periodStart);
  const periodTo = inputFromSignedYear(resolved.periodEnd);

  return {
    publishedYearStart: resolved.publishedStart
      ? String(resolved.publishedStart)
      : "",
    publishedYearEnd:
      resolved.publishedEnd && resolved.publishedEnd !== resolved.publishedStart
        ? String(resolved.publishedEnd)
        : "",
    yearStart: periodFrom.year,
    yearEnd: periodTo.year,
    eraStart: periodFrom.era,
    eraEnd: periodTo.era,
  };
}

export function formatPublicationYear(
  start?: number | null,
  end?: number | null,
): string {
  const s = start ?? 0;
  const e = end ?? 0;
  if (s === 0) return "";
  if (e === 0 || e === s) return String(s);
  return `${s} – ${e}`;
}

export function formatPeriodYearRange(
  start?: number | null,
  end?: number | null,
): string {
  const s = start ?? 0;
  const e = end ?? 0;
  if (s === 0 && e === 0) return "";
  if (s !== 0 && (e === 0 || e === s)) return formatHistoricalYear(s);
  return `${formatHistoricalYear(s)} – ${formatHistoricalYear(e)}`;
}
