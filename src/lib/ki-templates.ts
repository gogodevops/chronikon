import type { EntryType } from "@prisma/client";

import {
  buildEntryKiVars,
  hasOcrContent,
  type KiAttachmentInput,
  type KiChildEntryInput,
  type KiTemplateVars,
} from "@/lib/ki-template-vars";

/** Kurzer Hinweis pro Eintragstyp — was dokumentieren? */
export const ENTRY_TYPE_HINTS: Record<EntryType, string> = {
  book: "Kapitel als Untereinträge anlegen, PDF/OCR-Text anhängen, Ausgabe und Erscheinungsjahr notieren.",
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
  "OCR-Volltext aus Anhängen:",
  "{{OCR_TEXT}}",
  "",
  "Untereinträge:",
  "{{CHILD_ENTRIES}}",
].join("\n");

function entryKontext(typeLabel: string, schwerpunkte: string[]): string {
  return [
    "Du bist Historiker/in mit Expertise in Quellenkritik und historischer Methodik.",
    "",
    "Projekt: {{PROJECT}}",
    `Eintrag: „{{ENTRY_TITLE}}\u201d`,
    `Eintragstyp: ${typeLabel}`,
    `Schwerpunkte: ${schwerpunkte.join(", ")}`,
    "",
    OCR_KONTEXT_BLOCK,
  ].join("\n");
}

