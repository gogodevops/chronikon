import type { Confidence, EntryType, RelationType } from "@prisma/client";

export const LIST_LIMIT = 10;

export const TYPE_META: Record<
  EntryType,
  { label: string; color: string }
> = {
  text: { label: "Text", color: "#4caf82" },
  book: { label: "Buch", color: "#5b8def" },
  person: { label: "Person", color: "#e8945a" },
  place: { label: "Ort", color: "#e05a5a" },
  discovery: { label: "Fund", color: "#a78bfa" },
  note: { label: "Notiz", color: "#78b4c4" },
};

export const CONF_META: Record<
  Confidence,
  { label: string; color: string }
> = {
  verified: { label: "Gesichert", color: "#4caf82" },
  likely: { label: "Vermutlich", color: "#7a9ec8" },
  disputed: { label: "Streitig", color: "#e8945a" },
  unknown: { label: "Unbekannt", color: "#8a8478" },
};

export const RELATION_LABELS: Record<RelationType, string> = {
  found_at: "gefunden in",
  discovered_in: "entdeckt bei",
  edited_in: "ediert in",
  discussed_in: "diskutiert in",
  translated_in: "übersetzt in",
  located_at: "liegt in",
  authored: "verfasst von",
  associated_with: "verbunden mit",
  founded: "gründete",
  ruled_in: "herrschte in",
  contemporary: "zeitgenössisch",
  based_on: "basiert auf",
  discusses: "behandelt",
  cited_in: "zitiert in",
  contradicts: "widerspricht",
};

export const TOPICS: Record<string, string[]> = {
  bibel: [
    "Apokryphen",
    "Kanon",
    "Funde & Editionen",
    "Übersetzungen",
    "Personen & Orte",
  ],
  byzanz: ["Kaiser", "Kirchengeschichte", "Quellen", "Schlachten", "Orte"],
  osmanen: ["Sultane", "Eroberungen", "Quellen", "Orte", "Nachfolge"],
};

export const SOURCE_TYPE_LABELS = {
  primary: "Primärquelle",
  secondary: "Sekundärquelle",
  tertiary: "Tertiärquelle",
} as const;

export const PROJECT_ROLE_RANK = {
  owner: 4,
  editor: 3,
  commenter: 2,
  viewer: 1,
} as const;

export const ROLE_META: Record<
  keyof typeof PROJECT_ROLE_RANK,
  {
    label: string;
    short: string;
    description: string;
    canRead: boolean;
    canWrite: boolean;
    canDiscuss: boolean;
    canManageTeam: boolean;
  }
> = {
  owner: {
    label: "Admin",
    short: "Admin",
    description: "Voller Zugriff inkl. Team-Verwaltung",
    canRead: true,
    canWrite: true,
    canDiscuss: true,
    canManageTeam: true,
  },
  editor: {
    label: "Bearbeiter",
    short: "Schreiben",
    description: "Einträge lesen und bearbeiten",
    canRead: true,
    canWrite: true,
    canDiscuss: true,
    canManageTeam: false,
  },
  commenter: {
    label: "Kommentator",
    short: "Diskutieren",
    description: "Lesen und Fragen/Kommentare",
    canRead: true,
    canWrite: false,
    canDiscuss: true,
    canManageTeam: false,
  },
  viewer: {
    label: "Leser",
    short: "Lesen",
    description: "Nur Lesen, keine Änderungen",
    canRead: true,
    canWrite: false,
    canDiscuss: false,
    canManageTeam: false,
  },
};

export const PROJECT_ROLES = ["owner", "editor", "commenter", "viewer"] as const;
