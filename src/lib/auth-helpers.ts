import type { ProjectRole } from "@prisma/client";

import { auth } from "@/auth";
import { PROJECT_ROLE_RANK } from "@/lib/constants";
import { db } from "@/lib/db";

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
