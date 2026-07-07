import type { EntryType } from "@prisma/client";

import {
  entryLanguageLabel,
  normalizeEntryLanguage,
  type EntryLanguageCode,
} from "@/lib/languages";
import {
  buildEntryKiVars,
  hasEntryContent,
  hasOcrContent,
  isBookSubEntry,
  type KiAttachmentInput,
  type KiChildEntryInput,
  type KiTemplateVars,
} from "@/lib/ki-template-vars";

/** Kurzer Hinweis pro Eintragstyp — was dokumentieren? */
export const ENTRY_TYPE_HINTS: Record<EntryType, string> = {
  book: "Zuerst Buch anlegen (Name, Autor, Jahr), dann PDF unter Material hochladen — danach KI-Vorlagen nutzen.",
  text: "Eintrag anlegen, Quelle/PDF unter Material hochladen, dann transkribieren oder übersetzen.",
  person: "Person anlegen, Lebensdaten erfassen — Quellen und PDFs unter Material ergänzen.",
  place: "Ort anlegen (Name, Koordinaten), historischen Kontext und Quellen nach und nach ergänzen.",
  discovery: "Fund anlegen, Fundort und Datierung erfassen — Material und Quellen unter Material hinzufügen.",
  note: "Notiz anlegen und Gedanken strukturieren — Quellen und PDFs können später ergänzt werden.",
};

export const KI_WORKFLOW_HINT =
  "Workflow: Eintrag zuerst anlegen → PDF/Anhänge unter Material hochladen → passende Vorlage wählen und in externe KI einfügen.";

export type UnifiedKiTemplate = {
  ziel: string;
  kontext: string;
  aufgabe: string[];
  ausgabeformat: string;
};

export type KiTemplate = {
  id: string;
  category: string;
  title: string;
  description: string;
  template: UnifiedKiTemplate;
};

export type EntryKiTemplate = {
  id: string;
  title: string;
  description: string;
  template: UnifiedKiTemplate;
  /** Vorlage braucht extrahierten PDF-Text unter Material */
  requiresOcr?: boolean;
  /** Vorlage braucht bereits ausgefüllten Kern (Zusammenfassung/Inhalt) */
  requiresBody?: boolean;
};

const METADATA_BLOCK = [
  "Bekannte Metadaten:",
  "- Titel: {{TITLE}}",
  "- Autor: {{AUTHOR}}",
  "- Jahr/Zeitraum: {{YEAR}}",
  "- Sprache: {{LANGUAGE}}",
].join("\n");

const OCR_KONTEXT_BLOCK = [
  METADATA_BLOCK,
  "",
  "Eintrag (Markdown):",
  "{{ENTRY_BODY}}",
  "",
  "Anhänge:",
  "{{ATTACHMENTS_LIST}}",
  "",
  "Extrahierter PDF-Text (digitale PDFs):",
  "{{OCR_TEXT}}",
  "",
  "Untereinträge:",
  "{{CHILD_ENTRIES}}",
].join("\n");

const BOOK_SUB_KONTEXT_BLOCK = [
  METADATA_BLOCK,
  "",
  "Eintrag (Markdown):",
  "{{ENTRY_BODY}}",
  "",
  "Seitenbereich: {{PAGE_START}} – {{PAGE_END}}",
  "",
  "Ausschnitt aus Buch-PDF (übergeordnetes Buch):",
  "{{PARENT_OCR_TEXT}}",
  "",
  "Eigene Anhänge:",
  "{{ATTACHMENTS_LIST}}",
].join("\n");

function entryKontext(typeLabel: string, schwerpunkte: string[]): string {
  return [
    "Du bist Historiker/in mit Expertise in Quellenkritik und historischer Methodik.",
    "",
    "Projekt: {{PROJECT}}",
    `Eintrag: „{{TITLE}}"`,
    `Eintragstyp: ${typeLabel}`,
    "",
    OCR_KONTEXT_BLOCK,
    "",
    `Schwerpunkte: ${schwerpunkte.join(", ")}`,
  ].join("\n");
}

function entryKontextEn(typeLabel: string, focus: string[]): string {
  return [
    "You are a historian with expertise in source criticism and historical methodology.",
    "",
    "Project: {{PROJECT}}",
    'Entry: "{{TITLE}}"',
    `Entry type: ${typeLabel}`,
    "",
    [
      "Known metadata:",
      "- Title: {{TITLE}}",
      "- Author: {{AUTHOR}}",
      "- Year/period: {{YEAR}}",
      "- Language: {{LANGUAGE}}",
      "",
      "Entry (Markdown):",
      "{{ENTRY_BODY}}",
      "",
      "Attachments:",
      "{{ATTACHMENTS_LIST}}",
      "",
      "Extracted PDF text (digital PDFs):",
      "{{OCR_TEXT}}",
      "",
      "Sub-entries:",
      "{{CHILD_ENTRIES}}",
    ].join("\n"),
    "",
    `Focus: ${focus.join(", ")}`,
  ].join("\n");
}

function bookLevelTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "book-metadaten-extrahieren",
      title: "Metadaten aus PDF/OCR extrahieren",
      description:
        "Titel, Autor und Jahr aus PDF-Text prüfen und mit den Eintragsfeldern abgleichen.",
      template: {
        ziel: `Für das Buch „{{TITLE}}" fehlende oder unsichere Metadaten (Titel, Autor, Jahr, Sprache) aus PDF/OCR-Text ermitteln und mit den vorhandenen Angaben vergleichen.`,
        kontext: entryKontext("Buch", ["Metadaten", "Titel", "Autor", "Jahr"]),
        aufgabe: [
          "Vorhandene Metadaten ({{TITLE}}, {{AUTHOR}}, {{YEAR}}) mit PDF-Titelseite und OCR-Text abgleichen",
          "Abweichungen und Schreibvarianten benennen",
          "Fehlende Felder aus dem Material vorschlagen",
          "Edition, Verlag und Erscheinungsjahr soweit erkennbar ergänzen",
        ],
        ausgabeformat: [
          "- **Metadaten-Vorschlag**: Tabelle `Feld | Aktuell | Vorschlag | Beleg`",
          "- **Unsicherheiten**: Bullet-Liste",
          "- **Nächste Schritte**: Checkliste für manuelle Ergänzung",
        ].join("\n"),
      },
    },
    {
      id: "book-kapitelstruktur",
      title: "Kapitelstruktur aus Inhaltsverzeichnis ableiten",
      description:
        "Untereinträge für Kapitel vorschlagen — benötigt PDF-Text oder Inhaltsverzeichnis.",
      requiresOcr: true,
      template: {
        ziel: `Eine sinnvolle Untergliederung für das Buch „{{TITLE}}" als Chronikon-Untereinträge aus Inhaltsverzeichnis oder OCR-Text entwerfen.`,
        kontext: entryKontext("Buch", ["Kapitel", "Untereinträge", "Inhaltsverzeichnis"]),
        aufgabe: [
          "Vorhandene Untereinträge bewerten und Lücken identifizieren",
          "Aus PDF-Inhaltsverzeichnis oder Textanfang eine Kapitelstruktur ableiten",
          "Je Kapitel: Titel, Seitenbereich und Kurzbeschreibung vorschlagen",
          "Priorität für die Bearbeitung empfehlen",
        ],
        ausgabeformat: [
          "- **Strukturvorschlag**: nummerierte Liste `Nr. | Titel | Seiten | Kurzinhalt | Priorität`",
          "- **Abgleich**: Vergleich mit {{CHILD_ENTRIES}}",
        ].join("\n"),
      },
    },
    {
      id: "book-gesamt-zusammenfassen",
      title: "Buch zusammenfassen (benötigt Material)",
      description:
        "Gesamtüberblick — nur sinnvoll, wenn PDF-Text unter Material vorhanden ist.",
      requiresOcr: true,
      template: {
        ziel: `Das Buch „{{TITLE}}" als Ganzes zusammenfassen — auf Basis von Metadaten und extrahiertem PDF-Text.`,
        kontext: entryKontext("Buch", ["Gesamtüberblick", "PDF-Text", "Edition"]),
        aufgabe: [
          "Kernthese und Aufbau des Werks in 2–4 Absätzen darstellen",
          "Autor ({{AUTHOR}}), Entstehungskontext und Jahr ({{YEAR}}) einordnen",
          "Aus {{OCR_TEXT}} zentrale Themen und Strukturelemente ableiten",
          "Lücken in der Textextraktion markieren",
        ],
        ausgabeformat: [
          "- **Gesamtzusammenfassung** (2–4 Absätze)",
          "- **Struktur**: Bullet-Liste der Hauptteile",
          "- **Offene Punkte**: nummerierte Liste",
        ].join("\n"),
      },
    },
  ];
}

function bookLevelTemplatesEn(): EntryKiTemplate[] {
  return [
    {
      id: "book-extract-metadata",
      title: "Extract metadata from PDF/OCR",
      description:
        "Verify title, author, and year from PDF text against entry fields.",
      template: {
        ziel: `Extract and verify metadata (title, author, year, language) for "{{TITLE}}" from PDF/OCR text.`,
        kontext: entryKontextEn("Book", ["Metadata", "Title", "Author", "Year"]),
        aufgabe: [
          "Compare existing metadata ({{TITLE}}, {{AUTHOR}}, {{YEAR}}) with PDF title page and OCR text",
          "Note discrepancies and spelling variants",
          "Suggest missing fields from the material",
          "Add edition, publisher, and publication year where identifiable",
        ],
        ausgabeformat: [
          "- **Metadata proposal**: table `Field | Current | Suggestion | Evidence`",
          "- **Uncertainties**: bullet list",
          "- **Next steps**: checklist for manual completion",
        ].join("\n"),
      },
    },
    {
      id: "book-chapter-structure",
      title: "Derive chapter structure from TOC",
      description:
        "Suggest sub-entries for chapters — requires PDF text or table of contents.",
      requiresOcr: true,
      template: {
        ziel: `Design a sub-entry structure for "{{TITLE}}" from table of contents or OCR text.`,
        kontext: entryKontextEn("Book", ["Chapters", "Sub-entries", "Table of contents"]),
        aufgabe: [
          "Review existing sub-entries and identify gaps",
          "Derive chapter structure from TOC or opening pages",
          "For each chapter: title, page range, and short description",
          "Recommend processing priority",
        ],
        ausgabeformat: [
          "- **Structure proposal**: numbered list `No. | Title | Pages | Summary | Priority`",
          "- **Alignment**: comparison with {{CHILD_ENTRIES}}",
        ].join("\n"),
      },
    },
    {
      id: "book-summarize",
      title: "Summarize book (requires material)",
      description:
        "Full overview — only useful when PDF text is available under Material.",
      requiresOcr: true,
      template: {
        ziel: `Summarize the book "{{TITLE}}" based on metadata and extracted PDF text.`,
        kontext: entryKontextEn("Book", ["Overview", "PDF text", "Edition"]),
        aufgabe: [
          "Present core thesis and structure in 2–4 paragraphs",
          "Contextualize author ({{AUTHOR}}), period ({{YEAR}}), and edition",
          "Derive main themes from {{OCR_TEXT}}",
          "Note gaps in text extraction",
        ],
        ausgabeformat: [
          "- **Summary** (2–4 paragraphs)",
          "- **Structure**: bullet list of main parts",
          "- **Open points**: numbered list",
        ].join("\n"),
      },
    },
  ];
}

function bookSubEntryTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "book-sub-abschnitt",
      title: "Abschnitt zusammenfassen",
      description:
        "Kapitel/Untereintrag anhand Seiten {{PAGE_START}}–{{PAGE_END}} bearbeiten — benötigt Buch-PDF.",
      requiresOcr: true,
      template: {
        ziel: `Den Untereintrag „{{TITLE}}" (Seiten {{PAGE_START}}–{{PAGE_END}}) im Kontext des übergeordneten Buchs zusammenfassen.`,
        kontext: [
          "Du bist Historiker/in. Material stammt aus einem digital extrahierten Buch-PDF.",
          "",
          "Projekt: {{PROJECT}}",
          `Untereintrag: „{{TITLE}}"`,
          "",
          BOOK_SUB_KONTEXT_BLOCK,
        ].join("\n"),
        aufgabe: [
          "Kerninhalt des Seitenbereichs in 2–3 Absätzen darstellen",
          "Zentrale Personen, Orte und Ereignisse erfassen",
          "Belege aus dem Buch-PDF-Ausschnitt benennen",
          "Bezug zum Gesamtwerk herstellen",
        ],
        ausgabeformat: [
          "- **Zusammenfassung** (2–3 Absätze)",
          "- **Schlüsseldaten**: Tabelle `Aspekt | Angabe | Seite/Beleg`",
          "- **Offene Punkte**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "book-sub-passagen",
      title: "Passagen im Seitenbereich",
      description:
        "Wichtige Stellen zwischen Seite {{PAGE_START}} und {{PAGE_END}} identifizieren.",
      requiresOcr: true,
      template: {
        ziel: `Bedeutungstragende Passagen im Seitenbereich {{PAGE_START}}–{{PAGE_END}} von „{{TITLE}}" identifizieren.`,
        kontext: [
          "Du bist Historiker/in.",
          "",
          "Projekt: {{PROJECT}}",
          `Untereintrag: „{{TITLE}}"`,
          "",
          BOOK_SUB_KONTEXT_BLOCK,
        ].join("\n"),
        aufgabe: [
          "5–8 zentrale Passagen aus dem Buch-PDF-Ausschnitt auswählen",
          "Je Passage: Kurzkommentar und historische Einordnung",
          "Seitenangaben soweit möglich zuordnen",
        ],
        ausgabeformat: [
          "- **Passagen**: nummerierte Liste mit Zitat und Kommentar",
          "- **Offene Punkte**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "book-sub-kern-notizen",
      title: "Kern-Notizen für Abschnitt",
      description:
        "Stichpunkte für den Kern-Bereich vorbereiten — auch ohne vollständigen PDF-Text.",
      template: {
        ziel: `Stichpunkte und Gliederung für den Untereintrag „{{TITLE}}" (S. {{PAGE_START}}–{{PAGE_END}}) vorbereiten.`,
        kontext: [
          "Du bist Historiker/in.",
          "",
          "Projekt: {{PROJECT}}",
          `Untereintrag: „{{TITLE}}"`,
          `Seiten: {{PAGE_START}} – {{PAGE_END}}`,
          "",
          BOOK_SUB_KONTEXT_BLOCK,
        ].join("\n"),
        aufgabe: [
          "Gliederung für den Kern-Bereich vorschlagen",
          "Erwartete Themen und Akteure für den Seitenbereich benennen",
          "Offene Fragen für die spätere Ausarbeitung formulieren",
        ],
        ausgabeformat: [
          "- **Gliederungsvorschlag**: nummerierte Liste",
          "- **Stichpunkte**: Bullet-Liste für den Kern",
          "- **Offene Fragen**: nummerierte Liste",
        ].join("\n"),
      },
    },
  ];
}

function textTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "text-transkription",
      title: "Transkription vorbereiten",
      description:
        "OCR-Text oder Scan in lesbare Transkription überführen — PDF unter Material nötig.",
      requiresOcr: true,
      template: {
        ziel: `Den Text „{{TITLE}}" aus OCR/PDF-Material transkribieren und für den Kern-Bereich aufbereiten.`,
        kontext: entryKontext("Text", ["Transkription", "Edition", "OCR"]),
        aufgabe: [
          "OCR-Fehler korrigieren und Lesefassung erstellen",
          "Unklare Stellen mit [?] markieren",
          "Absätze und Überschriften sinnvoll gliedern",
          "Editionssiglen oder handschriftliche Besonderheiten vermerken",
        ],
        ausgabeformat: [
          "- **Transkription**: formatierter Text für den Kern",
          "- **Korrekturliste**: Tabelle `Stelle | OCR | Korrektur | Sicherheit`",
          "- **Offene Stellen**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "text-uebersetzung",
      title: "Übersetzung vorbereiten",
      description:
        "Übersetzungsentwurf aus Quelltext — benötigt Material oder vorhandenen Inhalt.",
      requiresOcr: true,
      template: {
        ziel: `Eine Übersetzung des Textes „{{TITLE}}" ({{LANGUAGE}}) für den Kern-Bereich vorbereiten.`,
        kontext: entryKontext("Text", ["Übersetzung", "Edition", "Quelle"]),
        aufgabe: [
          "Quelltext aus {{OCR_TEXT}} oder Kern-Inhalt übersetzen",
          "Fachbegriffe und Eigennamen konsistent behandeln",
          "Schwierige Passagen mit Alternativvorschlägen versehen",
          "Fußnoten für Erklärungen vorschlagen",
        ],
        ausgabeformat: [
          "- **Übersetzung**: formatierter Text",
          "- **Glossar**: Tabelle `Original | Übersetzung | Anmerkung`",
          "- **Offene Passagen**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "text-passagen",
      title: "Zentrale Passagen",
      description:
        "Wichtige Stellen identifizieren — benötigt PDF-Text oder ausgefüllten Kern.",
      requiresOcr: true,
      template: {
        ziel: `Zentrale Passagen des Textes „{{TITLE}}" identifizieren und historisch einordnen.`,
        kontext: entryKontext("Text", ["Passagen", "Edition", "Zitate"]),
        aufgabe: [
          "5–10 bedeutungstragende Passagen auswählen",
          "Je Passage: Kurzkommentar und historische Einordnung",
          "Edition- oder Übersetzungsvarianten benennen",
        ],
        ausgabeformat: [
          "- **Passagen**: nummerierte Liste mit Zitat und Kommentar",
          "- **Edition/Übersetzung**: kurzer Absatz",
        ].join("\n"),
      },
    },
  ];
}

function textTemplatesEn(): EntryKiTemplate[] {
  return [
    {
      id: "text-transcription",
      title: "Prepare transcription",
      description: "Turn OCR/scan into readable transcription — PDF under Material required.",
      requiresOcr: true,
      template: {
        ziel: `Transcribe "{{TITLE}}" from OCR/PDF material for the entry body.`,
        kontext: entryKontextEn("Text", ["Transcription", "Edition", "OCR"]),
        aufgabe: [
          "Correct OCR errors and produce a readable version",
          "Mark unclear passages with [?]",
          "Structure paragraphs and headings sensibly",
          "Note editorial sigla or manuscript features",
        ],
        ausgabeformat: [
          "- **Transcription**: formatted text for the body",
          "- **Corrections**: table `Passage | OCR | Correction | Confidence`",
          "- **Open passages**: numbered list",
        ].join("\n"),
      },
    },
    {
      id: "text-translation",
      title: "Prepare translation",
      description: "Draft translation from source text — requires material or existing content.",
      requiresOcr: true,
      template: {
        ziel: `Prepare a translation of "{{TITLE}}" ({{LANGUAGE}}) for the entry body.`,
        kontext: entryKontextEn("Text", ["Translation", "Edition", "Source"]),
        aufgabe: [
          "Translate from {{OCR_TEXT}} or existing body content",
          "Handle technical terms and proper names consistently",
          "Offer alternatives for difficult passages",
          "Suggest footnotes for explanations",
        ],
        ausgabeformat: [
          "- **Translation**: formatted text",
          "- **Glossary**: table `Original | Translation | Note`",
          "- **Open passages**: numbered list",
        ].join("\n"),
      },
    },
    {
      id: "text-key-passages",
      title: "Key passages",
      description: "Identify important passages — requires PDF text or filled body.",
      requiresOcr: true,
      template: {
        ziel: `Identify and contextualize key passages in "{{TITLE}}".`,
        kontext: entryKontextEn("Text", ["Passages", "Edition", "Quotes"]),
        aufgabe: [
          "Select 5–10 significant passages",
          "For each: short commentary and historical context",
          "Note edition or translation variants",
        ],
        ausgabeformat: [
          "- **Passages**: numbered list with quote and commentary",
          "- **Edition/translation**: short paragraph",
        ].join("\n"),
      },
    },
  ];
}

function personTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "person-biografie-struktur",
      title: "Biografie-Struktur",
      description:
        "Gliederung für den Kern-Bereich vorschlagen — funktioniert auch bei leerem Eintrag.",
      template: {
        ziel: `Eine sinnvolle Biografie-Gliederung für „{{TITLE}}" als Ausgangspunkt für den Kern-Bereich entwerfen.`,
        kontext: entryKontext("Person", ["Biographie", "Lebensdaten", "Rolle"]),
        aufgabe: [
          "Lebensabschnitte und Kernthemen strukturieren",
          "Bekannte Daten ({{YEAR}}) und Lücken markieren",
          "Historische Rolle und Bedeutung skizzieren",
          "Empfohlene Quellenarten benennen",
        ],
        ausgabeformat: [
          "- **Gliederung**: nummerierte Liste mit Abschnittsüberschriften",
          "- **Lebensdaten**: Tabelle `Datum | Ereignis | Beleg/Sicherheit`",
          "- **Offene Fragen**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "person-lebensdaten",
      title: "Lebensdaten aus Quellen",
      description:
        "Daten aus PDF/OCR und Quellen extrahieren — Material unter Material hilfreich.",
      requiresOcr: true,
      template: {
        ziel: `Lebensdaten und Ereignisse für „{{TITLE}}" aus vorhandenem Material und Quellen extrahieren.`,
        kontext: entryKontext("Person", ["Lebensdaten", "Primärquellen", "Biographie"]),
        aufgabe: [
          "Geburt, Tod und wichtige Lebensereignisse aus {{OCR_TEXT}} und Kern-Inhalt erfassen",
          "Jede Angabe mit Beleg oder Unsicherheitsgrad versehen",
          "Widersprüche zwischen Quellen benennen",
        ],
        ausgabeformat: [
          "- **Lebensdaten**: Tabelle `Datum | Ereignis | Quelle | Sicherheit`",
          "- **Widersprüche**: Bullet-Liste",
          "- **Fehlende Daten**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "person-quellen-zuordnen",
      title: "Quellen zuordnen",
      description: "Primär- und Sekundärquellen für die Person strukturieren.",
      template: {
        ziel: `Quellen für die Person „{{TITLE}}" kategorisieren und Forschungslücken identifizieren.`,
        kontext: entryKontext("Person", ["Quellen", "Primärquellen", "Sekundärliteratur"]),
        aufgabe: [
          "Bekannte und vermutete Quellen nach Typ ordnen",
          "Lücken in der Quellenlage benennen",
          "Empfohlene nächste Recherche-Schritte formulieren",
        ],
        ausgabeformat: [
          "- **Quellenübersicht**: Tabelle `Quelle | Typ | Inhalt | Zuverlässigkeit`",
          "- **Lücken**: Bullet-Liste",
          "- **Nächste Schritte**: Checkliste",
        ].join("\n"),
      },
    },
  ];
}

function personTemplatesEn(): EntryKiTemplate[] {
  return [
    {
      id: "person-bio-structure",
      title: "Biography structure",
      description: "Suggest outline for the body — works even with an empty entry.",
      template: {
        ziel: `Design a biography outline for "{{TITLE}}" as a starting point for the entry body.`,
        kontext: entryKontextEn("Person", ["Biography", "Life dates", "Role"]),
        aufgabe: [
          "Structure life periods and core themes",
          "Mark known dates ({{YEAR}}) and gaps",
          "Sketch historical role and significance",
          "Recommend source types to consult",
        ],
        ausgabeformat: [
          "- **Outline**: numbered list with section headings",
          "- **Life dates**: table `Date | Event | Evidence/Confidence`",
          "- **Open questions**: numbered list",
        ].join("\n"),
      },
    },
    {
      id: "person-life-dates",
      title: "Life dates from sources",
      description: "Extract dates from PDF/OCR — material under Material helpful.",
      requiresOcr: true,
      template: {
        ziel: `Extract life dates and events for "{{TITLE}}" from available material.`,
        kontext: entryKontextEn("Person", ["Life dates", "Primary sources", "Biography"]),
        aufgabe: [
          "Record birth, death, and key events from {{OCR_TEXT}} and body",
          "Attach evidence or confidence level to each claim",
          "Note contradictions between sources",
        ],
        ausgabeformat: [
          "- **Life dates**: table `Date | Event | Source | Confidence`",
          "- **Contradictions**: bullet list",
          "- **Missing data**: numbered list",
        ].join("\n"),
      },
    },
    {
      id: "person-sources",
      title: "Assign sources",
      description: "Structure primary and secondary sources for the person.",
      template: {
        ziel: `Categorize sources for "{{TITLE}}" and identify research gaps.`,
        kontext: entryKontextEn("Person", ["Sources", "Primary sources", "Secondary literature"]),
        aufgabe: [
          "Organize known and probable sources by type",
          "Identify gaps in source coverage",
          "Recommend next research steps",
        ],
        ausgabeformat: [
          "- **Source overview**: table `Source | Type | Content | Reliability`",
          "- **Gaps**: bullet list",
          "- **Next steps**: checklist",
        ].join("\n"),
      },
    },
  ];
}

function placeTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "place-geografie",
      title: "Geografie & Lage",
      description:
        "Geografische Angaben strukturieren — funktioniert auch bei leerem Kern.",
      template: {
        ziel: `Geografische und topografische Informationen für „{{TITLE}}" erfassen und strukturieren.`,
        kontext: entryKontext("Ort", ["Geografie", "Koordinaten", "Lage"]),
        aufgabe: [
          "Lage, Region und historische Verwaltungszugehörigkeit skizzieren",
          "Namensvarianten in verschiedenen Sprachen und Epochen sammeln",
          "Koordinaten und Kartenquellen vorschlagen",
        ],
        ausgabeformat: [
          "- **Geografie**: Absatz mit Lagebeschreibung",
          "- **Namensvarianten**: Tabelle `Sprache/Epoche | Name | Quelle`",
          "- **Offene Punkte**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "place-historischer-kontext",
      title: "Historischer Kontext",
      description:
        "Zeitliche Entwicklung und Ereignisse am Ort — Material hilfreich.",
      requiresOcr: true,
      template: {
        ziel: `Den historischen Kontext von „{{TITLE}}" ({{YEAR}}) aus Material und Quellen darstellen.`,
        kontext: entryKontext("Ort", ["Geschichte", "Ereignisse", "Epochen"]),
        aufgabe: [
          "Wichtige Ereignisse und Epochen am Ort chronologisch ordnen",
          "Bezug zu Personen, Herrschern und Konflikten herstellen",
          "Aus {{OCR_TEXT}} relevante Passagen nutzen",
        ],
        ausgabeformat: [
          "- **Chronologie**: Tabelle `Zeitraum | Ereignis | Bedeutung | Beleg`",
          "- **Schlüsselpersonen**: Bullet-Liste",
          "- **Offene Fragen**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "place-quellen",
      title: "Quellen & Belege",
      description: "Quellen für Ortsangaben sammeln und bewerten.",
      template: {
        ziel: `Quellen und Belege für „{{TITLE}}" systematisch erfassen.`,
        kontext: entryKontext("Ort", ["Quellen", "Karten", "Archäologie"]),
        aufgabe: [
          "Primärquellen, Karten und archäologische Befunde auflisten",
          "Verlässlichkeit der Ortsangaben bewerten",
          "Fehlende Belege benennen",
        ],
        ausgabeformat: [
          "- **Quellen**: Tabelle `Quelle | Typ | Inhalt | Zuverlässigkeit`",
          "- **Lücken**: Bullet-Liste",
        ].join("\n"),
      },
    },
  ];
}

function placeTemplatesEn(): EntryKiTemplate[] {
  return [
    {
      id: "place-geography",
      title: "Geography & location",
      description: "Structure geographic data — works with an empty body.",
      template: {
        ziel: `Capture and structure geographic information for "{{TITLE}}".`,
        kontext: entryKontextEn("Place", ["Geography", "Coordinates", "Location"]),
        aufgabe: [
          "Sketch location, region, and historical administration",
          "Collect name variants across languages and periods",
          "Suggest coordinates and map sources",
        ],
        ausgabeformat: [
          "- **Geography**: paragraph with location description",
          "- **Name variants**: table `Language/Period | Name | Source`",
          "- **Open points**: numbered list",
        ].join("\n"),
      },
    },
    {
      id: "place-historical-context",
      title: "Historical context",
      description: "Temporal development and events — material helpful.",
      requiresOcr: true,
      template: {
        ziel: `Present the historical context of "{{TITLE}}" ({{YEAR}}) from material and sources.`,
        kontext: entryKontextEn("Place", ["History", "Events", "Periods"]),
        aufgabe: [
          "Order key events and periods chronologically",
          "Connect to persons, rulers, and conflicts",
          "Use relevant passages from {{OCR_TEXT}}",
        ],
        ausgabeformat: [
          "- **Chronology**: table `Period | Event | Significance | Evidence`",
          "- **Key persons**: bullet list",
          "- **Open questions**: numbered list",
        ].join("\n"),
      },
    },
    {
      id: "place-sources",
      title: "Sources & evidence",
      description: "Collect and assess sources for place data.",
      template: {
        ziel: `Systematically record sources and evidence for "{{TITLE}}".`,
        kontext: entryKontextEn("Place", ["Sources", "Maps", "Archaeology"]),
        aufgabe: [
          "List primary sources, maps, and archaeological finds",
          "Assess reliability of location claims",
          "Note missing evidence",
        ],
        ausgabeformat: [
          "- **Sources**: table `Source | Type | Content | Reliability`",
          "- **Gaps**: bullet list",
        ].join("\n"),
      },
    },
  ];
}

function discoveryTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "discovery-funddaten",
      title: "Funddaten strukturieren",
      description:
        "Fundort, Datierung und Umstände erfassen — auch bei leerem Kern.",
      template: {
        ziel: `Funddaten für „{{TITLE}}" strukturiert erfassen und Lücken identifizieren.`,
        kontext: entryKontext("Fund", ["Fundort", "Datierung", "Fundumstände"]),
        aufgabe: [
          "Fundort, Fundjahr ({{YEAR}}) und Fundumstände dokumentieren",
          "Bisherige Angaben mit bekannten Metadaten abgleichen",
          "Fehlende Pflichtfelder benennen",
        ],
        ausgabeformat: [
          "- **Funddaten**: Tabelle `Aspekt | Angabe | Beleg/Sicherheit`",
          "- **Fehlende Angaben**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "discovery-datierung",
      title: "Datierung prüfen",
      description: "Datierungsargumente aus Material und Quellen bewerten.",
      requiresOcr: true,
      template: {
        ziel: `Die Datierung von „{{TITLE}}" anhand von Material und Quellen prüfen.`,
        kontext: entryKontext("Fund", ["Datierung", "Methodik", "Publikation"]),
        aufgabe: [
          "Datierungsmethoden und Argumente aus {{OCR_TEXT}} zusammenfassen",
          "Gesicherte vs. umstrittene Datierungen unterscheiden",
          "Alternative Datierungsvorschläge benennen",
        ],
        ausgabeformat: [
          "- **Datierung**: Absatz mit Begründung",
          "- **Argumente**: Tabelle `Argument | Beleg | Sicherheit`",
          "- **Offene Punkte**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "discovery-publikation",
      title: "Publikation & Forschung",
      description: "Forschungsgeschichte und Publikationen erfassen.",
      template: {
        ziel: `Publikationen und Forschungsstand zu „{{TITLE}}" zusammenstellen.`,
        kontext: entryKontext("Fund", ["Publikation", "Forschungsgeschichte"]),
        aufgabe: [
          "Erstpublikation und wichtige Sekundärliteratur auflisten",
          "Forschungskontroversen skizzieren",
          "Empfohlene nächste Lektüre benennen",
        ],
        ausgabeformat: [
          "- **Publikationen**: nummerierte Liste mit Kurzkommentar",
          "- **Forschungsstand**: Absatz",
          "- **Empfehlungen**: Checkliste",
        ].join("\n"),
      },
    },
  ];
}

function noteTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "note-recherche-struktur",
      title: "Recherche strukturieren",
      description:
        "Gedanken und Hypothesen ordnen — ideal für einen neuen Eintrag.",
      template: {
        ziel: `Die Recherche-Notiz „{{TITLE}}" strukturieren und nächste Schritte planen.`,
        kontext: entryKontext("Notiz", ["Hypothesen", "Gedankengang", "Recherche"]),
        aufgabe: [
          "Kerngedanken und Hypothesen klar formulieren",
          "Bereits bekannte vs. spekulative Aussagen trennen",
          "Offene Fragen und nächste Recherche-Schritte priorisieren",
        ],
        ausgabeformat: [
          "- **Kernthese**: Absatz",
          "- **Hypothesen**: nummerierte Liste mit Sicherheitsgrad",
          "- **Nächste Schritte**: Checkliste",
        ].join("\n"),
      },
    },
    {
      id: "note-quellen-recherche",
      title: "Quellen recherchieren",
      description: "Relevante Quellen und Literatur für die Notiz finden.",
      template: {
        ziel: `Relevante Quellen und Literatur für die Notiz „{{TITLE}}" identifizieren.`,
        kontext: entryKontext("Notiz", ["Quellen", "Literatur", "Recherche"]),
        aufgabe: [
          "Primär- und Sekundärquellen vorschlagen, die die Hypothese prüfen könnten",
          "Archivbestände, Editionen und Datenbanken empfehlen",
          "Suchstrategien für die weitere Recherche formulieren",
        ],
        ausgabeformat: [
          "- **Quellenvorschläge**: Tabelle `Quelle | Typ | Relevanz | Zugang`",
          "- **Suchstrategie**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "note-kontext-recherche",
      title: "Kontext recherchieren",
      description:
        "Historischen Kontext recherchieren — Material unter Material hilfreich.",
      requiresOcr: true,
      template: {
        ziel: `Historischen Kontext für die Notiz „{{TITLE}}" ({{YEAR}}) aus Material und Recherche ergänzen.`,
        kontext: entryKontext("Notiz", ["Kontext", "Epoche", "Einordnung"]),
        aufgabe: [
          "Zeitliche und räumliche Einordnung skizzieren",
          "Verwandte Ereignisse, Personen und Orte benennen",
          "Aus {{OCR_TEXT}} relevante Informationen nutzen",
        ],
        ausgabeformat: [
          "- **Kontext**: Absatz",
          "- **Verknüpfungen**: Bullet-Liste zu Personen, Orten, Ereignissen",
          "- **Offene Fragen**: nummerierte Liste",
        ].join("\n"),
      },
    },
  ];
}

function noteTemplatesEn(): EntryKiTemplate[] {
  return [
    {
      id: "note-research-structure",
      title: "Structure research",
      description: "Organize thoughts and hypotheses — ideal for a new entry.",
      template: {
        ziel: `Structure the research note "{{TITLE}}" and plan next steps.`,
        kontext: entryKontextEn("Note", ["Hypotheses", "Reasoning", "Research"]),
        aufgabe: [
          "Formulate core thoughts and hypotheses clearly",
          "Separate known from speculative claims",
          "Prioritize open questions and next research steps",
        ],
        ausgabeformat: [
          "- **Core thesis**: paragraph",
          "- **Hypotheses**: numbered list with confidence level",
          "- **Next steps**: checklist",
        ].join("\n"),
      },
    },
    {
      id: "note-source-research",
      title: "Find sources",
      description: "Identify relevant sources and literature for the note.",
      template: {
        ziel: `Identify relevant sources and literature for "{{TITLE}}".`,
        kontext: entryKontextEn("Note", ["Sources", "Literature", "Research"]),
        aufgabe: [
          "Suggest primary and secondary sources to test the hypothesis",
          "Recommend archives, editions, and databases",
          "Formulate search strategies for further research",
        ],
        ausgabeformat: [
          "- **Source suggestions**: table `Source | Type | Relevance | Access`",
          "- **Search strategy**: numbered list",
        ].join("\n"),
      },
    },
    {
      id: "note-context-research",
      title: "Research context",
      description: "Research historical context — material under Material helpful.",
      requiresOcr: true,
      template: {
        ziel: `Add historical context for "{{TITLE}}" ({{YEAR}}) from material and research.`,
        kontext: entryKontextEn("Note", ["Context", "Period", "Placement"]),
        aufgabe: [
          "Sketch temporal and spatial placement",
          "Name related events, persons, and places",
          "Use relevant information from {{OCR_TEXT}}",
        ],
        ausgabeformat: [
          "- **Context**: paragraph",
          "- **Connections**: bullet list of persons, places, events",
          "- **Open questions**: numbered list",
        ].join("\n"),
      },
    },
  ];
}

export type EntryKiTemplateContext = {
  parentEntryType?: string | null;
};

function templatesForType(
  type: EntryType,
  lang: EntryLanguageCode,
): EntryKiTemplate[] {
  const isEn = lang === "en";

  switch (type) {
    case "book":
      return isEn ? bookLevelTemplatesEn() : bookLevelTemplatesDe();
    case "text":
      return isEn ? textTemplatesEn() : textTemplatesDe();
    case "person":
      return isEn ? personTemplatesEn() : personTemplatesDe();
    case "place":
      return isEn ? placeTemplatesEn() : placeTemplatesDe();
    case "discovery":
      return discoveryTemplatesDe();
    case "note":
      return isEn ? noteTemplatesEn() : noteTemplatesDe();
    default:
      return noteTemplatesDe();
  }
}

function getTemplatesForLanguage(
  type: EntryType,
  lang: EntryLanguageCode,
  context?: EntryKiTemplateContext,
): EntryKiTemplate[] {
  if (isBookSubEntry({ parentEntryType: context?.parentEntryType })) {
    return bookSubEntryTemplatesDe();
  }

  return templatesForType(type, lang).slice(0, 3);
}

/** Projektweite Vorlagen — nach ZIP-Export in externe KI einfügen */
export const PROJECT_KI_TEMPLATES: KiTemplate[] = [
  {
    id: "quellenkritik",
    category: "Quellenanalyse",
    title: "Quellenkritik",
    description: "Quellen eines Ober-Themas bewerten und vergleichen.",
    template: {
      ziel: `Die Quellenlage des Projekts „{{PROJECT}}" systematisch bewerten und Lücken identifizieren.`,
      kontext: [
        "Du bist Historiker/in.",
        "",
        "Projekt: {{PROJECT}}",
        "Sprache: Deutsch und Englisch",
        "Material aus Chronikon (ZIP-Export mit Einträgen und OCR-Texten im Ordner ocr/):",
        "{{ENTRIES}}",
      ].join("\n"),
      aufgabe: [
        "Primär- und Sekundärquellen unterscheiden",
        "Überlieferungsgeschichte der wichtigsten Quellen skizzieren",
        "Verlässlichkeit, Lücken und Verzerrungen benennen",
        "OCR-Qualität und fehlende Volltexte berücksichtigen",
        "Offene quellenkritische Fragen formulieren",
      ],
      ausgabeformat: [
        "- **Quellenübersicht**: Tabelle `Quelle | Typ | Zeitraum | Verlässlichkeit`",
        "- **Lücken**: Bullet-Liste",
        "- **Offene Fragen**: nummerierte Liste",
      ].join("\n"),
    },
  },
  {
    id: "zusammenfassung",
    category: "Zusammenfassung",
    title: "Forschungsstand zusammenfassen",
    description: "Überblick über das gesamte Ober-Thema erstellen.",
    template: {
      ziel: `Den Forschungsstand von „{{PROJECT}}" in verständlicher Form zusammenfassen.`,
      kontext: [
        "Du bist Historiker/in.",
        "",
        "Projekt: {{PROJECT}}",
        "Sprache: Deutsch und Englisch",
        "Material aus Chronikon (ZIP-Export):",
        "{{ENTRIES}}",
      ].join("\n"),
      aufgabe: [
        "Kernthese in 3–5 Sätzen formulieren",
        "Wichtigste Personen, Orte und Texte benennen",
        "Gesicherten von spekulativem Stand unterscheiden",
        "Empfohlene nächste Recherche-Schritte vorschlagen",
      ],
      ausgabeformat: [
        "- **Kernthese**: Absatz",
        "- **Schlüsselakteure**: Bullet-Liste",
        "- **Stand**: Tabelle `Aussage | Status (gesichert/vermutlich/streitig)`",
        "- **Nächste Schritte**: Checkliste",
      ].join("\n"),
    },
  },
  {
    id: "behauptungen",
    category: "Analyse",
    title: "Behauptungen extrahieren",
    description: "Überprüfbare Aussagen aus dem Material ziehen.",
    template: {
      ziel: `Überprüfbare Behauptungen aus „{{PROJECT}}" extrahieren und bewerten.`,
      kontext: [
        "Du bist Historiker/in.",
        "",
        "Projekt: {{PROJECT}}",
        "Sprache: Deutsch und Englisch",
        "Material aus Chronikon (ZIP mit Einträgen und OCR):",
        "{{ENTRIES}}",
      ].join("\n"),
      aufgabe: [
        "Jede Behauptung als klaren Satz formulieren",
        'Beleg in den Quellen angeben oder als „unbelegt" markieren',
        "Confidence zuordnen: gesichert / vermutlich / streitig / unbekannt",
        "Gegenargumente oder offene Punkte nennen",
      ],
      ausgabeformat: [
        "- **Behauptungen**: Tabelle `Behauptung | Beleg | Confidence | Anmerkung`",
        "- **Unbelegte Aussagen**: Bullet-Liste",
        "- **Offene Punkte**: nummerierte Liste",
      ].join("\n"),
    },
  },
];

export function renderKiTemplate(template: UnifiedKiTemplate): string {
  const aufgabe = template.aufgabe
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  return [
    "## Ziel",
    template.ziel,
    "",
    "## Kontext",
    template.kontext,
    "",
    "## Aufgabe",
    aufgabe,
    "",
    "## Ausgabeformat",
    template.ausgabeformat,
  ].join("\n");
}

export function fillKiTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function getEntryKiTemplates(
  type: EntryType,
  language?: string | null,
  context?: EntryKiTemplateContext,
): EntryKiTemplate[] {
  const lang = normalizeEntryLanguage(language);
  return getTemplatesForLanguage(type, lang, context);
}

export function getEntryKiTemplate(
  type: EntryType,
  templateId: string,
  language?: string | null,
  context?: EntryKiTemplateContext,
): EntryKiTemplate | undefined {
  return getEntryKiTemplates(type, language, context).find(
    (template) => template.id === templateId,
  );
}

export function renderEntryKiPrompt(
  type: EntryType,
  templateId: string,
  vars: KiTemplateVars,
  language?: string | null,
  context?: EntryKiTemplateContext,
): string {
  const definition = getEntryKiTemplate(type, templateId, language, context);
  if (!definition) return "";
  return fillKiTemplate(renderKiTemplate(definition.template), vars);
}

export function getEntryTypeKiPrompt(
  type: EntryType,
  input: {
    project: string;
    entryTitle: string;
    entryMarkdown: string;
    language?: string | null;
    author?: string | null;
    yearStart?: number | null;
    yearEnd?: number | null;
    pageStart?: number | null;
    pageEnd?: number | null;
    attachments?: KiAttachmentInput[];
    parentAttachments?: KiAttachmentInput[];
    childEntries?: KiChildEntryInput[];
    parentEntryType?: string | null;
    templateId?: string;
  },
): string {
  const context: EntryKiTemplateContext = {
    parentEntryType: input.parentEntryType,
  };
  const templates = getEntryKiTemplates(type, input.language, context);
  const templateId = input.templateId ?? templates[0]?.id;
  if (!templateId) return "";

  const vars = buildEntryKiVars({
    project: input.project,
    entryTitle: input.entryTitle,
    entryMarkdown: input.entryMarkdown,
    language: input.language,
    author: input.author,
    yearStart: input.yearStart,
    yearEnd: input.yearEnd,
    pageStart: input.pageStart,
    pageEnd: input.pageEnd,
    attachments: input.attachments,
    parentAttachments: input.parentAttachments,
    childEntries: input.childEntries,
  });

  return renderEntryKiPrompt(type, templateId, vars, input.language, context);
}

export function getEntryTypeKiTemplate(
  type: EntryType,
  templateId?: string,
  language?: string | null,
  context?: EntryKiTemplateContext,
): UnifiedKiTemplate | undefined {
  const templates = getEntryKiTemplates(type, language, context);
  const definition = templateId
    ? templates.find((template) => template.id === templateId)
    : templates[0];
  return definition?.template;
}

export function getProjectTypeKiPrompt(
  type: EntryType,
  projectName: string,
  templateId?: string,
): string {
  const typeLabel = {
    book: "Bücher",
    text: "Texte",
    person: "Personen",
    place: "Orte",
    discovery: "Funde",
    note: "Notizen",
  }[type];

  const schwerpunkte = {
    book: "Kapitel, OCR-Volltext, Edition",
    text: "Quelle, Edition, Übersetzung",
    person: "Biographie, Quellen, Netzwerk",
    place: "Koordinaten, Namensvarianten, Geschichte",
    discovery: "Fundort, Datierung, Publikation",
    note: "Hypothesen, Gedankengang, Recherche",
  }[type];

  const template: UnifiedKiTemplate = {
    ziel: `Alle ${typeLabel} im Projekt „{{PROJECT}}" analysieren und strukturieren.`,
    kontext: [
      "Du bist Historiker/in.",
      "",
      "Projekt: {{PROJECT}}",
      "Sprache: Deutsch und Englisch",
      `Eintragstyp-Fokus: ${typeLabel} (${schwerpunkte})`,
      "Material aus Chronikon-ZIP (Ordner entries/ und ocr/):",
      "{{ENTRIES}}",
    ].join("\n"),
    aufgabe: [
      `${typeLabel} nach ${schwerpunkte.split(",")[0]} gruppieren und einordnen`,
      "Lücken und Widersprüche zwischen Einträgen markieren",
      "OCR-Volltexte aus dem ZIP-Korpus nutzen und fehlende Texte benennen",
      "Querverbindungen zwischen Einträgen vorschlagen",
      "Priorisierte nächste Recherche-Schritte benennen",
    ],
    ausgabeformat: [
      `- **Übersicht**: Tabelle \`Eintrag | ${schwerpunkte.split(",")[0]} | Status\``,
      "- **Lücken**: Bullet-Liste",
      "- **Verbindungen**: Bullet-Liste",
      "- **Nächste Schritte**: Checkliste",
    ].join("\n"),
  };

  void templateId;

  return fillKiTemplate(renderKiTemplate(template), {
    PROJECT: projectName,
    ENTRIES:
      "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren; Ordner ocr/ enthält OCR-Volltexte)",
  });
}

export function getProjectKiTemplate(id: string): KiTemplate | undefined {
  return PROJECT_KI_TEMPLATES.find((t) => t.id === id);
}

export function renderProjectKiPrompt(
  template: KiTemplate,
  vars: Record<string, string>,
): string {
  return fillKiTemplate(renderKiTemplate(template.template), vars);
}

export {
  buildEntryKiVars,
  hasEntryContent,
  hasOcrContent,
  isBookSubEntry,
  entryLanguageLabel,
  normalizeEntryLanguage,
};
export type { KiAttachmentInput, KiChildEntryInput, KiTemplateVars };
