import type { EntryType } from "@prisma/client";

/** Kurzer Hinweis pro Eintragstyp — was dokumentieren? */
export const ENTRY_TYPE_HINTS: Record<EntryType, string> = {
  book: "Buch anlegen: Titel, Autor, Erscheinungsjahr (Druckjahr, n. Chr.) und den historischen Zeitraum von/bis (v. Chr. oder n. Chr.). PDF danach unter Material hochladen.",
  text: "Text oder Ereignis anlegen (Bezeichnung, Zeitraum), Quelle/PDF unter Material hochladen.",
  person: "Person anlegen — Name Pflicht. Lebensdaten optional: Jahr, Monat, Tag (v. Chr./n. Chr.). Quellen unter Material ergänzen.",
  place: "Ort anlegen (Name, Koordinaten), historischen Kontext und Quellen nach und nach ergänzen.",
  discovery: "Fund anlegen, Fundort und Datierung erfassen — Material und Quellen unter Material hinzufügen.",
  note: "Notiz anlegen und Gedanken strukturieren — Quellen und PDFs können später ergänzt werden.",
};
