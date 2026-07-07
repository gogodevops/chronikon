import type {
  Confidence,
  Entry,
  EntryType,
  Prisma,
  Project,
} from "@prisma/client";

import { requireProjectRole } from "@/lib/auth-helpers";
import { CONF_META, RELATION_LABELS, TYPE_META } from "@/lib/constants";
import {
  currentEntryState,
  diffVersionStates,
  parseVersionSnapshot,
  type VersionFieldChange,
  type VersionSnapshotState,
} from "@/lib/entry-versions";

const ACTIVITY_PREVIEW_LEN = 120;
import { db } from "@/lib/db";
import {
  buildEntryFilter,
  buildEntryOrderBy,
  parseEntryFilterParams,
  sortEntriesHierarchically,
  type EntryFilterParams,
} from "@/lib/search";

export type SerializedEntryListItem = {
  id: string;
  legacyId: string | null;
  title: string;
  type: EntryType;
  typeColor: string;
  typeLabel: string;
  topic?: string;
  yearStart: number;
  yearEnd: number;
  confidence: Confidence;
  summary: string | null;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  sourceCount: number;
  questionCount: number;
  commentCount: number;
  parentEntryId: string | null;
  parentEntryTitle: string | null;
};

export type SerializedChildEntry = {
  id: string;
  title: string;
  typeLabel: string;
  typeColor: string;
  yearStart: number;
  yearEnd: number;
  questionCount: number;
  commentCount: number;
};

export type SerializedSource = {
  id: string;
  type: string;
  title: string;
  ref: string | null;
  note: string | null;
  linkedEntryId: string | null;
  linkedEntryTitle?: string | null;
};

export type SerializedClaim = {
  id: string;
  text: string;
  confidence: Confidence;
  confidenceLabel: string;
  confidenceColor: string;
  authorName?: string | null;
  createdAt: Date;
};

export type SerializedQuestion = {
  id: string;
  status: string;
  category: string;
  text: string;
  passageRef: string | null;
  authorName: string;
  authorInitials: string | null;
  createdAt: Date;
  answers: Array<{
    id: string;
    text: string;
    authorName: string;
    createdAt: Date;
  }>;
};

export type SerializedComment = {
  id: string;
  text: string;
  authorName: string;
  authorInitials: string | null;
  createdAt: Date;
};

export type SerializedRelation = {
  id: string;
  type: string;
  typeLabel: string;
  otherEntryId: string;
  otherEntryTitle: string;
  otherEntryTypeColor: string;
  otherEntryProjectSlug: string | null;
  otherEntryProjectName: string | null;
  otherEntryProjectIcon: string | null;
  isCrossProject: boolean;
};

export type LinkableEntryResult = {
  id: string;
  title: string;
  typeColor: string;
  projectSlug: string;
  projectName: string;
  projectIcon: string;
  isCurrentProject: boolean;
};

export type SerializedEntryVersion = {
  id: string;
  createdAt: Date;
  eventKind: "created" | "edited";
  changedByName: string | null;
  changedByEmail: string | null;
  snapshot: VersionSnapshotState;
  changes: VersionFieldChange[];
};

export type SerializedEntryDetail = SerializedEntryListItem & {
  body: string | null;
  language: string | null;
  author: string | null;
  topics: string[];
  confidenceLabel: string;
  confidenceColor: string;
  claimCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string | null;
  childEntries: SerializedChildEntry[];
  versions: SerializedEntryVersion[];
  attachments: Array<{
    id: string;
    name: string;
    mimeType: string;
    publicUrl: string | null;
    label: string | null;
    ocrStatus: string;
    extractedText: string | null;
  }>;
  sources: SerializedSource[];
  claims: SerializedClaim[];
  questions: SerializedQuestion[];
  comments: SerializedComment[];
  relations: SerializedRelation[];
};

export type EntryTitleIndex = { id: string; title: string };

