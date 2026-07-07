import type { EntryType } from "@prisma/client";

/** Kurzer Hinweis pro Eintragstyp — was dokumentieren? */
export const ENTRY_TYPE_HINTS: Record<EntryType, string> = {
  book: "Kapitel als Untereinträge anlegen, PDF/OCR-Text anhängen, Ausgabe und Erscheinungsjahr notieren.",
  text: "Quelle, Übersetzung und Edition festhalten — ideal für Vergleiche und Zitate.",
  person: "Lebensdaten, historische Rolle und belegende Quellen erfassen.",
  place: "Koordinaten, historischer Name und zeitliche Zuordnung dokumentieren.",
  discovery: "Fundort, Datierung, Fundumstände und Publikation festhalten.",
  note: "Freie Recherche-Notiz — Gedanken, Hypothesen und offene Fragen.",
};

export type KiTemplate = {
  id: string;
  category: string;
  title: string;
  description: string;
  /** Platzhalter: {{PROJECT}}, {{ENTRIES}}, {{ENTRY_TYPE}} */
  prompt: string;
};

/** Projektweite Vorlagen — nach ZIP-Export in externe KI einfügen */
export const PROJECT_KI_TEMPLATES: KiTemplate[] = [
  {
    id: "quellenkritik",
    category: "Quellenanalyse",
    title: "Quellenkritik",
    description: "Quellen eines Ober-Themas bewerten und vergleichen.",
    prompt: `Du bist Historiker/in. Analysiere die Quellen des Forschungsprojekts „{{PROJECT}}".

Die folgenden Einträge und OCR-Texte stammen aus Chronikon (ZIP-Export):

{{ENTRIES}}

Bitte:
1. Primär- vs. Sekundärquellen unterscheiden
2. Überlieferungsgeschichte skizzieren
3. Verlässlichkeit und Lücken benennen
4. Offene Fragen formulieren`,
  },
  {
    id: "chronologie",
    category: "Chronologie",
    title: "Chronologie prüfen",
    description: "Zeitliche Abfolge und Datierungen prüfen.",
    prompt: `Du bist Historiker/in. Prüfe die Chronologie im Projekt „{{PROJECT}}".

Material aus Chronikon:

{{ENTRIES}}

Bitte:
1. Zeitliche Abfolge der Ereignisse/Einträge darstellen
2. Widersprüchliche Datierungen markieren
3. Unsichere Daten als „vermutlich" kennzeichnen
4. Fehlende Zwischenereignisse vorschlagen`,
  },
  {
    id: "vergleich",
    category: "Vergleich",
    title: "Texte vergleichen",
    description: "Übersetzungen oder Editionen nebeneinanderstellen.",
    prompt: `Du bist Historiker/in und Textwissenschaftler/in. Vergleiche die Texte im Projekt „{{PROJECT}}".

{{ENTRIES}}

Bitte:
1. Gemeinsamkeiten und Abweichungen tabellarisch
2. Übersetzungs- bzw. Editionsunterschiede erklären
3. Bedeutungstragende Varianten hervorheben`,
  },
  {
    id: "zusammenfassung",
    category: "Zusammenfassung",
    title: "Kapitel zusammenfassen",
    description: "Überblick über den Forschungsstand erstellen.",
    prompt: `Du bist Historiker/in. Fasse das Wissen aus „{{PROJECT}}" zusammen.

{{ENTRIES}}

Bitte:
1. Kernthese in 3–5 Sätzen
2. Wichtigste Personen, Orte, Texte
3. Gesicherter vs. spekulativer Stand
4. Empfohlene nächste Recherche-Schritte`,
  },
  {
    id: "behauptungen",
    category: "Analyse",
    title: "Behauptungen extrahieren",
    description: "Überprüfbare Aussagen aus dem Material ziehen.",
    prompt: `Du bist Historiker/in. Extrahiere überprüfbare Behauptungen aus „{{PROJECT}}".

{{ENTRIES}}

Bitte:
1. Jede Behauptung als Satz formulieren
2. Beleg in den Quellen angeben (oder „unbelegt")
3. Confidence: gesichert / vermutlich / streitig / unbekannt
4. Gegenargumente oder offene Punkte nennen`,
  },
];

