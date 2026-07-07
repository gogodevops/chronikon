"use server";

import type {
  Confidence,
  EntryType,
  RelationType,
  SourceType,
} from "@prisma/client";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { requireAuth, requireProjectRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { notifyProjectMembers, projectEntryLink } from "@/lib/notifications";
import { revalidateProject } from "@/lib/revalidate-project";
import { deleteStoredFile } from "@/lib/storage";
import {
  searchLinkableEntries as searchLinkableEntriesQuery,
  type LinkableEntryResult,
} from "@/lib/queries";

const entryTypeSchema = z.enum([
  "book",
  "text",
  "person",
  "place",
  "discovery",
  "note",
]);

const confidenceSchema = z.enum(["verified", "likely", "disputed", "unknown"]);

const createEntrySchema = z.object({
  projectId: z.string().cuid(),
  type: entryTypeSchema,
  title: z.string().min(1),
  summary: z.string().optional(),
  body: z.string().optional(),
  yearStart: z.number().int(),
  yearEnd: z.number().int(),
  confidence: confidenceSchema.default("likely"),
  language: z.string().optional(),
  author: z.string().optional(),
  placeName: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  topicNames: z.array(z.string()).optional(),
});

const updateEntrySchema = createEntrySchema
  .omit({ projectId: true })
  .partial()
  .extend({ id: z.string().cuid() });

const sourceSchema = z.object({
  entryId: z.string().cuid(),
  type: z.enum(["primary", "secondary", "tertiary"]).default("secondary"),
  title: z.string().min(1),
  ref: z.string().optional(),
  note: z.string().optional(),
  linkedEntryId: z.string().cuid().optional(),
});

const claimSchema = z.object({
  entryId: z.string().cuid(),
  text: z.string().min(1),
  confidence: confidenceSchema.default("likely"),
  basedOnIds: z.array(z.string()).optional(),
});

const relationSchema = z.object({
  fromEntryId: z.string().cuid(),
  toEntryId: z.string().cuid(),
  type: z.enum([
    "found_at",
    "discovered_in",
    "edited_in",
    "discussed_in",
    "translated_in",
    "located_at",
    "authored",
    "associated_with",
    "founded",
    "ruled_in",
    "contemporary",
    "based_on",
    "discusses",
    "cited_in",
    "contradicts",
  ]),
});

const attachmentSchema = z.object({
  entryId: z.string().cuid(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  storageKey: z.string().min(1),
  publicUrl: z.string().optional(),
  label: z.string().optional(),
  extractedText: z.string().optional(),
});

async function syncTopics(
  entryId: string,
  projectId: string,
  topicNames: string[],
) {
  await db.entryTopic.deleteMany({ where: { entryId } });
  for (const name of topicNames) {
    const topic = await db.topic.upsert({
      where: { projectId_name: { projectId, name } },
      create: { projectId, name },
      update: {},
    });
    await db.entryTopic.create({
      data: { entryId, topicId: topic.id },
    });
  }
}

async function snapshotEntry(entryId: string, userId: string) {
  const entry = await db.entry.findUnique({
    where: { id: entryId },
    include: {
      topics: { include: { topic: true } },
    },
  });
  if (!entry) return;
  await db.entryVersion.create({
    data: {
      entryId,
      changedById: userId,
      snapshot: {
        type: entry.type,
        title: entry.title,
        summary: entry.summary,
        yearStart: entry.yearStart,
        yearEnd: entry.yearEnd,
        confidence: entry.confidence,
        topics: entry.topics.map((t) => t.topic.name),
      },
    },
  });
}

export async function createEntry(
  input: z.infer<typeof createEntrySchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const data = parsed.data;
  const { session } = await requireProjectRole(data.projectId, "editor");

  const entry = await db.entry.create({
    data: {
      projectId: data.projectId,
      type: data.type as EntryType,
      title: data.title,
      summary: data.summary,
      body: data.body,
      yearStart: data.yearStart,
      yearEnd: data.yearEnd,
      confidence: data.confidence as Confidence,
      language: data.language,
      author: data.author,
      placeName: data.placeName,
      lat: data.lat,
      lng: data.lng,
      createdById: session.user.id,
    },
  });

  if (data.topicNames?.length) {
    await syncTopics(entry.id, data.projectId, data.topicNames);
  }

  await notifyProjectMembers(data.projectId, session.user.id, {
    type: "entry_created",
    title: `Neuer Eintrag: „${entry.title}"`,
    body: data.summary?.slice(0, 120),
    link: await projectEntryLink(data.projectId, entry.id),
  });

  await revalidateProject(data.projectId);
  return { success: true, data: { id: entry.id } };
}

export async function updateEntry(
  input: z.infer<typeof updateEntrySchema> & { projectId: string },
): Promise<ActionResult> {
  const parsed = updateEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { id, ...fields } = parsed.data;
  const { session } = await requireProjectRole(input.projectId, "editor");

  const existing = await db.entry.findFirst({
    where: { id, projectId: input.projectId },
  });
  if (!existing) {
    return { success: false, error: "Eintrag nicht gefunden" };
  }

  await snapshotEntry(id, session.user.id);

  await db.entry.update({
    where: { id },
    data: {
      type: fields.type as EntryType | undefined,
      title: fields.title,
      summary: fields.summary,
      body: fields.body,
      yearStart: fields.yearStart,
      yearEnd: fields.yearEnd,
      confidence: fields.confidence as Confidence | undefined,
      language: fields.language,
      author: fields.author,
      placeName: fields.placeName,
      lat: fields.lat,
      lng: fields.lng,
    },
  });

  if (fields.topicNames) {
    await syncTopics(id, input.projectId, fields.topicNames);
  }

  await notifyProjectMembers(input.projectId, session.user.id, {
    type: "entry_edited",
    title: `Eintrag bearbeitet: „${fields.title ?? existing.title}"`,
    link: await projectEntryLink(input.projectId, id),
  });

  await revalidateProject(input.projectId);
  return { success: true, data: undefined };
}

export async function deleteEntry(
  projectId: string,
  entryId: string,
): Promise<ActionResult> {
  await requireProjectRole(projectId, "editor");

  const existing = await db.entry.findFirst({
    where: { id: entryId, projectId },
  });
  if (!existing) {
    return { success: false, error: "Eintrag nicht gefunden" };
  }

  await db.entry.delete({ where: { id: entryId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function addSource(
  input: z.infer<typeof sourceSchema> & { projectId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = sourceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await requireProjectRole(input.projectId, "editor");

  const entry = await db.entry.findFirst({
    where: { id: parsed.data.entryId, projectId: input.projectId },
  });
  if (!entry) {
    return { success: false, error: "Eintrag nicht gefunden" };
  }

  const source = await db.source.create({
    data: {
      entryId: parsed.data.entryId,
      type: parsed.data.type as SourceType,
      title: parsed.data.title,
      ref: parsed.data.ref,
      note: parsed.data.note,
      linkedEntryId: parsed.data.linkedEntryId,
    },
  });

  await revalidateProject(input.projectId);
  return { success: true, data: { id: source.id } };
}

export async function addClaim(
  input: z.infer<typeof claimSchema> & { projectId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { session } = await requireProjectRole(input.projectId, "editor");

  const entry = await db.entry.findFirst({
    where: { id: parsed.data.entryId, projectId: input.projectId },
  });
  if (!entry) {
    return { success: false, error: "Eintrag nicht gefunden" };
  }

  const claim = await db.claim.create({
    data: {
      entryId: parsed.data.entryId,
      text: parsed.data.text,
      confidence: parsed.data.confidence as Confidence,
      basedOnIds: parsed.data.basedOnIds ?? [],
      authorId: session.user.id,
    },
  });

  await notifyProjectMembers(input.projectId, session.user.id, {
    type: "claim",
    title: `Neue Behauptung zu „${entry.title}"`,
    body: parsed.data.text.slice(0, 120),
    link: await projectEntryLink(input.projectId, entry.id, "behauptungen"),
  });

  await revalidateProject(input.projectId);
  return { success: true, data: { id: claim.id } };
}

export async function addRelation(
  input: z.infer<typeof relationSchema> & { projectId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = relationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { session } = await requireProjectRole(input.projectId, "editor");

  const [fromEntry, toEntry] = await Promise.all([
    db.entry.findFirst({
      where: { id: parsed.data.fromEntryId, projectId: input.projectId },
    }),
    db.entry.findFirst({
      where: { id: parsed.data.toEntryId },
      include: { project: { select: { id: true, name: true } } },
    }),
  ]);

  if (!fromEntry || !toEntry) {
    return { success: false, error: "Einträge nicht gefunden" };
  }

  if (toEntry.id === fromEntry.id) {
    return { success: false, error: "Eintrag kann nicht mit sich selbst verknüpft werden" };
  }

  try {
    await requireProjectRole(toEntry.project.id, "viewer");
  } catch {
    return { success: false, error: "Kein Zugriff auf Ziel-Projekt" };
  }

  const relation = await db.entryRelation.upsert({
    where: {
      fromEntryId_toEntryId_type: {
        fromEntryId: parsed.data.fromEntryId,
        toEntryId: parsed.data.toEntryId,
        type: parsed.data.type as RelationType,
      },
    },
    create: {
      fromEntryId: parsed.data.fromEntryId,
      toEntryId: parsed.data.toEntryId,
      type: parsed.data.type as RelationType,
    },
    update: {},
  });

  await notifyProjectMembers(input.projectId, session.user.id, {
    type: "relation",
    title: `Neue Verknüpfung: „${fromEntry.title}"`,
    body: `${parsed.data.type} → ${toEntry.title}${toEntry.project.id !== input.projectId ? ` (${toEntry.project.name})` : ""}`,
    link: await projectEntryLink(input.projectId, fromEntry.id, "verknuepfungen"),
  });

  await revalidateProject(input.projectId);
  if (toEntry.project.id !== input.projectId) {
    await revalidateProject(toEntry.project.id);
  }
  return { success: true, data: { id: relation.id } };
}

export async function searchLinkableEntries(
  projectId: string,
  query: string,
  excludeEntryId?: string,
): Promise<ActionResult<LinkableEntryResult[]>> {
  const session = await requireAuth();
  try {
    const results = await searchLinkableEntriesQuery(
      projectId,
      session.user.id,
      query,
      excludeEntryId,
    );
    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Suche fehlgeschlagen",
    };
  }
}

export async function addAttachmentMetadata(
  input: z.infer<typeof attachmentSchema> & { projectId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { session } = await requireProjectRole(input.projectId, "editor");

  const entry = await db.entry.findFirst({
    where: { id: parsed.data.entryId, projectId: input.projectId },
  });
  if (!entry) {
    return { success: false, error: "Eintrag nicht gefunden" };
  }

  const attachment = await db.attachment.create({
    data: {
      entryId: parsed.data.entryId,
      name: parsed.data.name,
      mimeType: parsed.data.mimeType,
      storageKey: parsed.data.storageKey,
      publicUrl: parsed.data.publicUrl,
      label: parsed.data.label,
      extractedText: parsed.data.extractedText,
      uploadedById: session.user.id,
    },
  });

  await revalidateProject(input.projectId);
  return { success: true, data: { id: attachment.id } };
}

export async function deleteSource(
  projectId: string,
  sourceId: string,
): Promise<ActionResult> {
  await requireProjectRole(projectId, "editor");
  const source = await db.source.findFirst({
    where: { id: sourceId },
    include: { entry: { select: { projectId: true } } },
  });
  if (!source || source.entry.projectId !== projectId) {
    return { success: false, error: "Quelle nicht gefunden" };
  }
  await db.source.delete({ where: { id: sourceId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function deleteClaim(
  projectId: string,
  claimId: string,
): Promise<ActionResult> {
  await requireProjectRole(projectId, "editor");
  const claim = await db.claim.findFirst({
    where: { id: claimId },
    include: { entry: { select: { projectId: true } } },
  });
  if (!claim || claim.entry.projectId !== projectId) {
    return { success: false, error: "Behauptung nicht gefunden" };
  }
  await db.claim.delete({ where: { id: claimId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function deleteRelation(
  projectId: string,
  relationId: string,
): Promise<ActionResult> {
  await requireProjectRole(projectId, "editor");
  const relation = await db.entryRelation.findFirst({
    where: { id: relationId },
    include: { fromEntry: { select: { projectId: true } } },
  });
  if (!relation || relation.fromEntry.projectId !== projectId) {
    return { success: false, error: "Verknüpfung nicht gefunden" };
  }
  await db.entryRelation.delete({ where: { id: relationId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function deleteAttachment(
  projectId: string,
  attachmentId: string,
): Promise<ActionResult> {
  await requireProjectRole(projectId, "editor");
  const attachment = await db.attachment.findFirst({
    where: { id: attachmentId },
    include: { entry: { select: { projectId: true } } },
  });
  if (!attachment || attachment.entry.projectId !== projectId) {
    return { success: false, error: "Anhang nicht gefunden" };
  }
  try {
    await deleteStoredFile(attachment.storageKey);
  } catch {
    /* Storage-Löschung optional — DB-Eintrag trotzdem entfernen */
  }
  await db.attachment.delete({ where: { id: attachmentId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function getEntry(entryId: string, projectId: string) {
  await requireProjectRole(projectId, "viewer");
  return db.entry.findFirst({
    where: { id: entryId, projectId },
    include: {
      topics: { include: { topic: true } },
      sources: true,
      claims: true,
      attachments: true,
      relationsFrom: { include: { toEntry: true } },
      relationsTo: { include: { fromEntry: true } },
      questions: { include: { answers: true } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function listEntries(projectId: string, limit = 10) {
  await requireProjectRole(projectId, "viewer");
  return db.entry.findMany({
    where: { projectId },
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: {
      topics: { include: { topic: true } },
      _count: { select: { sources: true, questions: true } },
    },
  });
}