export type ProjectWithTopics = Project & {
  topics: { id: string; name: string }[];
  savedViews: { id: string; label: string; filter: Prisma.JsonValue }[];
};

export type DashboardStats = {
  totalEntries: number;
  openQuestions: number;
  verifiedCount: number;
  disputedCount: number;
  byType: Record<string, number>;
  recentEntries: SerializedEntryListItem[];
};

export type DiscussionFeedItem = {
  id: string;
  kind: "question" | "comment";
  entryId: string;
  entryTitle: string;
  status: string | null;
  category: string | null;
  text: string;
  passageRef: string | null;
  createdAt: Date;
  authorName: string;
  authorInitials: string | null;
  answerCount: number;
};

export type ActivityItem = {
  id: string;
  kind:
    | "entry_created"
    | "entry_edited"
    | "question"
    | "comment"
    | "answer"
    | "claim"
    | "attachment"
    | "relation";
  createdAt: Date;
  entryId: string;
  entryTitle: string;
  authorName: string;
  authorInitials: string | null;
  summary: string;
  meta?: string;
  projectSlug?: string;
  projectName?: string;
};

export type SerializedNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

export type SearchResult = {
  id: string;
  type: "entry" | "place" | "question";
  title: string;
  subtitle?: string;
  entryId?: string;
};

function mapEntryListItem(
  entry: Entry & {
    topics: { topic: { name: string } }[];
    parentEntry?: { id: string; title: string } | null;
    _count: { sources: number; questions: number; comments: number };
  },
): SerializedEntryListItem {
  const meta = TYPE_META[entry.type];
  return {
    id: entry.id,
    legacyId: entry.legacyId,
    title: entry.title,
    type: entry.type,
    typeColor: meta.color,
    typeLabel: meta.label,
    topic: entry.topics[0]?.topic.name,
    yearStart: entry.yearStart,
    yearEnd: entry.yearEnd,
    confidence: entry.confidence,
    summary: entry.summary,
    placeName: entry.placeName,
    lat: entry.lat,
    lng: entry.lng,
    sourceCount: entry._count.sources,
    questionCount: entry._count.questions,
    commentCount: entry._count.comments,
    parentEntryId: entry.parentEntry?.id ?? null,
    parentEntryTitle: entry.parentEntry?.title ?? null,
  };
}

export async function getProjectBySlug(
  slug: string,
  userId: string,
): Promise<ProjectWithTopics | null> {
  const projectInclude = {
    topics: { select: { id: true, name: true }, orderBy: { name: "asc" as const } },
    savedViews: {
      select: { id: true, label: true, filter: true },
      orderBy: { createdAt: "asc" as const },
    },
  };

  const membership = await db.projectMember.findFirst({
    where: {
      userId,
      project: { slug },
    },
    include: {
      project: { include: projectInclude },
    },
  });

  if (membership) return membership.project;

  return db.project.findUnique({
    where: { slug },
    include: projectInclude,
  });
}

export async function getEntriesForProject(
  projectId: string,
  params: EntryFilterParams,
  options?: { limit?: number; sort?: string },
) {
  await requireProjectRole(projectId, "viewer");

  let savedViewFilter: Prisma.JsonValue | undefined;
  if (params.savedView) {
    const view = await db.savedView.findFirst({
      where: { id: params.savedView, projectId },
      select: { filter: true },
    });
    savedViewFilter = view?.filter;
  }

  const where = buildEntryFilter(projectId, params, savedViewFilter);
  const limit = options?.limit ?? 200;

  const [entries, total] = await Promise.all([
    db.entry.findMany({
      where,
      take: limit,
      orderBy: buildEntryOrderBy(options?.sort),
      include: {
        topics: { include: { topic: true } },
        parentEntry: { select: { id: true, title: true } },
        _count: { select: { sources: true, questions: true, comments: true } },
      },
    }),
    db.entry.count({ where }),
  ]);

  return {
    entries: (() => {
      const mapped = entries.map(mapEntryListItem);
      const order = sortEntriesHierarchically(mapped);
      const byId = new Map(mapped.map((entry) => [entry.id, entry]));
      return order
        .map((id) => byId.get(id))
        .filter((entry): entry is SerializedEntryListItem => Boolean(entry));
    })(),
    total,
  };
}

