import type {
  Confidence,
  Entry,
  EntryRelation,
  RelationType,
  Source,
} from "@prisma/client";

import { RELATION_LABELS } from "@/lib/constants";
import { extractWikiLinks } from "@/lib/markdown";

export type KiCheckAction =
  | {
      type: "create_relation";
      fromEntryId: string;
      toEntryId: string;
      relationType: RelationType;
    }
  | { type: "swap_years"; entryId: string }
  | { type: "set_confidence"; entryId: string; confidence: Confidence }
  | { type: "append_body"; entryId: string; text: string };

export type KiCheck = {
  id: string;
  title: string;
  text: string;
  detail?: string;
  action?: KiCheckAction;
};

type EntryWithRelations = Entry & {
  sources?: Source[];
  relationsFrom?: EntryRelation[];
  relationsTo?: EntryRelation[];
};

function hasRelation(
  relations: EntryRelation[],
  fromId: string,
  toId: string,
  type?: RelationType,
): boolean {
  return relations.some(
    (r) =>
      ((r.fromEntryId === fromId && r.toEntryId === toId) ||
        (r.fromEntryId === toId && r.toEntryId === fromId)) &&
      (!type || r.type === type),
  );
}

function resolveEntryByLabel(
  label: string,
  projectEntries: Entry[],
  excludeId: string,
): Entry | undefined {
  const q = label.toLowerCase();
  return projectEntries.find(
    (e) =>
      e.id !== excludeId &&
      (e.title.toLowerCase().includes(q) ||
        q.includes(e.title.toLowerCase()) ||
        e.id === q),
  );
}

export function generateKiChecks(
  entry: EntryWithRelations,
  projectEntries: Entry[],
): KiCheck[] {
  const checks: KiCheck[] = [];
  const others = projectEntries.filter((e) => e.id !== entry.id);
  const allRelations = [
    ...(entry.relationsFrom ?? []),
    ...(entry.relationsTo ?? []),
  ];
  const norwich = others.find((e) => /norwich.*byzanz/i.test(e.title));
  const prokop = others.find((e) => /prokop/i.test(e.title));

  if (/prokop/i.test(entry.title) && norwich) {
    if (!hasRelation(allRelations, norwich.id, entry.id, "based_on")) {
      checks.push({
        id: "rel-norwich-prokop",
        title: "Verknüpfung anlegen",
        text: `„${norwich.title}" basiert laut Notiz auf Primärquellen. Soll „${entry.title}" verknüpft werden?`,
        detail: "Relation: Norwich → basiert auf → Prokop",
        action: {
          type: "create_relation",
          fromEntryId: norwich.id,
          toEntryId: entry.id,
          relationType: "based_on",
        },
      });
    }
  }

  if (/norwich|byzanz/i.test(entry.title) && prokop && entry.id !== prokop.id) {
    if (!hasRelation(allRelations, entry.id, prokop.id, "based_on")) {
      checks.push({
        id: "rel-prokop-norwich",
        title: "Quellenkette ergänzen",
        text: `„${prokop.title}" existiert bereits. In der Norwich-Notiz fehlt noch die explizite Verknüpfung.`,
        detail: "Ergänzt Verknüpfung + Forschungsnotiz",
        action: {
          type: "create_relation",
          fromEntryId: entry.id,
          toEntryId: prokop.id,
          relationType: "based_on",
        },
      });
    }
  }

  if (/thomas|evangelium/i.test(entry.title)) {
    const nag = others.find((e) => /nag hammadi/i.test(e.title || e.placeName || ""));
    if (nag && !hasRelation(allRelations, entry.id, nag.id, "found_at")) {
      checks.push({
        id: "rel-thomas-nag",
        title: "Fundort verknüpfen",
        text: `Text „${entry.title}" — soll er mit „${nag.title}" verknüpft werden?`,
        action: {
          type: "create_relation",
          fromEntryId: entry.id,
          toEntryId: nag.id,
          relationType: "found_at",
        },
      });
    }
  }

  for (const label of extractWikiLinks(entry.body)) {
    const target = resolveEntryByLabel(label, others, entry.id);
    if (!target) continue;

    const relType: RelationType = ["book", "text"].includes(target.type)
      ? "based_on"
      : "discusses";

    if (hasRelation(allRelations, entry.id, target.id, relType)) continue;

    const checkId = `wiki-${entry.id}-${target.id}-${relType}`;
    if (checks.some((c) => c.id === checkId)) continue;

    checks.push({
      id: checkId,
      title: "Wiki-Link → Relation",
      text: `Im Inhalt steht [[${label}]] — soll eine Verknüpfung zu „${target.title}" angelegt werden?`,
      detail: `Relation: ${RELATION_LABELS[relType]}`,
      action: {
        type: "create_relation",
        fromEntryId: entry.id,
        toEntryId: target.id,
        relationType: relType,
      },
    });
  }

  if (entry.yearStart > entry.yearEnd) {
    checks.push({
      id: "fix-years",
      title: "Zeitraum korrigieren",
      text: '„Von" ist größer als „bis" — das wirkt wie ein Tippfehler.',
      action: { type: "swap_years", entryId: entry.id },
    });
  }

  const sourceCount = entry.sources?.length ?? 0;
  if (sourceCount === 0 && entry.confidence === "verified") {
    checks.push({
      id: "fix-confidence",
      title: "Confidence anpassen",
      text: 'Als „gesichert" markiert, aber keine Quelle angegeben.',
      action: {
        type: "set_confidence",
        entryId: entry.id,
        confidence: "likely",
      },
    });
  }

  return checks;
}
