/** Neutraler Hinweis für KI-Vorlagen und OCR — kein Eintragsfeld mehr. */
export const ENTRY_LANGUAGE_HINT = "Deutsch oder Englisch";

/** Intern für KI-Vorlagensprache (Phase 1: nur DE/EN). */
export const ENTRY_LANGUAGES = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "Englisch" },
] as const;

export type EntryLanguageCode = (typeof ENTRY_LANGUAGES)[number]["value"];

export const DEFAULT_ENTRY_LANGUAGE: EntryLanguageCode = "de";

export function normalizeEntryLanguage(
  language?: string | null,
): EntryLanguageCode {
  if (language === "en" || language?.toLowerCase() === "englisch") {
    return "en";
  }
  if (
    language === "de" ||
    language?.toLowerCase() === "deutsch" ||
    language?.toLowerCase() === "german"
  ) {
    return "de";
  }
  return DEFAULT_ENTRY_LANGUAGE;
}

export function entryLanguageLabel(language?: string | null): string {
  const code = normalizeEntryLanguage(language);
  return ENTRY_LANGUAGES.find((item) => item.value === code)?.label ?? "Deutsch";
}