const ENTRY_TYPE_KI_TEMPLATES: Record<EntryType, EntryKiTemplate[]> = {
  book: [
    {
      id: "book-zusammenfassung",
      title: "Detaillierte Zusammenfassung",
      description:
        "Vollständige inhaltliche Erfassung mit OCR-Volltext, Kapitelstruktur und Forschungsfragen.",
      template: {
        ziel: "Eine vollständige, fachlich fundierte inhaltliche Erfassung des Buchs „{{ENTRY_TITLE}}\u201d erstellen — auf Basis der Metadaten, des OCR-Volltexts und der Untereinträge.",
        kontext: entryKontext("Buch", [
          "Gesamtüberblick",
          "Kapitelstruktur",
          "OCR-Volltext",
          "Edition",
        ]),
        aufgabe: [
          "Gesamtüberblick: Thema, Forschungsgegenstand, historischer Kontext und zentrale Fragestellung des Werks in 2–3 Absätzen",
          "Kapitelstruktur: vorhandene und fehlende Untereinträge benennen; sinnvolle Gliederung (Teil, Kapitel, Abschnitt) vorschlagen",
          "Kernthesen und Hauptargumente des Autors aus OCR-Text und Eintragsdaten extrahieren",
          "Methodik und Quellenlage des Werks bewerten (Primärquellen, Sekundärliteratur, Editionskritik)",
          "Wichtige Personen, Orte, Ereignisse und Zeitangaben tabellarisch erfassen",
          "Lücken im OCR-Text, fehlende Seiten und unsichere Stellen markieren",
          "Offene Forschungsfragen und empfohlene nächste Arbeitsschritte formulieren",
        ],
        ausgabeformat: [
          "- **Überblick** (2–3 Absätze)",
          "- **Kapitelstruktur**: nummerierte Gliederung mit Kurzinhalt je Abschnitt",
          "- **Kernthesen**: Bullet-Liste mit Fundstelle (Seite/OCR-Abschnitt wenn möglich)",
          "- **Methodik & Quellenlage**: Absatz + Tabelle `Quelle | Typ | Bewertung`",
          "- **Personen/Orte/Ereignisse**: Tabelle `Name | Rolle | Zeitraum | Beleg`",
          "- **OCR-Hinweise**: Bullet-Liste zu Lücken und Unsicherheiten",
          "- **Offene Fragen**: nummerierte Liste",
        ].join("\n"),
      },
    },
    {
      id: "book-metadaten",
      title: "Metadaten & Edition prüfen",
      description: "Ausgabe, Herausgeber, Jahr und bibliografische Angaben vervollständigen.",
      template: {
        ziel: "Bibliografische und editionswissenschaftliche Metadaten für „{{ENTRY_TITLE}}\u201d prüfen und ergänzen.",
        kontext: entryKontext("Buch", ["Edition", "Erscheinungsjahr", "Herausgeber"]),
        aufgabe: [
          "Vorhandene Metadaten (Autor, Titel, Jahr, Sprache, Ausgabe) auf Vollständigkeit prüfen",
          "Fehlende bibliografische Angaben recherchieren und vorschlagen",
          "Überlieferungsgeschichte und Editionsgeschichte kurz skizzieren",
          "Abweichungen zwischen OCR-Text und Metadaten benennen",
          "Empfohlene Standardzitierweise angeben",
        ],
        ausgabeformat: [
          "- **Metadaten-Tabelle**: `Feld | Ist-Wert | Vorschlag | Quelle/Anmerkung`",
          "- **Editionshinweise**: Bullet-Liste",
          "- **Zitierempfehlung**: ein Absatz",
        ].join("\n"),
      },
    },
    {
      id: "book-kapitel",
      title: "Kapitelstruktur planen",
      description: "Untereinträge für Kapitel, Seiten und Abschnitte vorschlagen.",
      template: {
        ziel: "Eine sinnvolle Untergliederung für das Buch „{{ENTRY_TITLE}}\u201d als Chronikon-Untereinträge entwerfen.",
        kontext: entryKontext("Buch", ["Kapitel", "Untereinträge", "OCR-Gliederung"]),
        aufgabe: [
          "Vorhandene Untereinträge bewerten und Lücken identifizieren",
          "Aus OCR-Inhaltsverzeichnis oder Textanfang eine Kapitelstruktur ableiten",
          "Je Kapitel: Titel, Zeitraum, Kurzbeschreibung und Priorität (hoch/mittel/niedrig) vorschlagen",
          "Empfehlung geben, welche Kapitel zuerst als Untereintrag angelegt werden sollten",
        ],
        ausgabeformat: [
          "- **Strukturvorschlag**: nummerierte Liste `Nr. | Titel | Zeitraum | Kurzinhalt | Priorität`",
          "- **Bereits vorhanden**: Abgleich mit {{CHILD_ENTRIES}}",
          "- **Nächste Schritte**: Checkliste",
        ].join("\n"),
      },
    },
  ],
  text: [
    {
      id: "text-analyse",
      title: "Textanalyse & Einordnung",
      description: "Quelle, Edition, Übersetzung und zentrale Passagen auswerten.",
      template: {
        ziel: "Den Text „{{ENTRY_TITLE}}\u201d quellenkritisch analysieren und historisch einordnen.",
        kontext: entryKontext("Text", ["Quelle", "Edition", "Übersetzung", "Zitate"]),
        aufgabe: [
          "Quellenangabe und Überlieferungskontext prüfen und vervollständigen",
          "Edition, Übersetzung und Sprache fachlich einordnen",
          "Zentrale Passagen aus OCR-Text und Eintragsinhalt identifizieren",
          "Lesarten, Übersetzungsvarianten und interpretatorische Knackpunkte benennen",
          "Vergleichbare Texte oder Parallelen im Projekt vorschlagen",
        ],
        ausgabeformat: [
          "- **Quellenangabe**: Tabelle `Feld | Inhalt`",
          "- **Einordnung**: 1–2 Absätze",
          "- **Zentrale Passagen**: nummerierte Liste mit Zitat und Kommentar",
          "- **Offene Fragen**: Bullet-Liste",
        ].join("\n"),
      },
    },
    {
      id: "text-vergleich",
      title: "Übersetzungsvergleich",
      description: "Varianten und Abweichungen zwischen Editionen oder Übersetzungen.",
      template: {
        ziel: "Übersetzungs- und Editionsunterschiede für „{{ENTRY_TITLE}}\u201d systematisch erfassen.",
        kontext: entryKontext("Text", ["Vergleich", "Varianten", "OCR"]),
        aufgabe: [
          "Alle verfügbaren Textzeugen aus OCR und Metadaten erfassen",
          "Bedeutungstragende Abweichungen zwischen Fassungen identifizieren",
          "Auswirkungen auf Interpretation erläutern",
          "Empfehlung für bevorzugte Lesart begründen",
        ],
        ausgabeformat: [
          "- **Vergleichstabelle**: `Stelle | Fassung A | Fassung B | Bewertung`",
          "- **Interpretation**: Bullet-Liste",
        ].join("\n"),
      },
    },
  ],
  person: [
    {
      id: "person-biographie",
      title: "Biographie & Netzwerk",
      description: "Lebensdaten, Rolle, Quellen und historisches Umfeld.",
      template: {
        ziel: "Eine fundierte biographische Skizze und Netzwerkanalyse für „{{ENTRY_TITLE}}\u201d erstellen.",
        kontext: entryKontext("Person", ["Biographie", "Rolle", "Primärquellen"]),
        aufgabe: [
          "Lebensdaten, Herkunft und sozialen Kontext präzisieren",
          "Historische Rolle und Bedeutung im Projektzeitraum darstellen",
          "Primär- und Sekundärquellen zur Person benennen und bewerten",
          "Netzwerk (Personen, Orte, Institutionen) skizzieren",
          "Umstrittene oder unsichere Angaben mit Confidence markieren",
        ],
        ausgabeformat: [
          "- **Biographie**: strukturierter Absatz (Herkunft, Wirken, Tod)",
          "- **Quellen**: Tabelle `Quelle | Typ | Verlässlichkeit`",
          "- **Netzwerk**: Tabelle `Kontakt | Beziehung | Zeitraum`",
          "- **Unsicherheiten**: Bullet-Liste",
        ].join("\n"),
      },
    },
    {
      id: "person-quellen",
      title: "Quellenlage prüfen",
      description: "Belege, Lücken und Forschungsstand zur Person.",
      template: {
        ziel: "Die Quellenlage zu „{{ENTRY_TITLE}}\u201d kritisch prüfen.",
        kontext: entryKontext("Person", ["Quellenkritik", "Belege"]),
        aufgabe: [
          "Alle im Eintrag und OCR genannten Belege sammeln",
          "Primär- vs. Sekundärquellen unterscheiden",
          "Lücken und Widersprüche in der Überlieferung benennen",
          "Forschungsliteratur und offene Debatten skizzieren",
        ],
        ausgabeformat: [
          "- **Quellenübersicht**: nummerierte Liste mit Typ und Bewertung",
          "- **Lücken**: Bullet-Liste",
          "- **Empfohlene Recherche**: Checkliste",
        ].join("\n"),
      },
    },
  ],
  place: [
    {
      id: "place-analyse",
      title: "Ortsanalyse & Geschichte",
      description: "Geografie, Namensvarianten und historische Ereignisse.",
      template: {
        ziel: "Den Ort „{{ENTRY_TITLE}}\u201d geografisch und historisch umfassend einordnen.",
        kontext: entryKontext("Ort", ["Koordinaten", "Namensvarianten", "Ereignisse"]),
        aufgabe: [
          "Historische und moderne Namensvarianten sammeln",
          "Geografische, politische und kulturelle Einordnung liefern",
          "Relevante Ereignisse und Personen am Ort chronologisch darstellen",
          "Koordinaten und Grenzverschiebungen über die Zeit prüfen",
          "Bezüge zu anderen Orten und Einträgen im Projekt nennen",
        ],
        ausgabeformat: [
          "- **Ortsdaten**: Tabelle `Feld | Wert | Zeitraum`",
          "- **Namensvarianten**: Bullet-Liste",
          "- **Chronologie am Ort**: nummerierte Liste",
          "- **Verknüpfungen**: Bullet-Liste",
        ].join("\n"),
      },
    },
  ],
  discovery: [
    {
      id: "discovery-bewertung",
      title: "Fundbewertung & Publikation",
      description: "Fundkontext, Datierung, Edition und Forschungsgeschichte.",
      template: {
        ziel: "Den Fund „{{ENTRY_TITLE}}\u201d wissenschaftlich bewerten und dokumentieren.",
        kontext: entryKontext("Fund", ["Fundort", "Datierung", "Publikation"]),
        aufgabe: [
          "Fundumstände, Fundort und Aufbewahrungsort beschreiben",
          "Datierung und methodische Grundlagen bewerten",
          "Publikationen, Ausstellungen und Inventarnummern erfassen",
          "Forschungsgeschichte und kontroverse Deutungen skizzieren",
          "Offene Datierungs- oder Zuschreibungsfragen formulieren",
        ],
        ausgabeformat: [
          "- **Funddaten**: Tabelle `Aspekt | Angabe | Sicherheit`",
          "- **Publikationen**: nummerierte Liste",
          "- **Forschungsgeschichte**: kurzer Absatz",
          "- **Offene Fragen**: Bullet-Liste",
        ].join("\n"),
      },
    },
  ],
  note: [
    {
      id: "note-struktur",
      title: "Notiz strukturieren",
      description: "Gedankengang ordnen, Hypothesen ableiten, nächste Schritte planen.",
      template: {
        ziel: "Die Forschungsnotiz „{{ENTRY_TITLE}}\u201d strukturieren und in überprüfbare Arbeitsschritte überführen.",
        kontext: entryKontext("Notiz", ["Hypothesen", "Gedankengang", "Recherche"]),
        aufgabe: [
          "Kernargumente und Gedankengang in logischer Reihenfolge darstellen",
          "Überprüfbare Hypothesen mit Confidence-Stufe formulieren",
          "Bezüge zu anderen Einträgen, Quellen und OCR-Material herstellen",
          "Priorisierte nächste Recherche-Schritte vorschlagen",
        ],
        ausgabeformat: [
          "- **Kernpunkte**: Bullet-Liste",
          "- **Hypothesen**: Tabelle `Hypothese | Confidence | Prüfweg`",
          "- **Verknüpfungen**: Bullet-Liste",
          "- **Nächste Schritte**: Checkliste",
        ].join("\n"),
      },
    },
    {
      id: "note-behauptungen",
      title: "Behauptungen extrahieren",
      description: "Überprüfbare Aussagen aus der Notiz ziehen.",
      template: {
        ziel: "Aus der Notiz „{{ENTRY_TITLE}}\u201d überprüfbare Behauptungen für das Projekt extrahieren.",
        kontext: entryKontext("Notiz", ["Behauptungen", "Belege"]),
        aufgabe: [
          "Jede überprüfbare Aussage als klaren Satz formulieren",
          "Beleg oder Begründung angeben — oder als unbelegt markieren",
          "Confidence zuordnen: gesichert / vermutlich / streitig / unbekannt",
          "Gegenargumente und offene Punkte nennen",
        ],
        ausgabeformat: [
          "- **Behauptungen**: Tabelle `Aussage | Beleg | Confidence`",
          "- **Offene Punkte**: nummerierte Liste",
        ].join("\n"),
      },
    },
  ],
};