const ENTRY_TYPE_PROMPTS: Record<EntryType, string> = {
  book: `Du bist Historiker/in. Hilf mir beim Buch-Eintrag „{{ENTRY_TITLE}}" im Projekt „{{PROJECT}}".

Typ: Buch — Kapitel als Untereinträge, OCR-Text, Ausgabe/Jahr.

Eintrag (Markdown):
{{ENTRY}}

Bitte:
1. Fehlende Metadaten (Ausgabe, Jahr, Herausgeber) vorschlagen
2. Sinnvolle Kapitelstruktur für Untereinträge vorschlagen
3. Offene Fragen zur Überlieferung formulieren`,

  text: `Du bist Historiker/in. Hilf mir beim Text-Eintrag „{{ENTRY_TITLE}}" im Projekt „{{PROJECT}}".

Typ: Text — Quelle, Übersetzung, Edition.

Eintrag (Markdown):
{{ENTRY}}

Bitte:
1. Quellenangabe prüfen und vervollständigen
2. Edition/Übersetzung einordnen
3. Zentrale Passagen oder Lesarten hervorheben`,

  person: `Du bist Historiker/in. Hilf mir bei der Person „{{ENTRY_TITLE}}" im Projekt „{{PROJECT}}".

Typ: Person — Lebensdaten, Rolle, Quellen.

Eintrag (Markdown):
{{ENTRY}}

Bitte:
1. Lebensdaten und Rolle präzisieren
2. Primärquellen zur Person nennen
3. Zeitliche Einordnung und Netzwerk skizzieren`,

  place: `Du bist Historiker/in. Hilf mir beim Ort „{{ENTRY_TITLE}}" im Projekt „{{PROJECT}}".

Typ: Ort — Koordinaten, historischer Name.

Eintrag (Markdown):
{{ENTRY}}

Bitte:
1. Historische Namensvarianten sammeln
2. Geografische und politische Einordnung
3. Relevante Ereignisse am Ort`,

  discovery: `Du bist Historiker/in. Hilf mir beim Fund „{{ENTRY_TITLE}}" im Projekt „{{PROJECT}}".

Typ: Fund — Fundort, Datierung, Publikation.

Eintrag (Markdown):
{{ENTRY}}

Bitte:
1. Fundkontext und Datierung bewerten
2. Publikationen und Museen nennen
3. Forschungsgeschichte kurz skizzieren`,

  note: `Du bist Historiker/in. Hilf mir bei der Notiz „{{ENTRY_TITLE}}" im Projekt „{{PROJECT}}".

Typ: Notiz — freie Recherche.

Eintrag (Markdown):
{{ENTRY}}

Bitte:
1. Gedankengang strukturieren
2. Überprüfbare Hypothesen ableiten
3. Nächste Recherche-Schritte vorschlagen`,
};

export function fillKiTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

/** KI-Prompt für einen einzelnen Eintrag (nach Typ) */
export function getEntryTypeKiPrompt(
  type: EntryType,
  vars: { project: string; entryTitle: string; entryMarkdown: string },
): string {
  return fillKiTemplate(ENTRY_TYPE_PROMPTS[type], {
    PROJECT: vars.project,
    ENTRY_TITLE: vars.entryTitle,
    ENTRY: vars.entryMarkdown,
  });
}

/** Typ-spezifische Projekt-Vorlage (Bulk-Analyse für einen Eintragstyp) */
export function getProjectTypeKiPrompt(
  type: EntryType,
  projectName: string,
): string {
  const typeLabel = {
    book: "Bücher",
    text: "Texte",
    person: "Personen",
    place: "Orte",
    discovery: "Funde",
    note: "Notizen",
  }[type];

  return fillKiTemplate(
    `Du bist Historiker/in. Analysiere alle {{ENTRY_TYPE}} im Projekt „{{PROJECT}}".

Die Einträge und OCR-Texte stammen aus dem Chronikon-ZIP-Export (Ordner entries/ und ocr/).

{{ENTRIES}}

Bitte fokussiere auf ${ENTRY_TYPE_HINTS[type]}`,
    {
      PROJECT: projectName,
      ENTRY_TYPE: typeLabel,
      ENTRIES:
        "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren)",
    },
  );
}

export function getProjectKiTemplate(id: string): KiTemplate | undefined {
  return PROJECT_KI_TEMPLATES.find((t) => t.id === id);
}
