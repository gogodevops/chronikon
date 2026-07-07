"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { requireAppAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const createUserSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(8, "Passwort mindestens 8 Zeichen"),
});

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
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

export async function createAppUser(
  input: z.infer<typeof createUserSchema>,
): Promise<ActionResult<{ userId: string }>> {
  await requireAppAdmin();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return { success: false, error: "E-Mail bereits vergeben" };
  }

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      avatarInitials: initials(name),
    },
  });

  revalidatePath("/admin/users");
  return { success: true, data: { userId: user.id } };
}
