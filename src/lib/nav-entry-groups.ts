import type { EntryListItem } from "@/components/layout/nav-panel";

export type NavTypeSectionId =
  | "book"
  | "person"
  | "place"
  | "text"
  | "discovery"
  | "note";

export const NAV_TYPE_SECTION_ORDER: NavTypeSectionId[] = [
  "book",
  "person",
  "place",
  "text",
  "discovery",
  "note",
];

export const NAV_TYPE_SECTION_LABELS: Record<NavTypeSectionId, string> = {
  book: "Bücher",
  person: "Personen",
  place: "Orte",
  text: "Texte",
  discovery: "Funde",
  note: "Notizen",
};

export type NavBookGroup = {
  kind: "book";
  book: EntryListItem;
  children: EntryListItem[];
};

export type NavFlatEntry = {
  kind: "entry";
  entry: EntryListItem;
};

export type NavTypeSection = {
  typeId: NavTypeSectionId;
  label: string;
  color?: string;
  items: Array<NavBookGroup | NavFlatEntry>;
  count: number;
};

function buildBookGroups(books: EntryListItem[], allEntries: EntryListItem[]) {
  const childrenByBook = new Map<string, EntryListItem[]>();
  for (const entry of allEntries) {
    if (entry.parentEntryId) {
      const siblings = childrenByBook.get(entry.parentEntryId) ?? [];
      siblings.push(entry);
      childrenByBook.set(entry.parentEntryId, siblings);
    }
  }

  return books.map((book) => ({
    kind: "book" as const,
    book,
    children: childrenByBook.get(book.id) ?? [],
  }));
}

/** Gruppiert Einträge nach Typ für die Sidebar — Kapitel bleiben unter Büchern. */
export function buildNavTypeSections(
  entries: EntryListItem[],
  typeColors: Record<string, string | undefined> = {},
  activeTypes?: Set<string>,
): NavTypeSection[] {
  const topLevel = entries.filter((e) => !e.parentEntryId);
  const sections: NavTypeSection[] = [];

  for (const typeId of NAV_TYPE_SECTION_ORDER) {
    if (activeTypes && activeTypes.size > 0 && !activeTypes.has(typeId)) {
      continue;
    }

    if (typeId === "book") {
      const books = topLevel.filter((e) => e.type === "book");
      if (books.length === 0) continue;
      const items = buildBookGroups(books, entries);
      sections.push({
        typeId,
        label: NAV_TYPE_SECTION_LABELS.book,
        color: typeColors.book,
        items,
        count: books.length,
      });
      continue;
    }

    const ofType = topLevel.filter((e) => e.type === typeId);
    if (ofType.length === 0) continue;

    sections.push({
      typeId,
      label: NAV_TYPE_SECTION_LABELS[typeId],
      color: typeColors[typeId],
      items: ofType.map((entry) => ({ kind: "entry" as const, entry })),
      count: ofType.length,
    });
  }

  return sections;
}
