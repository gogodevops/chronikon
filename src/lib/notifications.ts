import { db } from "@/lib/db";

export type NotificationPayload = {
  type: string;
  title: string;
  body?: string;
  link?: string;
};

export async function notifyUsers(
  userIds: string[],
  payload: NotificationPayload,
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;

  await db.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
    })),
  });
}

export async function notifyProjectMembers(
  projectId: string,
  excludeUserId: string,
  payload: NotificationPayload,
) {
  const members = await db.projectMember.findMany({
    where: { projectId, userId: { not: excludeUserId } },
    select: { userId: true },
  });
  await notifyUsers(
    members.map((m) => m.userId),
    payload,
  );
}

export async function projectEntryLink(
  projectId: string,
  entryId: string,
  tab?: string,
): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  const base = `/p/${project?.slug ?? projectId}?entry=${entryId}`;
  return tab ? `${base}&tab=${tab}` : base;
}

/** Parse @Name mentions from comment text and resolve to user ids in project */
export async function resolveMentionUserIds(
  text: string,
  projectId: string,
): Promise<string[]> {
  const matches = text.match(/@([\w.+-]+@[\w.-]+|\w+(?:\s+\w+)?)/g);
  if (!matches) return [];

  const members = await db.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return members
    .filter((m) =>
      matches.some((mention) => {
        const q = mention.slice(1).toLowerCase();
        return (
          m.user.email.toLowerCase().includes(q) ||
          (m.user.name?.toLowerCase().includes(q) ?? false)
        );
      }),
    )
    .map((m) => m.user.id);
}
