"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/actions/auth";
import { isAppAdmin, requireAppAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

function getAdminEmails(): string[] {
  return [
    process.env.SEED_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    "admin@chronikon.dev",
  ]
    .filter(Boolean)
    .map((email) => email!.toLowerCase());
}

async function countAppAdmins(): Promise<number> {
  const adminEmails = getAdminEmails();
  return db.user.count({
    where: {
      OR: [
        { isAdmin: true },
        ...(adminEmails.length > 0
          ? [{ email: { in: adminEmails, mode: "insensitive" as const } }]
          : []),
      ],
    },
  });
}

export async function listAppUsers() {
  await requireAppAdmin();
  return db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      avatarInitials: true,
      _count: { select: { memberships: true } },
    },
  });
}

export async function deleteAppUser(userId: string): Promise<ActionResult> {
  try {
    const session = await requireAppAdmin();

    if (userId === session.user.id) {
      return { success: false, error: "Du kannst dich nicht selbst entfernen" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "Nutzer nicht gefunden" };
    }

    if (await isAppAdmin(userId)) {
      const adminCount = await countAppAdmins();
      if (adminCount <= 1) {
        return {
          success: false,
          error: "Der letzte App-Administrator kann nicht entfernt werden",
        };
      }
    }

    await db.$transaction(async (tx) => {
      await tx.userInvite.deleteMany({ where: { invitedBy: userId } });
      await tx.projectInvite.deleteMany({ where: { invitedBy: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    revalidatePath("/admin/users");
    revalidatePath("/app");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}