export async function getEntryDetail(
  projectId: string,
  entryId: string,
): Promise<SerializedEntryDetail | null> {
  await requireProjectRole(projectId, "viewer");

  const entry = await db.entry.findFirst({
    where: { id: entryId, projectId },
    include: {
      topics: { include: { topic: true } },
      parentEntry: { select: { id: true, title: true } },
      childEntries: {
        orderBy: { title: "asc" },
        include: {
          _count: { select: { questions: true, comments: true } },
        },
      },
      attachments: true,
      sources: { include: { linkedEntry: { select: { id: true, title: true } } } },
      claims: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      questions: {
        include: {
          author: { select: { name: true, avatarInitials: true } },
          answers: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: { author: { select: { name: true, avatarInitials: true } } },
        orderBy: { createdAt: "asc" },
      },
      relationsFrom: {
        include: {
          toEntry: {
            select: {
              id: true,
              title: true,
              type: true,
              project: { select: { id: true, slug: true, name: true, icon: true } },
            },
          },
        },
      },
      relationsTo: {
        include: {
          fromEntry: {
            select: {
              id: true,
              title: true,
              type: true,
              project: { select: { id: true, slug: true, name: true, icon: true } },
            },
          },
        },
      },
      createdBy: { select: { name: true } },
      versions: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { changedBy: { select: { name: true, email: true } } },
      },
      _count: {
        select: { sources: true, questions: true, comments: true, claims: true },
      },
    },
  });

  if (!entry) return null;

  const conf = CONF_META[entry.confidence];
  const base = mapEntryListItem({
    ...entry,
    _count: {
      sources: entry._count.sources,
      questions: entry._count.questions,
      comments: entry._count.comments,
    },
  });

  return {
    ...base,
    body: entry.body,
    language: entry.language,
    author: entry.author,
    topics: entry.topics.map((t) => t.topic.name),
    confidenceLabel: conf.label,
    confidenceColor: conf.color,
    claimCount: entry._count.claims,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    createdByName: entry.createdBy?.name ?? null,
    childEntries: entry.childEntries.map((child) => {
      const childMeta = TYPE_META[child.type];
      return {
        id: child.id,
        title: child.title,
        typeLabel: childMeta.label,
        typeColor: childMeta.color,
        yearStart: child.yearStart,
        yearEnd: child.yearEnd,
        questionCount: child._count.questions,
        commentCount: child._count.comments,
      };
    }),
    versions: (() => {
      const versionsDesc = entry.versions;
      const currentState = currentEntryState({
        type: entry.type,
        title: entry.title,
        summary: entry.summary,
        yearStart: entry.yearStart,
        yearEnd: entry.yearEnd,
        confidence: entry.confidence,
        topics: entry.topics.map((t) => t.topic.name),
      });

      return versionsDesc.map((v, index) => {
        const snapshot = parseVersionSnapshot(v.snapshot);
        const nachher =
          index === 0
            ? currentState
            : parseVersionSnapshot(versionsDesc[index - 1].snapshot);
        const isOldest = index === versionsDesc.length - 1;

        return {
          id: v.id,
          createdAt: v.createdAt,
          eventKind: isOldest ? ("created" as const) : ("edited" as const),
          changedByName: v.changedBy?.name ?? null,
          changedByEmail: v.changedBy?.email ?? null,
          snapshot,
          changes: diffVersionStates(snapshot, nachher),
        };
      });
    })(),
    attachments: entry.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      mimeType: a.mimeType,
      publicUrl: a.publicUrl,
      label: a.label,
      ocrStatus: a.ocrStatus,
      extractedText: a.extractedText,
    })),
    sources: entry.sources.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      ref: s.ref,
      note: s.note,
      linkedEntryId: s.linkedEntryId,
      linkedEntryTitle: s.linkedEntry?.title ?? null,
    })),
    claims: entry.claims.map((c) => {
      const cMeta = CONF_META[c.confidence];
      return {
        id: c.id,
        text: c.text,
        confidence: c.confidence,
        confidenceLabel: cMeta.label,
        confidenceColor: cMeta.color,
        authorName: c.author?.name ?? null,
        createdAt: c.createdAt,
      };
    }),
    questions: entry.questions.map((q) => ({
      id: q.id,
      status: q.status,
      category: q.category,
      text: q.text,
      passageRef: q.passageRef,
      authorName: q.author.name ?? "Unbekannt",
      authorInitials: q.author.avatarInitials,
      createdAt: q.createdAt,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        authorName: a.author.name ?? "Unbekannt",
        createdAt: a.createdAt,
      })),
    })),
    comments: entry.comments.map((c) => ({
      id: c.id,
      text: c.text,
      authorName: c.author.name ?? "Unbekannt",
      authorInitials: c.author.avatarInitials,
      createdAt: c.createdAt,
    })),
    relations: [
      ...entry.relationsFrom.map((r) => ({
        id: r.id,
        type: r.type,
        typeLabel: RELATION_LABELS[r.type],
        otherEntryId: r.toEntry.id,
        otherEntryTitle: r.toEntry.title,
        otherEntryTypeColor: TYPE_META[r.toEntry.type].color,
        otherEntryProjectSlug: r.toEntry.project.slug,
        otherEntryProjectName: r.toEntry.project.name,
        otherEntryProjectIcon: r.toEntry.project.icon,
        isCrossProject: r.toEntry.project.id !== projectId,
      })),
      ...entry.relationsTo.map((r) => ({
        id: r.id,
        type: r.type,
        typeLabel: RELATION_LABELS[r.type],
        otherEntryId: r.fromEntry.id,
        otherEntryTitle: r.fromEntry.title,
        otherEntryTypeColor: TYPE_META[r.fromEntry.type].color,
        otherEntryProjectSlug: r.fromEntry.project.slug,
        otherEntryProjectName: r.fromEntry.project.name,
        otherEntryProjectIcon: r.fromEntry.project.icon,
        isCrossProject: r.fromEntry.project.id !== projectId,
      })),
    ],
  };
}

