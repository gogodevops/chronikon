"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(8, "Passwort mindestens 8 Zeichen"),
});

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export async function registerUser(
  input: z.infer<typeof registerSchema>,
): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "E-Mail bereits registriert" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      avatarInitials: initials(name),
    },
  });

  return { success: true, data: { userId: user.id } };
}
