import type { Confidence, EntryType, Prisma } from "@prisma/client";
import { z } from "zod";

import { sortBookChildren } from "@/lib/entry-hierarchy";

const entryTypeSchema = z.enum([
  "book",
  "text",
  "person",
  "place",
  "discovery",
  "note",
]);

const confidenceSchema = z.enum(["verified", "likely", "disputed", "unknown"]);

export const entryFilterParamsSchema = z.object({
  q: z.string().optional(),
  topic: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([entryTypeSchema, z.array(entryTypeSchema)]).optional(),
  confidence: z.union([confidenceSchema, z.array(confidenceSchema)]).optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  hasQuestions: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
  sourcesMax: z.coerce.number().optional(),
  savedView: z.string().optional(),
});

export type EntryFilterParams = z.infer<typeof entryFilterParamsSchema>;

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseBool(value: unknown): boolean | undefined {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

export function parseEntryFilterParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): EntryFilterParams {
  const raw: Record<string, string | string[] | undefined> =
    searchParams instanceof URLSearchParams
      ? Object.fromEntries(searchParams.entries())
      : searchParams;

  return entryFilterParamsSchema.parse({
    q: raw.q,
    topic: raw.topic,
    type: raw.type,
    confidence: raw.confidence,
    yearMin: raw.yearMin,
    yearMax: raw.yearMax,
    hasQuestions: raw.hasQuestions,
    sourcesMax: raw.sourcesMax,
    savedView: raw.savedView,
  });
}

function buildTypeFilter(types: EntryType[]): Prisma.EntryWhereInput | undefined {
  if (!types.length) return undefined;

  const conditions: Prisma.EntryWhereInput[] = [];
  const hasBook = types.includes("book");
  const hasText = types.includes("text");

  if (hasBook) {
    conditions.push({ type: "book" });
    conditions.push({ parentEntry: { type: "book" } });
  }

  if (hasText) {
    conditions.push({
      type: "text",
      OR: [
        { parentEntryId: null },
        { parentEntry: { type: { not: "book" } } },
      ],
    });
  }

  for (const type of types) {
    if (type !== "book" && type !== "text") {
      conditions.push({ type });
    }
  }

  return { OR: conditions };
}

export function sortEntriesHierarchically(
  entries: Array<{
    id: string;
    parentEntryId: string | null;
    title: string;
    pageStart?: number | null;
    pageEnd?: number | null;
  }>,
): string[] {
  const byId = new Set(entries.map((entry) => entry.id));
  const childrenByParent = new Map<string, typeof entries>();

  for (const entry of entries) {
    if (entry.parentEntryId && byId.has(entry.parentEntryId)) {
      const siblings = childrenByParent.get(entry.parentEntryId) ?? [];
      siblings.push(entry);
      childrenByParent.set(entry.parentEntryId, siblings);
    }
  }

  const roots = entries.filter(
    (entry) => !entry.parentEntryId || !byId.has(entry.parentEntryId),
  );

  const ordered: string[] = [];
  const visit = (entry: (typeof entries)[number]) => {
    ordered.push(entry.id);
    const children = sortBookChildren(childrenByParent.get(entry.id) ?? []);
    for (const child of children) visit(child);
  };

  for (const root of [...roots].sort((a, b) =>
    a.title.localeCompare(b.title, "de"),
  )) {
    visit(root);
  }

  for (const entry of entries) {
    if (!ordered.includes(entry.id)) ordered.push(entry.id);
  }

  return ordered;
}

export function buildEntryFilter(
  projectId: string,
  params: EntryFilterParams,
  savedViewFilter?: Prisma.JsonValue,
): Prisma.EntryWhereInput {
  const where: Prisma.EntryWhereInput = { projectId };

  const topics = toArray(params.topic);
  if (topics.length) {
    where.topics = { some: { topic: { name: { in: topics } } } };
  }

  const types = toArray(params.type) as EntryType[];
  const typeFilter = buildTypeFilter(types);
  if (typeFilter) {
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), typeFilter];
  }

  const confidences = toArray(params.confidence) as Confidence[];
  if (confidences.length) {
    where.confidence = { in: confidences };
  }

  if (params.yearMin !== undefined) {
    where.yearStart = { ...(where.yearStart as object), gte: params.yearMin };
  }
  if (params.yearMax !== undefined) {
    where.yearStart = { ...(where.yearStart as object), lte: params.yearMax };
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { placeName: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }

  const hasQuestions = parseBool(params.hasQuestions);
  if (hasQuestions === true) {
    where.questions = { some: { status: "open" } };
  }

  if (params.sourcesMax !== undefined && params.sourcesMax <= 1) {
    where.sources = { none: {} };
  }

  if (savedViewFilter && typeof savedViewFilter === "object" && savedViewFilter !== null) {
    applySavedViewFilter(where, savedViewFilter as Record<string, unknown>);
  }

  return where;
}

function applySavedViewFilter(
  where: Prisma.EntryWhereInput,
  filter: Record<string, unknown>,
) {
  if (filter.hasQuestions) {
    where.questions = { some: { status: "open" } };
  }

  if (Array.isArray(filter.confidence) && filter.confidence.length) {
    where.confidence = { in: filter.confidence as Confidence[] };
  }

  if (typeof filter.topic === "string") {
    where.topics = { some: { topic: { name: filter.topic } } };
  }

  if (typeof filter.yearMax === "number") {
    where.yearStart = { ...(where.yearStart as object), lte: filter.yearMax };
  }

  if (typeof filter.type === "string") {
    const typeFilter = buildTypeFilter([filter.type as EntryType]);
    if (typeFilter) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        typeFilter,
      ];
    }
  }

  if (typeof filter.sourcesMax === "number" && filter.sourcesMax <= 1) {
    where.sources = { none: {} };
  }
}

export function buildEntryOrderBy(
  sort?: string,
): Prisma.EntryOrderByWithRelationInput {
  switch (sort) {
    case "title":
      return { title: "asc" };
    case "updated":
      return { updatedAt: "desc" };
    case "year":
    default:
      return { yearStart: "asc" };
  }
}
