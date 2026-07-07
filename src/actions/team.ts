"use server";

import type { ProjectRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { requireAppAdmin, requireProjectRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { revalidateProject } from "@/lib/revalidate-project";

const roleSchema = z.enum(["owner", "editor", "commenter", "viewer"]);

const addMemberSchema = z.object({
  projectId: z.string().cuid(),
  email: z.string().email(),
  role: roleSchema.default("commenter"),
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
});

const updateRoleSchema = z.object({
  projectId: z.string().cuid(),
  memberId: z.string().cuid(),
  role: roleSchema,
});

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

async function countOwners(projectId: string): Promise<number> {
  return db.projectMember.count({
    where: { projectId, role: "owner" },
  });
}

export async function getTeamData(projectId: string) {
  const { session } = await requireProjectRole(projectId, "owner");

  const [members, invites] = await Promise.all([
    db.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarInitials: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ role: "desc" }, { joinedAt: "asc" }],
    }),
    db.projectInvite.findMany({
      where: { projectId, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: {
        sender: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    currentUserId: session.user.id,
    members: members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      role: m.role,
      joinedAt: m.joinedAt,
      name: m.user.name ?? "Unbekannt",
      email: m.user.email,
      avatarInitials: m.user.avatarInitials,
      image: m.user.image,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      token: i.token,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
      invitedByName: i.sender.name ?? "Admin",
    })),
  };
}

export async function addProjectMember(
  input: z.infer<typeof addMemberSchema>,
): Promise<ActionResult<{ memberId?: string; inviteToken?: string }>> {
  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  await requireProjectRole(parsed.data.projectId, "owner");

  const email = parsed.data.email.toLowerCase().trim();
  const existingUser = await db.user.findUnique({
    where: { email },
    include: {
      memberships: { where: { projectId: parsed.data.projectId } },
    },
  });

  if (existingUser?.memberships.length) {
    return { success: false, error: "Benutzer ist bereits Mitglied" };
  }

  if (existingUser) {
    const member = await db.projectMember.create({
      data: {
        projectId: parsed.data.projectId,
        userId: existingUser.id,
        role: parsed.data.role as ProjectRole,
      },
    });
    await revalidateProject(parsed.data.projectId);
    return { success: true, data: { memberId: member.id } };
  }

  if (!parsed.data.name || !parsed.data.password) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { session } = await requireProjectRole(parsed.data.projectId, "owner");
    const invite = await db.projectInvite.create({
      data: {
        projectId: parsed.data.projectId,
        email,
        role: parsed.data.role as ProjectRole,
        invitedBy: session.user.id,
        expiresAt,
      },
    });

    await revalidateProject(parsed.data.projectId);
    return {
      success: true,
      data: { inviteToken: invite.token },
    };
  }

  await requireAppAdmin();

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      avatarInitials: initials(parsed.data.name),
    },
  });

  const member = await db.projectMember.create({
    data: {
      projectId: parsed.data.projectId,
      userId: user.id,
      role: parsed.data.role as ProjectRole,
    },
  });

  await revalidateProject(parsed.data.projectId);
  return { success: true, data: { memberId: member.id } };
}

export async function updateMemberRole(
  input: z.infer<typeof updateRoleSchema>,
): Promise<ActionResult> {
  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const { session } = await requireProjectRole(parsed.data.projectId, "owner");

  const member = await db.projectMember.findFirst({
    where: { id: parsed.data.memberId, projectId: parsed.data.projectId },
  });

  if (!member) {
    return { success: false, error: "Mitglied nicht gefunden" };
  }

  if (member.role === "owner" && parsed.data.role !== "owner") {
    const owners = await countOwners(parsed.data.projectId);
    if (owners <= 1) {
      return {
        success: false,
        error: "Mindestens ein Admin muss im Projekt bleiben",
      };
    }
  }

  if (member.userId === session.user.id && parsed.data.role !== "owner") {
    const owners = await countOwners(parsed.data.projectId);
    if (owners <= 1 && member.role === "owner") {
      return {
        success: false,
        error: "Du bist der einzige Admin — Rolle kann nicht geändert werden",
      };
    }
  }

  await db.projectMember.update({
    where: { id: parsed.data.memberId },
    data: { role: parsed.data.role as ProjectRole },
  });

  await revalidateProject(parsed.data.projectId);
  return { success: true, data: undefined };
}

export async function removeProjectMember(
  projectId: string,
  memberId: string,
): Promise<ActionResult> {
  const { session } = await requireProjectRole(projectId, "owner");

  const member = await db.projectMember.findFirst({
    where: { id: memberId, projectId },
  });

  if (!member) {
    return { success: false, error: "Mitglied nicht gefunden" };
  }

  if (member.role === "owner") {
    const owners = await countOwners(projectId);
    if (owners <= 1) {
      return {
        success: false,
        error: "Der letzte Admin kann nicht entfernt werden",
      };
    }
  }

  if (member.userId === session.user.id) {
    return { success: false, error: "Du kannst dich nicht selbst entfernen" };
  }

  await db.projectMember.delete({ where: { id: memberId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function revokeProjectInvite(
  projectId: string,
  inviteId: string,
): Promise<ActionResult> {
  await requireProjectRole(projectId, "owner");

  const invite = await db.projectInvite.findFirst({
    where: { id: inviteId, projectId, acceptedAt: null },
  });

  if (!invite) {
    return { success: false, error: "Einladung nicht gefunden" };
  }

  await db.projectInvite.delete({ where: { id: inviteId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}
