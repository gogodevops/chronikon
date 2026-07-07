import { requireAppAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const ACTIVITY_PREVIEW_LEN = 120;
const PER_TABLE = 40;

export type SystemUserRow = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  avatarInitials: string | null;
  projectCount: number;
  isAdmin: boolean;
};

export type SystemProjectRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  memberCount: number;
  entryCount: number;
  lastActivityAt: Date | null;
};

export type SystemActivityKind =
  | "entry_created"
  | "entry_edited"
  | "user_registered"
  | "invite_accepted";

export type SystemActivityItem = {
  id: string;
  kind: SystemActivityKind;
  createdAt: Date;
  title: string;
  summary: string;
  authorName: string;
  authorInitials: string | null;
  projectSlug?: string;
  projectName?: string;
  projectIcon?: string;
  entryId?: string;
};

export type SystemOverviewStats = {
  userCount: number;
  projectCount: number;
  entryCount: number;
  pendingInvites: number;
};

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

export async function getSystemOverviewStats(): Promise<SystemOverviewStats> {
  await requireAppAdmin();

  const [userCount, projectCount, entryCount, pendingInvites] = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.entry.count(),
    db.userInvite.count({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);

  return { userCount, projectCount, entryCount, pendingInvites };
}

export async function getSystemUsers(limit = 8): Promise<SystemUserRow[]> {
  await requireAppAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      avatarInitials: true,
      isAdmin: true,
      _count: { select: { memberships: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    avatarInitials: u.avatarInitials,
    projectCount: u._count.memberships,
    isAdmin: u.isAdmin,
  }));
}

export async function getSystemProjects(): Promise<SystemProjectRow[]> {
  await requireAppAdmin();

  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      updatedAt: true,
      _count: { select: { members: true, entries: true } },
      entries: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { updatedAt: true },
      },
    },
  });

  return projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    icon: p.icon,
    memberCount: p._count.members,
    entryCount: p._count.entries,
    lastActivityAt: p.entries[0]?.updatedAt ?? p.updatedAt,
  }));
}

export async function getSystemActivity(limit = 20): Promise<SystemActivityItem[]> {
  await requireAppAdmin();

  const [
    createdEntries,
    versions,
    newUsers,
    acceptedUserInvites,
    acceptedProjectInvites,
  ] = await Promise.all([
    db.entry.findMany({
      take: PER_TABLE,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, avatarInitials: true } },
        project: { select: { slug: true, name: true, icon: true } },
      },
    }),
    db.entryVersion.findMany({
      take: PER_TABLE,
      orderBy: { createdAt: "desc" },
      include: {
        entry: {
          select: {
            id: true,
            title: true,
            project: { select: { slug: true, name: true, icon: true } },
          },
        },
        changedBy: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.user.findMany({
      take: PER_TABLE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarInitials: true,
        createdAt: true,
      },
    }),
    db.userInvite.findMany({
      where: { acceptedAt: { not: null } },
      take: PER_TABLE,
      orderBy: { acceptedAt: "desc" },
      select: {
        id: true,
        email: true,
        acceptedAt: true,
        sender: { select: { name: true, avatarInitials: true } },
      },
    }),
    db.projectInvite.findMany({
      where: { acceptedAt: { not: null } },
      take: PER_TABLE,
      orderBy: { acceptedAt: "desc" },
      include: {
        project: { select: { slug: true, name: true, icon: true } },
        sender: { select: { name: true, avatarInitials: true } },
      },
    }),
  ]);

  const items: SystemActivityItem[] = [
    ...createdEntries.map((e) => ({
      id: `entry_created-${e.id}`,
      kind: "entry_created" as const,
      createdAt: e.createdAt,
      entryId: e.id,
      title: e.title,
      ...authorFromUser(e.createdBy),
      summary: previewText(e.summary ?? e.title),
      projectSlug: e.project.slug,
      projectName: e.project.name,
      projectIcon: e.project.icon,
    })),
    ...versions.map((v) => ({
      id: `entry_edited-${v.id}`,
      kind: "entry_edited" as const,
      createdAt: v.createdAt,
      entryId: v.entry.id,
      title: v.entry.title,
      ...authorFromUser(v.changedBy),
      summary: "Eintrag wurde bearbeitet",
      projectSlug: v.entry.project.slug,
      projectName: v.entry.project.name,
      projectIcon: v.entry.project.icon,
    })),
    ...newUsers.map((u) => ({
      id: `user_registered-${u.id}`,
      kind: "user_registered" as const,
      createdAt: u.createdAt,
      title: u.name ?? u.email,
      authorName: u.name ?? "Neuer Nutzer",
      authorInitials: u.avatarInitials,
      summary: `${u.email} hat sich registriert`,
    })),
    ...acceptedUserInvites.map((i) => ({
      id: `user_invite-${i.id}`,
      kind: "invite_accepted" as const,
      createdAt: i.acceptedAt!,
      title: i.email,
      ...authorFromUser(i.sender),
      summary: `Plattform-Einladung angenommen`,
    })),
    ...acceptedProjectInvites.map((i) => ({
      id: `project_invite-${i.id}`,
      kind: "invite_accepted" as const,
      createdAt: i.acceptedAt!,
      title: i.email,
      ...authorFromUser(i.sender),
      summary: `Projekt-Einladung angenommen`,
      projectSlug: i.project.slug,
      projectName: i.project.name,
      projectIcon: i.project.icon,
    })),
  ];

  return items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
