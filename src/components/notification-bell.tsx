"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NOTIFICATION_TYPE_META } from "@/lib/activity-meta";
import type { SerializedNotification } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function NotificationBell({
  notifications,
  projectSlug,
}: {
  notifications: SerializedNotification[];
  projectSlug?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const preview = notifications.slice(0, 8);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    router.refresh();
  };

  const handleItemClick = async (notification: SerializedNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      router.refresh();
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex cursor-pointer items-center justify-center rounded-lg border p-2 transition-all",
            open
              ? "border-accent/40 bg-accent-dim text-accent"
              : "border-border/80 bg-surface-2/80 text-muted-foreground hover:border-accent/25 hover:text-foreground",
            unreadCount > 0 && !open && "text-accent",
          )}
          aria-label="Benachrichtigungen"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[0.58rem] font-bold text-accent-foreground shadow-sm ring-2 ring-surface">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[24rem] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border/80 bg-surface-2/80 px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold">Benachrichtigungen</p>
            <p className="text-[0.68rem] text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} ungelesen`
                : "Alles gelesen"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-[0.72rem] text-accent hover:text-accent"
              onClick={handleMarkAllRead}
            >
              Alle gelesen
            </Button>
          )}
        </div>

        {preview.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <BellOff
              className="mb-2 h-7 w-7 text-muted-foreground/50"
              strokeWidth={1.5}
            />
            <p className="text-[0.82rem] font-medium">Keine Benachrichtigungen</p>
            <p className="mt-1 text-[0.72rem] text-muted-foreground">
              Team-Aktivität erscheint hier.
            </p>
          </div>
        ) : (
          <div className="max-h-[22rem] overflow-y-auto">
            {preview.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "cursor-pointer gap-3 rounded-none border-b border-border/50 p-0 last:border-b-0",
                  !notification.read && "bg-accent-dim/35",
                )}
                asChild
              >
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => handleItemClick(notification)}
                    className="flex w-full items-start gap-3 px-3 py-3"
                  >
                    <NotificationContent notification={notification} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-3 py-3 text-left"
                    onClick={() => handleItemClick(notification)}
                  >
                    <NotificationContent notification={notification} />
                  </button>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {projectSlug && notifications.length > 0 && (
          <div className="border-t border-border/80 bg-surface-2/50 p-2">
            <Link
              href={`/p/${projectSlug}/notifications`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 rounded-md py-1.5 text-[0.75rem] font-medium text-accent hover:bg-accent-dim/50"
            >
              Alle Benachrichtigungen
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({
  notification,
}: {
  notification: SerializedNotification;
}) {
  const meta =
    NOTIFICATION_TYPE_META[notification.type] ??
    NOTIFICATION_TYPE_META.comment;
  const Icon = meta.icon;

  return (
    <>
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-surface-3"
        style={{ color: meta.color }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-[0.82rem] font-medium leading-snug">
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
          )}
        </div>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-[0.75rem] leading-snug text-muted-foreground">
            {notification.body}
          </p>
        )}
        <time
          className="mt-1 block text-[0.68rem] tabular-nums text-muted-foreground"
          dateTime={new Date(notification.createdAt).toISOString()}
        >
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: de,
          })}
        </time>
      </div>
    </>
  );
}
