import type { EntryType } from "@prisma/client";

/** Erlaubte Untereinträge pro Eltern-Typ (`null` = keine Kinder). */
export const ALLOWED_CHILD_TYPES: Record<EntryType, EntryType[] | null> = {
  book: ["text"],
  text: null,
  person: null,
  place: null,
  discovery: null,
  note: null,
};

export function isChildTypeAllowed(
  parentType: EntryType,
  childType: EntryType,
): boolean {
  const allowed = ALLOWED_CHILD_TYPES[parentType];
  return allowed != null && allowed.includes(childType);
}

export function canHaveChildEntries(type: EntryType): boolean {
  return ALLOWED_CHILD_TYPES[type] != null;
}

/** Kapitel/Unterthemen nach Seite von (dann Seite bis, dann Titel). */
export function compareByPageStart(
  a: {
    pageStart?: number | null;
    pageEnd?: number | null;
    title: string;
  },
  b: {
    pageStart?: number | null;
    pageEnd?: number | null;
    title: string;
  },
): number {
  const aStart = a.pageStart ?? Number.MAX_SAFE_INTEGER;
  const bStart = b.pageStart ?? Number.MAX_SAFE_INTEGER;
  if (aStart !== bStart) return aStart - bStart;

  const aEnd = a.pageEnd ?? aStart;
  const bEnd = b.pageEnd ?? bStart;
  if (aEnd !== bEnd) return aEnd - bEnd;

  return a.title.localeCompare(b.title, "de");
}

export function sortBookChildren<
  T extends {
    pageStart?: number | null;
    pageEnd?: number | null;
    title: string;
  },
>(children: T[]): T[] {
  return [...children].sort(compareByPageStart);
}

export type SourceSectionConfig = {
  /** Überschrift in der Detailansicht */
  sectionTitle: string;
  /** Was „Quellen" für diesen Typ bedeutet */
  meaning: string;
  /** Leerzustand-Hinweis */
  emptyHint: string;
  /** Composer-Platzhalter für den Quellentitel */
  titlePlaceholder: string;
  /**
   * Quellen-Sektion in der Detailansicht anzeigen?
   * `optional` = nur bei Bearbeitungsrecht wenn leer; sonst nur wenn Einträge vorhanden.
   */
  visibility: "always" | "optional";
};

export const SOURCE_SECTION_CONFIG: Record<EntryType, SourceSectionConfig> = {
  book: {
    sectionTitle: "Weiterführende Literatur",
    meaning:
      "Das Buch selbst (Metadaten + PDF unter Material) ist die Hauptquelle. Hier nur zusätzliche Editionen, Übersetzungen oder Sekundärliteratur.",
    emptyHint:
      "Optional — nur wenn Sie neben dem Buch noch andere Werke zitieren möchten (Edition, Übersetzung, Rezension).",
    titlePlaceholder: "z. B. Englische Übersetzung (Autor, Jahr)",
    visibility: "optional",
  },
  text: {
    sectionTitle: "Belegquellen",
    meaning:
      "Publikationen, Handschriften oder Editionen, aus denen dieser Text stammt oder zitiert wird.",
    emptyHint:
      "Quellen ergänzen, sobald Sie wissen, woher der Inhalt stammt (Edition, Seite, Übersetzung).",
    titlePlaceholder: "z. B. Codex Vaticanus, Kap. 12",
    visibility: "always",
  },
  person: {
    sectionTitle: "Quellen zur Person",
    meaning:
      "Primär- und Sekundärquellen für Lebensdaten, Taten und Zuordnungen (Urkunden, Chroniken, Forschungsliteratur).",
    emptyHint:
      "Biografische Quellen nach und nach ergänzen — nicht beim Anlegen nötig.",
    titlePlaceholder: "z. B. Laonikos Chalkokondyles, Historia",
    visibility: "always",
  },
  place: {
    sectionTitle: "Quellen zum Ort",
    meaning:
      "Karten, Reiseberichte, archäologische Berichte oder historische Texte, die den Ort belegen.",
    emptyHint:
      "Belege für Lage, Name und historischen Kontext hier sammeln.",
    titlePlaceholder: "z. B. Tabula Peutingeriana",
    visibility: "always",
  },
  discovery: {
    sectionTitle: "Quellen zum Fund",
    meaning:
      "Publikation, Grabungsbericht oder Museumseintrag, in dem der Fund beschrieben und datiert wird.",
    emptyHint:
      "Fundpublikation oder Bericht ergänzen, sobald bekannt.",
    titlePlaceholder: "z. B. Robinson, The Nag Hammadi Library (1977)",
    visibility: "always",
  },
  note: {
    sectionTitle: "Literatur & Quellen",
    meaning:
      "Recherche-Quellen und Literatur, die der Notiz zugrunde liegen oder sie stützen.",
    emptyHint:
      "Konsultierte Werke und Links hier festhalten — jederzeit nachtragbar.",
    titlePlaceholder: "z. B. Artikel, Monographie, Archivsig.",
    visibility: "always",
  },
};

export function getSourceSectionConfig(
  type: string,
  parentEntryType?: string | null,
): SourceSectionConfig {
  if (type === "text" && parentEntryType === "book") {
    return {
      sectionTitle: "Belegquellen (Abschnitt)",
      meaning:
        "Das übergeordnete Buch (PDF unter Material) ist die Hauptquelle. Hier zusätzliche Editionen, parallele Handschriften oder Sekundärliteratur zu diesem Abschnitt.",
      emptyHint:
        "Optional — nur wenn dieser Abschnitt über das Buch hinaus weiter belegt werden soll.",
      titlePlaceholder: "z. B. Parallele Übersetzung, andere Edition",
      visibility: "optional",
    };
  }
  return (
    SOURCE_SECTION_CONFIG[type as EntryType] ?? SOURCE_SECTION_CONFIG.text
  );
}

/** Soll der Quellen-Block in der Detailansicht gerendert werden? */
export function shouldShowSourcesSection(
  type: string,
  sourceCount: number,
  canEdit: boolean,
  parentEntryType?: string | null,
): boolean {
  const config = getSourceSectionConfig(type, parentEntryType);
  if (sourceCount > 0) return true;
  if (!canEdit) return false;
  return config.visibility === "always" || config.visibility === "optional";
}

/** Label für Buch-Untereinträge (Typ text unter book). */
export function getBookChildTypeLabel(): string {
  return "Kapitel / Abschnitt";
}
