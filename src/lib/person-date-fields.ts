import { formatHistoricalYear } from "@/lib/timeline-years";

const MONTH_NAMES = [
  "",
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function parseOptionalMonth(str: string): number | null {
  const n = parseInt(str.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return n;
}

export function parseOptionalDay(str: string): number | null {
  const n = parseInt(str.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 31) return null;
  return n;
}

export function monthToInput(month?: number | null): string {
  if (month == null || month < 1 || month > 12) return "";
  return String(month);
}

export function dayToInput(day?: number | null): string {
  if (day == null || day < 1 || day > 31) return "";
  return String(day);
}

/** Formatiert Personendatum — Tag/Monat optional, Jahr mit v. Chr./n. Chr. */
export function formatPersonDate(
  year: number,
  month?: number | null,
  day?: number | null,
): string {
  if (year === 0) return "";

  const yearLabel = formatHistoricalYear(year);
  const m = month ?? 0;
  const d = day ?? 0;

  if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
    return `${d}. ${MONTH_NAMES[m]} ${yearLabel}`;
  }
  if (m >= 1 && m <= 12) {
    return `${MONTH_NAMES[m]} ${yearLabel}`;
  }
  return yearLabel;
}

export function formatPersonLifeRange(
  birthYear: number,
  birthMonth?: number | null,
  birthDay?: number | null,
  deathYear?: number,
  deathMonth?: number | null,
  deathDay?: number | null,
): string {
  const born = formatPersonDate(birthYear, birthMonth, birthDay);
  const died = formatPersonDate(deathYear ?? 0, deathMonth, deathDay);

  if (born && died && deathYear !== 0 && deathYear !== birthYear) {
    return `${born} – ${died}`;
  }
  if (born) return born;
  if (died) return died;
  return "";
}
