import type { EntryType } from "@prisma/client";

import { TYPE_META } from "@/lib/constants";
import {
  entryLanguageLabel,
  normalizeEntryLanguage,
  type EntryLanguageCode,
} from "@/lib/languages";
import {
  buildEntryKiVars,
  hasOcrContent,
  isBookSubEntry,
  type KiAttachmentInput,
  type KiChildEntryInput,
  type KiTemplateVars,
} from "@/lib/ki-template-vars";

/** Kurzer Hinweis pro Eintragstyp — was dokumentieren? */
export const ENTRY_TYPE_HINTS: Record<EntryType, string> = {
  book: "PDF des Buches hochladen (Textextraktion), Kapitel als Untereinträge mit Seitenzahlen anlegen.",
  text: "Quelle, Übersetzung und Edition festhalten — ideal für Vergleiche und Zitate.",
  person: "Lebensdaten, historische Rolle und belegende Quellen erfassen.",
  place: "Koordinaten, historischer Name und zeitliche Zuordnung dokumentieren.",
  discovery: "Fundort, Datierung, Fundumstände und Publikation festhalten.",
  note: "Freie Recherche-Notiz — Gedanken, Hypothesen und offene Fragen.",
};

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
};

const OCR_KONTEXT_BLOCK = [
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
    `Eintrag: „{{ENTRY_TITLE}}"`,
    `Eintragstyp: ${typeLabel}`,
    "Sprache des Eintrags: {{LANGUAGE}}",
    `Schwerpunkte: ${schwerpunkte.join(", ")}`,
    "",
    OCR_KONTEXT_BLOCK,
  ].join("\n");
}

const TYPE_SCHWERPUNKTE: Record<EntryType, string[]> = {
  book: ["Gesamtüberblick", "Kapitelstruktur", "OCR-Volltext", "Edition"],
  text: ["Quelle", "Edition", "Übersetzung", "Zitate"],
  person: ["Biographie", "Rolle", "Primärquellen"],
  place: ["Koordinaten", "Namensvarianten", "Ereignisse"],
  discovery: ["Fundort", "Datierung", "Publikation"],
  note: ["Hypothesen", "Gedankengang", "Recherche"],
};

function summarizeVerifyDe(type: EntryType): EntryKiTemplate {
  const typeLabel = TYPE_META[type].label;
  return {
    id: `${type}-zusammenfassen-pruefen`,
    title: "Zusammenfassen & prüfen",
    description: `Inhalt von „{{ENTRY_TITLE}}" fachlich zusammenfassen und quellenkritisch prüfen.`,
    template: {
      ziel: `Den ${typeLabel.toLowerCase()}-Eintrag „{{ENTRY_TITLE}}" auf Basis der Metadaten, des Inhalts und des OCR-Volltexts zusammenfassen und quellenkritisch prüfen.`,
      kontext: entryKontext(typeLabel, TYPE_SCHWERPUNKTE[type]),
      aufgabe: [
        "Kerninhalt und zentrale Aussagen in 2–3 Absätzen darstellen",
        "Wichtige Personen, Orte, Ereignisse und Zeitangaben erfassen",
        "Quellenlage und Belege bewerten — gesichert vs. unsicher kennzeichnen",
        "Lücken im OCR-Text und fehlende Informationen markieren",
        "Offene Forschungsfragen und empfohlene nächste Schritte formulieren",
      ],
      ausgabeformat: [
        "- **Zusammenfassung** (2–3 Absätze)",
        "- **Schlüsseldaten**: Tabelle `Aspekt | Angabe | Beleg/Sicherheit`",
        "- **Quellenkritik**: Bullet-Liste zu Verlässlichkeit und Lücken",
        "- **Offene Fragen**: nummerierte Liste",
      ].join("\n"),
    },
  };
}

