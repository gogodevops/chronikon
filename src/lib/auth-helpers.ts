import type { ProjectRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { PROJECT_ROLE_RANK } from "@/lib/constants";
import { db } from "@/lib/db";

export const INVALID_SESSION_ERROR =
  "Sitzung ungültig — bitte abmelden und erneut anmelden";

export function isForeignKeyViolation(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Foreign key constraint violated") &&
    message.includes("ProjectMember_userId_fkey")
  );
}

export async function verifySessionUserExists(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return Boolean(user);
}

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Nicht angemeldet");
  }
  return session;
}

export async function requireProjectRole(
  projectId: string,
  minRole: ProjectRole = "viewer",
) {
  const session = await requireAuth();
  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("Kein Zugriff auf dieses Projekt");
  }

  if (PROJECT_ROLE_RANK[membership.role] < PROJECT_ROLE_RANK[minRole]) {
    throw new Error("Unzureichende Berechtigung");
  }

  return { session, membership };
}

export async function getUserProjectRole(
  projectId: string,
  userId: string,
): Promise<ProjectRole | null> {
  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
    select: { role: true },
  });
  return membership?.role ?? null;
}

export async function isAppAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, email: true },
  });
  if (!user) return false;
  if (user.isAdmin) return true;

  const adminEmails = [
    process.env.SEED_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    "admin@chronikon.dev",
  ]
    .filter(Boolean)
    .map((e) => e!.toLowerCase());

  return adminEmails.includes(user.email.toLowerCase());
}

export async function requireAppAdmin() {
  const session = await requireAuth();
  if (!(await isAppAdmin(session.user.id))) {
    throw new Error("Nur für App-Administratoren");
  }
  return session;
}
