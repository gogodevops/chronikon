"use server";

import type { ActionResult } from "@/actions/auth";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getNotifications, type SerializedNotification } from "@/lib/queries";

export async function fetchNotifications(): Promise<
  ActionResult<SerializedNotification[]>
> {
  try {
    const session = await requireAuth();
    const notifications = await getNotifications(session.user.id);
    return { success: true, data: notifications };
  } catch {
    return { success: false, error: "Benachrichtigungen konnten nicht geladen werden" };
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId: session.user.id },
    });
    if (!notification) {
      return { success: false, error: "Benachrichtigung nicht gefunden" };
    }
    await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Fehler beim Aktualisieren" };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await db.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Fehler beim Aktualisieren" };
  }
}