export async function getEntryTitleIndex(
  projectId: string,
): Promise<EntryTitleIndex[]> {
  await requireProjectRole(projectId, "viewer");
  return db.entry.findMany({
    where: { projectId },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}

export async function searchLinkableEntries(
  projectId: string,
  userId: string,
  query: string,
  excludeEntryId?: string,
  limit = 8,
): Promise<LinkableEntryResult[]> {
  await requireProjectRole(projectId, "viewer");

  const q = query.trim();
  if (!q) return [];

  const memberships = await db.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const projectIds = memberships.map((m) => m.projectId);
  if (!projectIds.length) return [];

  const entries = await db.entry.findMany({
    where: {
      projectId: { in: projectIds },
      id: excludeEntryId ? { not: excludeEntryId } : undefined,
      title: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      title: true,
      type: true,
      project: { select: { id: true, slug: true, name: true, icon: true } },
    },
    orderBy: [{ project: { name: "asc" } }, { title: "asc" }],
    take: limit,
  });

  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    typeColor: TYPE_META[e.type].color,
    projectSlug: e.project.slug,
    projectName: e.project.name,
    projectIcon: e.project.icon,
    isCurrentProject: e.project.id === projectId,
  }));
}

export async function getDashboardStats(
  projectId: string,
): Promise<DashboardStats> {
  await requireProjectRole(projectId, "viewer");

  const [totalEntries, openQuestions, byConfidence, byType, recent] =
    await Promise.all([
      db.entry.count({ where: { projectId } }),
      db.question.count({
        where: { status: "open", entry: { projectId } },
      }),
      db.entry.groupBy({
        by: ["confidence"],
        where: { projectId },
        _count: true,
      }),
      db.entry.groupBy({
        by: ["type"],
        where: { projectId },
        _count: true,
      }),
      db.entry.findMany({
        where: { projectId },
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          topics: { include: { topic: true } },
          _count: { select: { sources: true, questions: true, comments: true } },
        },
      }),
    ]);

  const verifiedCount =
    byConfidence.find((c) => c.confidence === "verified")?._count ?? 0;
  const disputedCount =
    byConfidence.find((c) => c.confidence === "disputed")?._count ?? 0;

  const typeMap: Record<string, number> = {};
  for (const row of byType) {
    typeMap[row.type] = row._count;
  }

  return {
    totalEntries,
    openQuestions,
    verifiedCount,
    disputedCount,
    byType: typeMap,
    recentEntries: recent.map(mapEntryListItem),
  };
}

