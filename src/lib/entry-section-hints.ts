import type { EntryType } from "@prisma/client";

export type SectionHints = {
  kern: string;
  material: string;
  offen: string;
  relations: string;
  sourcesExtra?: string;
};

const DEFAULT_HINTS: SectionHints = {
  kern: "Deine Zusammenfassung und Notizen — erst ausfüllen, wenn du Inhalt hast.",
  material: "PDF, Bilder und Dateien zu diesem Eintrag hochladen.",
  offen: "To-do für später: offene Fragen, die du noch klären willst.",
  relations:
    "Beziehungen zu anderen Einträgen — z. B. Person ↔ Buch oder Quellenbuch ↔ Synthesebuch.",
};

const HINTS_BY_TYPE: Partial<Record<EntryType, Partial<SectionHints>>> = {
  book: {
    kern: "Deine Buch-Zusammenfassung und Notizen — nach dem Lesen ausfüllen.",
    material: "Das Buch-PDF und weitere Dateien hier hochladen (Textextraktion für Suche & KI).",
    sourcesExtra:
      "Weiterführende Literatur: andere Werke, die der Autor nutzte — nicht dieses Buch selbst (PDF liegt unter Material). Tipp: Quellenwerk als eigenen Buch-Eintrag anlegen und per Verknüpfung „basiert auf“ verbinden.",
  },
  person: {
    kern: "Biografie, Rolle und Einordnung — nach der Recherche ausfüllen.",
    relations: "Verknüpfe Personen mit Büchern, Ereignissen und Orten (z. B. „behandelt“, „regierte in“).",
  },
  text: {
    kern: "Kernaussage, Übersetzung oder Analyse des Textes.",
    sourcesExtra:
      "Edition, Handschrift oder Publikation, aus der der Text stammt.",
  },
  place: {
    kern: "Historischer Kontext, Lage und Bedeutung des Ortes.",
  },
  discovery: {
    kern: "Fundbeschreibung, Datierung und Bedeutung.",
    sourcesExtra: "Grabungsbericht oder Publikation zum Fund.",
  },
  note: {
    kern: "Deine Recherche-Notiz oder Hypothese.",
  },
};

const BOOK_CHILD_HINTS: Partial<SectionHints> = {
  kern: "Zusammenfassung oder Notizen zu diesem Kapitel/Abschnitt.",
  material: "Zusätzliche Dateien zu diesem Abschnitt (Haupt-PDF liegt beim übergeordneten Buch).",
  sourcesExtra:
    "Optional: weitere Belege zu diesem Abschnitt — das Buch-PDF ist die Hauptquelle.",
};

export function getSectionHints(
  entryType: string,
  parentEntryType?: string | null,
): SectionHints {
  if (entryType === "text" && parentEntryType === "book") {
    return { ...DEFAULT_HINTS, ...BOOK_CHILD_HINTS };
  }

  const typeHints = HINTS_BY_TYPE[entryType as EntryType] ?? {};
  return { ...DEFAULT_HINTS, ...typeHints };
}

export const SOURCES_WORKFLOW_HINT =
  "Tipp: Quellenwerk als eigenen Buch-Eintrag anlegen (PDF unter Material), dann am Synthesebuch eine Verknüpfung „basiert auf“ setzen. Personen und Ereignisse ebenfalls als Einträge verknüpfen.";