/** Projektweite Vorlagen — nach ZIP-Export in externe KI einfügen */
export const PROJECT_KI_TEMPLATES: KiTemplate[] = [
  {
    id: "quellenkritik",
    category: "Quellenanalyse",
    title: "Quellenkritik",
    description: "Quellen eines Ober-Themas bewerten und vergleichen.",
    template: {
      ziel: "Die Quellenlage des Projekts „{{PROJECT}}\u201d systematisch bewerten und Lücken identifizieren.",
      kontext: [
        "Du bist Historiker/in.",
        "",
        "Projekt: {{PROJECT}}",
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
    id: "chronologie",
    category: "Chronologie",
    title: "Chronologie prüfen",
    description: "Zeitliche Abfolge und Datierungen prüfen.",
    template: {
      ziel: "Die chronologische Konsistenz aller Einträge in „{{PROJECT}}\u201d prüfen.",
      kontext: [
        "Du bist Historiker/in.",
        "",
        "Projekt: {{PROJECT}}",
        "Material aus Chronikon (ZIP mit entries/ und ocr/):",
        "{{ENTRIES}}",
      ].join("\n"),
      aufgabe: [
        "Zeitliche Abfolge der Ereignisse und Einträge darstellen",
        "Widersprüchliche Datierungen markieren",
        "Unsichere Daten als „vermutlich\u201d kennzeichnen",
        "Fehlende Zwischenereignisse vorschlagen",
      ],
      ausgabeformat: [
        "- **Zeitstrahl**: chronologische Bullet-Liste mit Jahr/Spanne",
        "- **Widersprüche**: Tabelle `Eintrag A | Eintrag B | Konflikt`",
        "- **Unsichere Daten**: Bullet-Liste mit Begründung",
      ].join("\n"),
    },
  },
  {
    id: "vergleich",
    category: "Vergleich",
    title: "Texte vergleichen",
    description: "Übersetzungen oder Editionen nebeneinanderstellen.",
    template: {
      ziel: "Texte und Editionen in „{{PROJECT}}\u201d vergleichen und Varianten erklären.",
      kontext: [
        "Du bist Historiker/in und Textwissenschaftler/in.",
        "",
        "Projekt: {{PROJECT}}",
        "Material aus Chronikon (ZIP mit OCR-Volltexten):",
        "{{ENTRIES}}",
      ].join("\n"),
      aufgabe: [
        "Gemeinsamkeiten und Abweichungen identifizieren",
        "Übersetzungs- bzw. Editionsunterschiede erklären",
        "Bedeutungstragende Varianten hervorheben",
        "Folgen für die Interpretation benennen",
      ],
      ausgabeformat: [
        "- **Vergleichstabelle**: `Aspekt | Text A | Text B | Bewertung`",
        "- **Varianten**: nummerierte Liste mit Zitat",
        "- **Interpretation**: kurze Bullet-Liste",
      ].join("\n"),
    },
  },
  {
    id: "zusammenfassung",
    category: "Zusammenfassung",
    title: "Forschungsstand zusammenfassen",
    description: "Überblick über das gesamte Ober-Thema erstellen.",
    template: {
      ziel: "Den Forschungsstand von „{{PROJECT}}\u201d in verständlicher Form zusammenfassen.",
      kontext: [
        "Du bist Historiker/in.",
        "",
        "Projekt: {{PROJECT}}",
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
      ziel: "Überprüfbare Behauptungen aus „{{PROJECT}}\u201d extrahieren und bewerten.",
      kontext: [
        "Du bist Historiker/in.",
        "",
        "Projekt: {{PROJECT}}",
        "Material aus Chronikon (ZIP mit Einträgen und OCR):",
        "{{ENTRIES}}",
      ].join("\n"),
      aufgabe: [
        "Jede Behauptung als klaren Satz formulieren",
        "Beleg in den Quellen angeben oder als „unbelegt\u201d markieren",
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

export function getEntryKiTemplates(type: EntryType): EntryKiTemplate[] {
  return ENTRY_TYPE_KI_TEMPLATES[type];
}

export function getEntryKiTemplate(
  type: EntryType,
  templateId: string,
): EntryKiTemplate | undefined {
  return ENTRY_TYPE_KI_TEMPLATES[type].find((template) => template.id === templateId);
}

export function renderEntryKiPrompt(
  type: EntryType,
  templateId: string,
  vars: KiTemplateVars,
): string {
  const definition = getEntryKiTemplate(type, templateId);
  if (!definition) return "";
  return fillKiTemplate(renderKiTemplate(definition.template), vars);
}

/** KI-Prompt für einen einzelnen Eintrag (Standard-Vorlage des Typs) */
export function getEntryTypeKiPrompt(
  type: EntryType,
  input: {
    project: string;
    entryTitle: string;
    entryMarkdown: string;
    attachments?: KiAttachmentInput[];
    childEntries?: KiChildEntryInput[];
    templateId?: string;
  },
): string {
  const templates = getEntryKiTemplates(type);
  const templateId = input.templateId ?? templates[0]?.id;
  if (!templateId) return "";

  const vars = buildEntryKiVars({
    project: input.project,
    entryTitle: input.entryTitle,
    entryMarkdown: input.entryMarkdown,
    attachments: input.attachments,
    childEntries: input.childEntries,
  });

  return renderEntryKiPrompt(type, templateId, vars);
}

export function getEntryTypeKiTemplate(
  type: EntryType,
  templateId?: string,
): UnifiedKiTemplate | undefined {
  const templates = getEntryKiTemplates(type);
  const definition = templateId
    ? templates.find((template) => template.id === templateId)
    : templates[0];
  return definition?.template;
}

/** Typ-spezifische Projekt-Vorlage (Bulk-Analyse für einen Eintragstyp) */
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
    ziel: `Alle ${typeLabel} im Projekt „{{PROJECT}}\u201d analysieren und strukturieren.`,
    kontext: [
      "Du bist Historiker/in.",
      "",
      "Projekt: {{PROJECT}}",
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

export { buildEntryKiVars, hasOcrContent };
export type { KiAttachmentInput, KiChildEntryInput, KiTemplateVars };
