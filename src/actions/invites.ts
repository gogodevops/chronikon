"use server";

import type { ProjectRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { getUserLandingPath } from "@/actions/projects";
import { signIn } from "@/auth";
import { requireAppAdmin, requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { generateInviteToken, inviteExpiresAt } from "@/lib/invite-token";
import { resolveInviteStatus } from "@/lib/invite-status";
import { sendUserInviteEmail } from "@/lib/mail";

const createUserInviteSchema = z.object({
  email: z.string().email("Ungültige E-Mail"),
  sendEmail: z.boolean().optional(),
});

const registerViaInviteSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().min(1, "Name erforderlich"),
    password: z.string().min(8, "Passwort mindestens 8 Zeichen"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function appBaseUrl(): string {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export type InviteLookup =
  | {
      kind: "project";
      token: string;
      email: string;
      expiresAt: Date;
      acceptedAt: Date | null;
      project: { name: string; slug: string; icon: string };
    }
  | {
      kind: "user";
      token: string;
      email: string;
      expiresAt: Date;
      acceptedAt: Date | null;
    };

export async function lookupInviteByToken(
  token: string,
): Promise<InviteLookup | null> {
  const [projectInvite, userInvite] = await Promise.all([
    db.projectInvite.findUnique({
      where: { token },
      include: {
        project: { select: { name: true, slug: true, icon: true } },
      },
    }),
    db.userInvite.findUnique({ where: { token } }),
  ]);

  if (projectInvite) {
    return {
      kind: "project",
      token: projectInvite.token,
      email: projectInvite.email,
      expiresAt: projectInvite.expiresAt,
      acceptedAt: projectInvite.acceptedAt,
      project: projectInvite.project,
    };
  }

  if (userInvite) {
    return {
      kind: "user",
      token: userInvite.token,
      email: userInvite.email,
      expiresAt: userInvite.expiresAt,
      acceptedAt: userInvite.acceptedAt,
    };
  }

  return null;
}

export async function listUserInvitesForAdmin() {
  await requireAppAdmin();

  const invites = await db.userInvite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { name: true, email: true } },
    },
  });

  const emails = [...new Set(invites.map((invite) => invite.email.toLowerCase()))];
  const users = emails.length
    ? await db.user.findMany({
        where: { email: { in: emails } },
        select: { email: true, createdAt: true },
      })
    : [];
  const userByEmail = new Map(
    users.map((user) => [user.email.toLowerCase(), user]),
  );

  return invites.map((invite) => {
    const user = userByEmail.get(invite.email.toLowerCase());
    return {
      id: invite.id,
      email: invite.email,
      token: invite.token,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
      invitedByName: invite.sender.name ?? invite.sender.email ?? "Admin",
      status: resolveInviteStatus({
        acceptedAt: invite.acceptedAt,
        expiresAt: invite.expiresAt,
        userRegistered: Boolean(user),
      }),
      registeredAt: user?.createdAt ?? null,
    };
  });
}

export async function createUserInvite(
  input: z.infer<typeof createUserInviteSchema>,
): Promise<ActionResult<{ token: string; emailSent?: boolean }>> {
  const session = await requireAppAdmin();

  const parsed = createUserInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const sendEmail = parsed.data.sendEmail ?? false;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "Nutzer ist bereits registriert" };
  }

  const pendingInvite = await db.userInvite.findFirst({
    where: {
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (pendingInvite) {
    return {
      success: false,
      error: "Für diese E-Mail liegt bereits eine offene Einladung vor",
    };
  }

  const invite = await db.userInvite.create({
    data: {
      email,
      token: generateInviteToken(),
      invitedBy: session.user.id,
      expiresAt: inviteExpiresAt(),
    },
  });

  let emailSent = false;
  if (sendEmail) {
    const inviteUrl = `${appBaseUrl()}/invite/${invite.token}`;
    const mail = await sendUserInviteEmail({
      to: email,
      inviteUrl,
      invitedBy: session.user.name ?? session.user.email ?? "Administrator",
    });
    emailSent = mail.ok;
  }

  revalidatePath("/admin/users");
  return { success: true, data: { token: invite.token, emailSent } };
}

export async function revokeUserInvite(inviteId: string): Promise<ActionResult> {
  await requireAppAdmin();

  const invite = await db.userInvite.findFirst({
    where: { id: inviteId, acceptedAt: null },
  });
  if (!invite) {
    return { success: false, error: "Einladung nicht gefunden" };
  }

  await db.userInvite.delete({ where: { id: inviteId } });
  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function acceptUserInvite(
  token: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await requireAuth();

  const invite = await db.userInvite.findUnique({ where: { token } });
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

  await db.userInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  revalidatePath("/admin/users");
  const redirectTo = await getUserLandingPath(session.user.id);
  return { success: true, data: { redirectTo } };
}

export async function registerViaInvite(
  input: z.infer<typeof registerViaInviteSchema>,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerViaInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const { token, name, password } = parsed.data;
  const invite = await lookupInviteByToken(token);
  if (!invite) {
    return { success: false, error: "Einladung ungültig" };
  }
  if (invite.acceptedAt) {
    return { success: false, error: "Einladung bereits angenommen" };
  }
  if (invite.expiresAt < new Date()) {
    return { success: false, error: "Einladung abgelaufen" };
  }

  const email = invite.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: "Konto existiert bereits — bitte anmelden",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (invite.kind === "project") {
    const projectInvite = await db.projectInvite.findUnique({
      where: { token },
    });
    if (!projectInvite) {
      return { success: false, error: "Einladung ungültig" };
    }

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email,
          passwordHash,
          avatarInitials: initials(name),
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: projectInvite.projectId,
          userId: user.id,
          role: projectInvite.role as ProjectRole,
        },
      });

      await tx.projectInvite.update({
        where: { id: projectInvite.id },
        data: { acceptedAt: new Date() },
      });
    });
  } else {
    const userInvite = await db.userInvite.findUnique({ where: { token } });
    if (!userInvite) {
      return { success: false, error: "Einladung ungültig" };
    }

    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name: name.trim(),
          email,
          passwordHash,
          avatarInitials: initials(name),
        },
      });

      await tx.userInvite.update({
        where: { id: userInvite.id },
        data: { acceptedAt: new Date() },
      });
    });
  }

  revalidatePath("/admin/users");

  const redirectTo =
    invite.kind === "project"
      ? `/p/${invite.project.slug}/dashboard`
      : await getUserLandingPath(
          (
            await db.user.findUniqueOrThrow({
              where: { email },
              select: { id: true },
            })
          ).id,
        );

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch {
    return {
      success: true,
      data: { redirectTo: `/login?callbackUrl=${encodeURIComponent(redirectTo)}` },
    };
  }

  return { success: true, data: { redirectTo } };
}
