import type { Confidence, EntryType, Prisma } from "@prisma/client";
import { z } from "zod";

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
  if (types.length) {
    where.type = { in: types };
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
    where.type = filter.type as EntryType;
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
