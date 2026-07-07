"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import {
  getSession,
  INVALID_SESSION_ERROR,
  isAppAdmin,
  isForeignKeyViolation,
  requireAuth,
  requireProjectRole,
  verifySessionUserExists,
} from "@/lib/auth-helpers";
import {
  deleteAttachmentFilesForProject,
} from "@/lib/cleanup";
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
  icon: z.string().min(1).max(16).default("✦"),
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

  return "/app";
}

export async function createProject(
  input: z.infer<typeof createProjectSchema>,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
      };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: INVALID_SESSION_ERROR,
      };
    }

    if (!(await verifySessionUserExists(session.user.id))) {
      return { success: false, error: INVALID_SESSION_ERROR };
    }

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

    try {
      const cookieStore = await cookies();
      cookieStore.set(PROJECT_COOKIE, project.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } catch {
      /* Cookie optional — Projekt wurde trotzdem angelegt */
    }

    revalidatePath("/");
    return { success: true, data: { slug: project.slug } };
  } catch (error) {
    console.error("createProject failed:", error);
    if (isForeignKeyViolation(error)) {
      return { success: false, error: INVALID_SESSION_ERROR };
    }
    const message =
      error instanceof Error ? error.message : "Projekt konnte nicht angelegt werden";
    if (message.includes("DATABASE_URL")) {
      return { success: false, error: "Datenbank nicht erreichbar — bitte später erneut versuchen." };
    }
    return { success: false, error: message };
  }
}

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

  const admin = await isAppAdmin(session.user.id);
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

    if (admin) {
      const project = await db.project.findUnique({
        where: { id: cookieProjectId },
        select: { id: true },
      });
      if (project) return cookieProjectId;
    }
  }

  const firstMembership = await db.projectMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { projectId: true },
  });

  if (firstMembership) return firstMembership.projectId;

  if (admin) {
    const firstProject = await db.project.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    return firstProject?.id ?? null;
  }

  return null;
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

  if (await isAppAdmin(session.user.id)) {
    const projects = await db.project.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, icon: true },
    });
    return projects.map((project) => ({
      projectId: project.id,
      userId: session.user.id,
      role: "owner" as const,
      joinedAt: new Date(0),
      project,
    }));
  }

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

export async function deleteProject(
  projectId: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: INVALID_SESSION_ERROR };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, slug: true, name: true },
    });

    if (!project) {
      return { success: false, error: "Ober-Thema nicht gefunden" };
    }

    const admin = await isAppAdmin(session.user.id);
    if (!admin) {
      await requireProjectRole(projectId, "owner");
    }

    const cookieStore = await cookies();
    if (cookieStore.get(PROJECT_COOKIE)?.value === projectId) {
      cookieStore.delete(PROJECT_COOKIE);
    }

    await deleteAttachmentFilesForProject(projectId);
    await db.project.delete({ where: { id: projectId } });

    const redirectTo = "/app";

    revalidatePath("/");
    revalidatePath("/app");
    revalidatePath(`/p/${project.slug}`, "layout");

    return { success: true, data: { redirectTo } };
  } catch (error) {
    console.error("deleteProject failed:", error);
    const message =
      error instanceof Error ? error.message : "Ober-Thema konnte nicht gelöscht werden";
    return { success: false, error: message };
  }
}
