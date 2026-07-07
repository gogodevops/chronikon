"use server";

import { revalidatePath } from "next/cache";

import { requireAppAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

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
