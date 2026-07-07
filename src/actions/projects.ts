"use server";

import type { ProjectRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { requireAuth, requireProjectRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { uniqueProjectSlug } from "@/lib/slugify";

const PROJECT_COOKIE = "chronikon_project";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name erforderlich").max(120),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Zahlen und Bindestriche")
    .optional(),
  icon: z.string().min(1).max(8).default("✦"),
  description: z.string().max(500).optional(),
});

export async function getUserLandingPath(userId: string): Promise<string> {
  const firstMembership = await db.projectMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    include: { project: { select: { slug: true } } },
  });

  if (firstMembership) {
    return `/p/${firstMembership.project.slug}/dashboard`;
  }

  return "/projects/new";
}

export async function createProject(
  input: z.infer<typeof createProjectSchema>,
): Promise<ActionResult<{ slug: string }>> {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const session = await requireAuth();
  const { name, icon, description } = parsed.data;

  const slug = parsed.data.slug
    ? parsed.data.slug
    : await uniqueProjectSlug(name, async (candidate) => {
        const existing = await db.project.findUnique({
          where: { slug: candidate },
        });
        return Boolean(existing);
      });

  const existing = await db.project.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, error: "Diese Kurz-URL ist bereits vergeben" };
  }

  const project = await db.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        slug,
        name,
        icon,
        description: description || null,
      },
    });
    await tx.projectMember.create({
      data: {
        projectId: created.id,
        userId: session.user.id,
        role: "owner",
      },
    });
    return created;
  });

  const cookieStore = await cookies();
  cookieStore.set(PROJECT_COOKIE, project.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/");
  return { success: true, data: { slug: project.slug } };
}

const inviteSchema = z.object({
  projectId: z.string().cuid(),
  email: z.string().email(),
  role: z.enum(["owner", "editor", "commenter", "viewer"]).default("commenter"),
});

export async function switchProject(
  projectId: string,
): Promise<ActionResult<{ slug: string }>> {
  await requireProjectRole(projectId, "viewer");

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, slug: true },
  });

  if (!project) {
    return { success: false, error: "Projekt nicht gefunden" };
  }

  const cookieStore = await cookies();
  cookieStore.set(PROJECT_COOKIE, project.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/");
  return { success: true, data: { slug: project.slug } };
}

export async function getActiveProjectId(): Promise<string | null> {
  const session = await requireAuth().catch(() => null);
  if (!session) return null;

  const cookieStore = await cookies();
  const cookieProjectId = cookieStore.get(PROJECT_COOKIE)?.value;

  if (cookieProjectId) {
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: cookieProjectId,
          userId: session.user.id,
        },
      },
    });
    if (membership) return cookieProjectId;
  }

  const firstMembership = await db.projectMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { projectId: true },
  });

  return firstMembership?.projectId ?? null;
}

export async function inviteMember(
  input: z.infer<typeof inviteSchema>,
): Promise<ActionResult<{ inviteId: string; token: string }>> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const { session } = await requireProjectRole(parsed.data.projectId, "owner");

  const existingMember = await db.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      memberships: {
        where: { projectId: parsed.data.projectId },
      },
    },
  });

  if (existingMember?.memberships.length) {
    return { success: false, error: "Benutzer ist bereits Mitglied" };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const invite = await db.projectInvite.create({
    data: {
      projectId: parsed.data.projectId,
      email: parsed.data.email,
      role: parsed.data.role as ProjectRole,
      invitedBy: session.user.id,
      expiresAt,
    },
  });

  revalidatePath(`/projects/${parsed.data.projectId}/team`);
  return {
    success: true,
    data: { inviteId: invite.id, token: invite.token },
  };
}

export async function acceptInvite(
  token: string,
): Promise<ActionResult<{ projectId: string }>> {
  const session = await requireAuth();

  const invite = await db.projectInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    return { success: false, error: "Einladung nicht gefunden" };
  }

  if (invite.acceptedAt) {
    return { success: false, error: "Einladung bereits angenommen" };
  }

  if (invite.expiresAt < new Date()) {
    return { success: false, error: "Einladung abgelaufen" };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return { success: false, error: "Einladung gilt nicht für dieses Konto" };
  }

  await db.$transaction(async (tx) => {
    await tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: session.user.id,
        },
      },
      create: {
        projectId: invite.projectId,
        userId: session.user.id,
        role: invite.role,
      },
      update: { role: invite.role },
    });

    await tx.projectInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  revalidatePath("/");
  return { success: true, data: { projectId: invite.projectId } };
}

export async function listProjectMembers(projectId: string) {
  await requireProjectRole(projectId, "viewer");
  return db.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarInitials: true,
          image: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export async function listUserProjects() {
  const session = await requireAuth();
  return db.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        select: { id: true, slug: true, name: true, icon: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}
