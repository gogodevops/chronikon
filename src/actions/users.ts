"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { requireAppAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { generatePassword } from "@/lib/generate-password";
import { sendWelcomeEmail } from "@/lib/mail";

const createUserSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(8, "Passwort mindestens 8 Zeichen").optional(),
  sendEmail: z.boolean().optional(),
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
): Promise<
  ActionResult<{
    userId: string;
    emailSent?: boolean;
    temporaryPassword?: string;
  }>
> {
  const session = await requireAppAdmin();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
    };
  }

  const { name, email, sendEmail } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const password = parsed.data.password ?? (sendEmail ? generatePassword() : "");

  if (!password || password.length < 8) {
    return {
      success: false,
      error: "Passwort mindestens 8 Zeichen — oder „Per E-Mail senden“ aktivieren",
    };
  }

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

  let emailSent = false;
  if (sendEmail) {
    const mail = await sendWelcomeEmail({
      to: normalizedEmail,
      name: name.trim(),
      password,
      invitedBy: session.user.name ?? session.user.email ?? "Administrator",
    });
    emailSent = mail.ok;
  }

  revalidatePath("/admin/users");
  return {
    success: true,
    data: {
      userId: user.id,
      emailSent,
      temporaryPassword: emailSent ? undefined : password,
    },
  };
}