function summarizeVerifyEn(type: EntryType): EntryKiTemplate {
  const typeLabel = TYPE_META[type].label;
  return {
    id: `${type}-summarize-verify`,
    title: "Summarize & verify",
    description: "Summarize and critically verify the entry content (English material).",
    template: {
      ziel: `Summarize and critically verify the ${typeLabel.toLowerCase()} entry "{{ENTRY_TITLE}}" based on metadata, body text, and OCR full text.`,
      kontext: [
        "You are a historian with expertise in source criticism and historical methodology.",
        "",
        "Project: {{PROJECT}}",
        'Entry: "{{ENTRY_TITLE}}"',
        `Entry type: ${typeLabel}`,
        "Entry language: {{LANGUAGE}}",
        `Focus: ${TYPE_SCHWERPUNKTE[type].join(", ")}`,
        "",
        OCR_KONTEXT_BLOCK,
      ].join("\n"),
      aufgabe: [
        "Summarize core content and main claims in 2–3 paragraphs",
        "Extract key persons, places, events, and dates",
        "Assess sources and evidence — mark verified vs. uncertain claims",
        "Note OCR gaps and missing information",
        "Formulate open research questions and recommended next steps",
      ],
      ausgabeformat: [
        "- **Summary** (2–3 paragraphs)",
        "- **Key data**: table `Aspect | Detail | Evidence/Confidence`",
        "- **Source criticism**: bullet list on reliability and gaps",
        "- **Open questions**: numbered list",
      ].join("\n"),
    },
  };
}

function summarizeInGerman(type: EntryType): EntryKiTemplate {
  const typeLabel = TYPE_META[type].label;
  return {
    id: `${type}-auf-deutsch-zusammenfassen`,
    title: "Auf Deutsch zusammenfassen",
    description:
      "Englisches Material zusammenfassen — Ausgabe auf Deutsch für das deutsche Projekt.",
    template: {
      ziel: `Das englischsprachige Material von „{{ENTRY_TITLE}}" (${typeLabel}) auf Deutsch zusammenfassen und für die weitere Recherche im Projekt aufbereiten.`,
      kontext: [
        "Du bist Historiker/in. Das Quellenmaterial ist auf Englisch; die Ausgabe soll auf Deutsch sein.",
        "",
        "Projekt: {{PROJECT}}",
        `Eintrag: „{{ENTRY_TITLE}}"`,
        `Eintragstyp: ${typeLabel}`,
        "Sprache des Materials: {{LANGUAGE}} (Englisch)",
        "",
        OCR_KONTEXT_BLOCK,
      ].join("\n"),
      aufgabe: [
        "Kerninhalt des englischen Materials auf Deutsch in 2–3 Absätzen wiedergeben",
        "Fachbegriffe und Eigennamen korrekt übertragen — englische Originalform in Klammern wenn hilfreich",
        "Zentrale Belege und unsichere Stellen markieren",
        "Empfehlungen für deutsche Sekundärliteratur oder Übersetzungen nennen",
      ],
      ausgabeformat: [
        "- **Deutsche Zusammenfassung** (2–3 Absätze)",
        "- **Schlüsselbegriffe**: Tabelle `Deutsch | Englisch | Anmerkung`",
        "- **Offene Punkte**: nummerierte Liste auf Deutsch",
      ].join("\n"),
    },
  };
}

function bookSubEntryTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "book-sub-abschnitt",
      title: "Abschnitt zusammenfassen",
      description:
        "Kapitel/Untereintrag anhand Seiten {{PAGE_START}}–{{PAGE_END}} und Buch-PDF-Text bearbeiten.",
      template: {
        ziel: `Den Untereintrag „{{ENTRY_TITLE}}" (Seiten {{PAGE_START}}–{{PAGE_END}}) im Kontext des übergeordneten Buchs zusammenfassen.`,
        kontext: [
          "Du bist Historiker/in. Material stammt aus einem digital extrahierten Buch-PDF.",
          "",
          "Projekt: {{PROJECT}}",
          `Untereintrag: „{{ENTRY_TITLE}}"`,
          "Sprache: {{LANGUAGE}}",
          "",
          BOOK_SUB_KONTEXT_BLOCK,
        ].join("\n"),
        aufgabe: [
          "Kerninhalt des Seitenbereichs in 2–3 Absätzen darstellen",
          "Zentrale Personen, Orte und Ereignisse im Abschnitt erfassen",
          "Belege aus dem Buch-PDF-Ausschnitt benennen — Unsicherheiten markieren",
          "Bezug zum Gesamtwerk und zu anderen Kapiteln herstellen",
          "Offene Punkte für die weitere Recherche formulieren",
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
      description: "Wichtige Stellen zwischen Seite {{PAGE_START}} und {{PAGE_END}} identifizieren.",
      template: {
        ziel: `Bedeutungstragende Passagen im Seitenbereich {{PAGE_START}}–{{PAGE_END}} von „{{ENTRY_TITLE}}" identifizieren.`,
        kontext: [
          "Du bist Historiker/in.",
          "",
          "Projekt: {{PROJECT}}",
          `Untereintrag: „{{ENTRY_TITLE}}"`,
          "Seiten: {{PAGE_START}} – {{PAGE_END}}",
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
  ];
}

function bookLevelTemplatesDe(): EntryKiTemplate[] {
  return [
    {
      id: "book-gesamt-zusammenfassen",
      title: "Buch zusammenfassen",
      description: "Gesamtüberblick aus Metadaten und extrahiertem Buch-PDF-Text.",
      template: {
        ziel: `Das Buch „{{ENTRY_TITLE}}" als Ganzes zusammenfassen — auf Basis von Metadaten, Inhalt und PDF-Textextraktion.`,
        kontext: entryKontext("Buch", ["Gesamtüberblick", "PDF-Text", "Edition"]),
        aufgabe: [
          "Kernthese und Aufbau des Werks in 2–4 Absätzen darstellen",
          "Autor, Entstehungskontext und Edition benennen",
          "Aus PDF-Text zentrale Themen und Strukturelemente ableiten",
          "Lücken in der Textextraktion und fehlende Kapitel markieren",
        ],
        ausgabeformat: [
          "- **Gesamtzusammenfassung** (2–4 Absätze)",
          "- **Struktur**: Bullet-Liste der Hauptteile",
          "- **Offene Punkte**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "book-kapitelstruktur",
      title: "Kapitelstruktur planen",
      description: "Untereinträge für Kapitel und Abschnitte vorschlagen.",
      template: {
        ziel: `Eine sinnvolle Untergliederung für das Buch „{{ENTRY_TITLE}}" als Chronikon-Untereinträge entwerfen.`,
        kontext: entryKontext("Buch", ["Kapitel", "Untereinträge", "PDF-Gliederung"]),
        aufgabe: [
          "Vorhandene Untereinträge bewerten und Lücken identifizieren",
          "Aus PDF-Inhaltsverzeichnis oder Textanfang eine Kapitelstruktur ableiten",
          "Je Kapitel: Titel, Seitenbereich, Kurzbeschreibung und Priorität vorschlagen",
        ],
        ausgabeformat: [
          "- **Strukturvorschlag**: nummerierte Liste `Nr. | Titel | Seiten | Kurzinhalt | Priorität`",
          "- **Bereits vorhanden**: Abgleich mit {{CHILD_ENTRIES}}",
        ].join("\n"),
      },
    },
  ];
}

function typeSpecificDe(type: EntryType): EntryKiTemplate | null {
  switch (type) {
    case "text":
      return {
        id: "text-passagen",
        title: "Zentrale Passagen",
        description: "Wichtige Stellen identifizieren und kommentieren.",
        template: {
          ziel: `Zentrale Passagen des Textes „{{ENTRY_TITLE}}" identifizieren und historisch einordnen.`,
          kontext: entryKontext("Text", ["Passagen", "Edition", "Übersetzung"]),
          aufgabe: [
            "5–10 bedeutungstragende Passagen aus PDF-Text und Inhalt auswählen",
            "Je Passage: Kurzkommentar und historische Einordnung",
            "Übersetzungs- oder Editionsvarianten benennen",
          ],
          ausgabeformat: [
            "- **Passagen**: nummerierte Liste mit Zitat und Kommentar",
            "- **Edition/Übersetzung**: kurzer Absatz",
          ].join("\n"),
        },
      };
    default:
      return null;
  }
}

export type EntryKiTemplateContext = {
  parentEntryType?: string | null;
};

function getTemplatesForLanguage(
  type: EntryType,
  lang: EntryLanguageCode,
  context?: EntryKiTemplateContext,
): EntryKiTemplate[] {
  if (isBookSubEntry({ parentEntryType: context?.parentEntryType })) {
    return bookSubEntryTemplatesDe().slice(0, 3);
  }

  if (type === "book" && lang === "de") {
    return bookLevelTemplatesDe().slice(0, 3);
  }

  const primary =
    lang === "en" ? summarizeVerifyEn(type) : summarizeVerifyDe(type);
  const templates: EntryKiTemplate[] = [primary];

  if (lang === "en") {
    templates.push(summarizeInGerman(type));
  }

  const specific = typeSpecificDe(type);
  if (specific && templates.length < 3) {
    templates.push(specific);
  }

  return templates.slice(0, 3);
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

export { buildEntryKiVars, hasOcrContent, isBookSubEntry, entryLanguageLabel, normalizeEntryLanguage };
export type { KiAttachmentInput, KiChildEntryInput, KiTemplateVars };
