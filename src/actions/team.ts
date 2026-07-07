"use server";

import type { ProjectRole } from "@prisma/client";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { requireProjectRole } from "@/lib/auth-helpers";
import { ROLE_META } from "@/lib/constants";
import { db } from "@/lib/db";
import { generateInviteToken, inviteExpiresAt } from "@/lib/invite-token";
import { sendProjectInviteEmail } from "@/lib/mail";
import { revalidateProject } from "@/lib/revalidate-project";

const roleSchema = z.enum(["owner", "editor", "commenter", "viewer"]);

const addMemberSchema = z.object({
  projectId: z.string().cuid(),
  email: z.string().email(),
  role: roleSchema.default("commenter"),
  sendEmail: z.boolean().optional(),
});

const updateRoleSchema = z.object({
  projectId: z.string().cuid(),
  memberId: z.string().cuid(),
  role: roleSchema,
});

function appBaseUrl(): string {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
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
): Promise<
  ActionResult<{
    memberId?: string;
    inviteToken?: string;
    emailSent?: boolean;
    emailError?: string;
  }>
> {
  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const { session } = await requireProjectRole(parsed.data.projectId, "owner");

  const email = parsed.data.email.toLowerCase().trim();
  const sendEmail = parsed.data.sendEmail ?? false;
  const project = await db.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { name: true, slug: true },
  });
  if (!project) {
    return { success: false, error: "Projekt nicht gefunden" };
  }

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

  const invite = await db.projectInvite.create({
    data: {
      projectId: parsed.data.projectId,
      email,
      role: parsed.data.role as ProjectRole,
      token: generateInviteToken(),
      invitedBy: session.user.id,
      expiresAt: inviteExpiresAt(),
    },
  });

  let emailSent = false;
  let emailError: string | undefined;
  if (sendEmail) {
    const inviteUrl = `${appBaseUrl()}/invite/${invite.token}`;
    const mail = await sendProjectInviteEmail({
      to: email,
      projectName: project.name,
      inviteUrl,
      invitedBy: session.user.name ?? session.user.email ?? "Administrator",
      roleLabel: ROLE_META[parsed.data.role].label,
    });
    emailSent = mail.ok;
    if (!mail.ok) {
      emailError = mail.error;
    }
  }

  await revalidateProject(parsed.data.projectId);
  return {
    success: true,
    data: { inviteToken: invite.token, emailSent, emailError },
  };
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
