import { db } from "@/lib/db";
import { deleteStoredFiles } from "@/lib/storage";

/** Collect an entry id and all descendant entry ids (child books / sub-entries). */
export async function collectDescendantEntryIds(
  rootId: string,
): Promise<string[]> {
  const ids = [rootId];
  let queue = [rootId];

  while (queue.length > 0) {
    const children = await db.entry.findMany({
      where: { parentEntryId: { in: queue } },
      select: { id: true },
    });
    const childIds = children.map((child) => child.id);
    ids.push(...childIds);
    queue = childIds;
  }

  return ids;
}

export async function deleteAttachmentFilesForEntries(
  entryIds: string[],
): Promise<void> {
  if (entryIds.length === 0) return;

  const attachments = await db.attachment.findMany({
    where: { entryId: { in: entryIds } },
    select: { storageKey: true },
  });

  await deleteStoredFiles(attachments.map((attachment) => attachment.storageKey));
}

export async function deleteAttachmentFilesForProject(
  projectId: string,
): Promise<void> {
  const attachments = await db.attachment.findMany({
    where: { entry: { projectId } },
    select: { storageKey: true },
  });

  await deleteStoredFiles(attachments.map((attachment) => attachment.storageKey));
}