export async function getDiscussions(projectId: string) {
  await requireProjectRole(projectId, "viewer");

  const [questions, comments] = await Promise.all([
    db.question.findMany({
      where: { entry: { projectId } },
      include: {
        entry: { select: { id: true, title: true } },
        author: { select: { name: true, avatarInitials: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.comment.findMany({
      where: { entry: { projectId } },
      include: {
        entry: { select: { id: true, title: true } },
        author: { select: { name: true, avatarInitials: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: DiscussionFeedItem[] = [
    ...questions.map(
      (q): DiscussionFeedItem => ({
        id: q.id,
        kind: "question",
        entryId: q.entry.id,
        entryTitle: q.entry.title,
        status: q.status,
        category: q.category,
        text: q.text,
        passageRef: q.passageRef,
        createdAt: q.createdAt,
        authorName: q.author.name ?? "Unbekannt",
        authorInitials: q.author.avatarInitials,
        answerCount: q._count.answers,
      }),
    ),
    ...comments.map(
      (c): DiscussionFeedItem => ({
        id: c.id,
        kind: "comment",
        entryId: c.entry.id,
        entryTitle: c.entry.title,
        status: null,
        category: null,
        text: c.text,
        passageRef: null,
        createdAt: c.createdAt,
        authorName: c.author.name ?? "Unbekannt",
        authorInitials: c.author.avatarInitials,
        answerCount: 0,
      }),
    ),
  ];

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items;
}

export async function searchEntries(
  projectId: string,
  query: string,
  limit = 20,
): Promise<SearchResult[]> {
  await requireProjectRole(projectId, "viewer");

  const q = query.trim();
  if (!q) return [];

  const [entries, questions] = await Promise.all([
    db.entry.findMany({
      where: {
        projectId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
          { placeName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, title: true, type: true, placeName: true },
    }),
    db.question.findMany({
      where: {
        entry: { projectId },
        OR: [
          { text: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      include: { entry: { select: { title: true } } },
    }),
  ]);

  const results: SearchResult[] = [];

  for (const entry of entries) {
    if (entry.type === "place") {
      results.push({
        id: entry.id,
        type: "place",
        title: entry.title,
        subtitle: entry.placeName ?? undefined,
      });
    } else {
      results.push({
        id: entry.id,
        type: "entry",
        title: entry.title,
        subtitle: TYPE_META[entry.type].label,
      });
    }
  }

  for (const question of questions) {
    results.push({
      id: question.id,
      type: "question",
      title: question.text.slice(0, 80),
      subtitle: question.entry.title,
      entryId: question.entryId,
    });
  }

  return results.slice(0, limit);
}

function previewText(text: string, max = ACTIVITY_PREVIEW_LEN): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function authorFromUser(
  user: { name: string | null; avatarInitials: string | null } | null | undefined,
  fallback = "Unbekannt",
) {
  return {
    authorName: user?.name ?? fallback,
    authorInitials: user?.avatarInitials ?? null,
  };
}

export type ActivityPageResult = {
  items: ActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const ACTIVITY_PAGE_SIZE = 15;

async function countProjectActivity(projectId: string): Promise<number> {
  const [
    created,
    versions,
    questions,
    comments,
    answers,
    claims,
    attachments,
    relations,
  ] = await Promise.all([
    db.entry.count({ where: { projectId } }),
    db.entryVersion.count({ where: { entry: { projectId } } }),
    db.question.count({ where: { entry: { projectId } } }),
    db.comment.count({ where: { entry: { projectId } } }),
    db.answer.count({ where: { question: { entry: { projectId } } } }),
    db.claim.count({ where: { entry: { projectId } } }),
    db.attachment.count({ where: { entry: { projectId } } }),
    db.entryRelation.count({ where: { fromEntry: { projectId } } }),
  ]);

  return (
    created +
    versions +
    questions +
    comments +
    answers +
    claims +
    attachments +
    relations
  );
}

export async function getProjectActivityPage(
  projectId: string,
  page = 1,
  pageSize = ACTIVITY_PAGE_SIZE,
): Promise<ActivityPageResult> {
  await requireProjectRole(projectId, "viewer");

  const total = await countProjectActivity(projectId);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * pageSize;
  const perTable = Math.min(offset + pageSize, 500);

  const [
    createdEntries,
    versions,
    questions,
    comments,
    answers,
    claims,
    attachments,
    relations,
  ] = await Promise.all([
    db.entry.findMany({
      where: { projectId },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.entryVersion.findMany({
      where: { entry: { projectId } },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        entry: { select: { id: true, title: true } },
        changedBy: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.question.findMany({
      where: { entry: { projectId } },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        entry: { select: { id: true, title: true } },
        author: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.comment.findMany({
      where: { entry: { projectId } },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        entry: { select: { id: true, title: true } },
        author: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.answer.findMany({
      where: { question: { entry: { projectId } } },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, avatarInitials: true } },
        question: {
          include: { entry: { select: { id: true, title: true } } },
        },
      },
    }),
    db.claim.findMany({
      where: { entry: { projectId } },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        entry: { select: { id: true, title: true } },
        author: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.attachment.findMany({
      where: { entry: { projectId } },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        entry: { select: { id: true, title: true } },
        uploadedBy: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.entryRelation.findMany({
      where: { fromEntry: { projectId } },
      take: perTable,
      orderBy: { createdAt: "desc" },
      include: {
        fromEntry: { select: { id: true, title: true } },
        toEntry: { select: { title: true } },
      },
    }),
  ]);

  const items: ActivityItem[] = [
    ...createdEntries.map((e) => ({
      id: `entry_created-${e.id}`,
      kind: "entry_created" as const,
      createdAt: e.createdAt,
      entryId: e.id,
      entryTitle: e.title,
      ...authorFromUser(e.createdBy),
      summary: previewText(e.summary ?? e.title),
    })),
    ...versions.map((v) => ({
      id: `entry_edited-${v.id}`,
      kind: "entry_edited" as const,
      createdAt: v.createdAt,
      entryId: v.entry.id,
      entryTitle: v.entry.title,
      ...authorFromUser(v.changedBy),
      summary: "Eintrag wurde bearbeitet",
    })),
    ...questions.map((q) => ({
      id: `question-${q.id}`,
      kind: "question" as const,
      createdAt: q.createdAt,
      entryId: q.entry.id,
      entryTitle: q.entry.title,
      ...authorFromUser(q.author),
      summary: previewText(q.text),
      meta: q.category,
    })),
    ...comments.map((c) => ({
      id: `comment-${c.id}`,
      kind: "comment" as const,
      createdAt: c.createdAt,
      entryId: c.entry.id,
      entryTitle: c.entry.title,
      ...authorFromUser(c.author),
      summary: previewText(c.text),
    })),
    ...answers.map((a) => ({
      id: `answer-${a.id}`,
      kind: "answer" as const,
      createdAt: a.createdAt,
      entryId: a.question.entry.id,
      entryTitle: a.question.entry.title,
      ...authorFromUser(a.author),
      summary: previewText(a.text),
    })),
    ...claims.map((c) => ({
      id: `claim-${c.id}`,
      kind: "claim" as const,
      createdAt: c.createdAt,
      entryId: c.entry.id,
      entryTitle: c.entry.title,
      ...authorFromUser(c.author),
      summary: previewText(c.text),
      meta: CONF_META[c.confidence].label,
    })),
    ...attachments.map((a) => ({
      id: `attachment-${a.id}`,
      kind: "attachment" as const,
      createdAt: a.createdAt,
      entryId: a.entry.id,
      entryTitle: a.entry.title,
      ...authorFromUser(a.uploadedBy),
      summary: a.label ?? a.name,
    })),
    ...relations.map((r) => ({
      id: `relation-${r.id}`,
      kind: "relation" as const,
      createdAt: r.createdAt,
      entryId: r.fromEntry.id,
      entryTitle: r.fromEntry.title,
      authorName: "System",
      authorInitials: null,
      summary: `${RELATION_LABELS[r.type]} → ${r.toEntry.title}`,
    })),
  ];

  const pageItems = items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + pageSize);

  return {
    items: pageItems,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getProjectActivity(
  projectId: string,
  limit = 30,
): Promise<ActivityItem[]> {
  const result = await getProjectActivityPage(projectId, 1, limit);
  return result.items;
}

export async function getRecentActivityEntryIds(
  projectId: string,
  days = 7,
): Promise<string[]> {
  await requireProjectRole(projectId, "viewer");

  const since = new Date();
  since.setDate(since.getDate() - days);
  const dateFilter = { gte: since };

  const [
    created,
    versions,
    questions,
    comments,
    answers,
    claims,
    attachments,
    relations,
  ] = await Promise.all([
    db.entry.findMany({
      where: { projectId, createdAt: dateFilter },
      select: { id: true },
    }),
    db.entryVersion.findMany({
      where: { entry: { projectId }, createdAt: dateFilter },
      select: { entryId: true },
    }),
    db.question.findMany({
      where: { entry: { projectId }, createdAt: dateFilter },
      select: { entryId: true },
    }),
    db.comment.findMany({
      where: { entry: { projectId }, createdAt: dateFilter },
      select: { entryId: true },
    }),
    db.answer.findMany({
      where: { question: { entry: { projectId } }, createdAt: dateFilter },
      select: { question: { select: { entryId: true } } },
    }),
    db.claim.findMany({
      where: { entry: { projectId }, createdAt: dateFilter },
      select: { entryId: true },
    }),
    db.attachment.findMany({
      where: { entry: { projectId }, createdAt: dateFilter },
      select: { entryId: true },
    }),
    db.entryRelation.findMany({
      where: { fromEntry: { projectId }, createdAt: dateFilter },
      select: { fromEntryId: true, toEntryId: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const e of created) ids.add(e.id);
  for (const v of versions) ids.add(v.entryId);
  for (const q of questions) ids.add(q.entryId);
  for (const c of comments) ids.add(c.entryId);
  for (const a of answers) ids.add(a.question.entryId);
  for (const c of claims) ids.add(c.entryId);
  for (const a of attachments) ids.add(a.entryId);
  for (const r of relations) {
    ids.add(r.fromEntryId);
    ids.add(r.toEntryId);
  }

  return [...ids];
}

export async function getNotifications(
  userId: string,
  limit = 50,
): Promise<SerializedNotification[]> {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return parseEntryFilterParams(searchParams);
}
