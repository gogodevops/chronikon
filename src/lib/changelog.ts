export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  items: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.1.0",
    date: "2026-07",
    title: "Chronikon MVP",
    items: [
      "Ober-Themen (Projekte) mit Team-Rollen und Einladungen",
      "Einträge, Timeline, Karte, Tabelle und Graph",
      "Diskussionen, Behauptungen und Quellen",
      "KI-Review für Einträge",
      "Einladungsbasierte Registrierung",
      "System-Übersicht für App-Administratoren",
      "Schwarz-Weiß- / Farb-Umschalter auf der Karte",
      "Ober-Themen löschen (Owner oder Admin)",
      "Einklappbare Versionshistorie im Historie-Tab",
    ],
  },
];
