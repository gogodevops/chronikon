"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { de } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import { NOTIFICATION_TYPE_META } from "@/lib/activity-meta";
import type { SerializedNotification } from "@/lib/queries";
import { cn } from "@/lib/utils";

function groupLabel(date: Date): string {
  if (isToday(date)) return "Heute";
  if (isYesterday(date)) return "Gestern";
  return "Früher";
}

export function NotificationsView({
  notifications,
}: {
  notifications: SerializedNotification[];
  projectSlug?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const groups = React.useMemo(() => {
    const map = new Map<string, SerializedNotification[]>();
    for (const n of filtered) {
      const label = groupLabel(new Date(n.createdAt));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    return [...map.entries()];
  }, [filtered]);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    router.refresh();
  };

  const handleClick = async (n: SerializedNotification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      router.refresh();
    }
  };

  return (
    <ViewFrame
      eyebrow="Persönlich"
      title="Benachrichtigungen"
      description={
        unreadCount > 0
          ? `${unreadCount} ungelesen`
          : "Alles gelesen — Team-Aktivität erscheint hier."
      }
      maxWidth="md"
      actions={
        unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-accent/30 text-accent hover:bg-accent-dim"
            onClick={handleMarkAll}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Alle gelesen
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex gap-1 rounded-lg bg-surface-2/60 p-1">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-[0.78rem] font-medium transition-all",
              filter === f
                ? "bg-accent-dim text-accent shadow-[inset_0_0_0_1px_rgba(196,163,90,0.2)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all" ? "Alle" : `Ungelesen (${unreadCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 px-6 py-12 text-center">
          <Bell
            className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40"
            strokeWidth={1.25}
          />
          <p className="text-sm font-medium">
            {filter === "unread" ? "Keine ungelesenen" : "Keine Benachrichtigungen"}
          </p>
          <p className="mt-1 text-[0.78rem] text-muted-foreground">
            Fragen, Kommentare und Änderungen im Team erscheinen hier.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([label, items]) => (
            <section key={label}>
              <h3 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </h3>
              <ul className="space-y-2">
                {items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onClick={() => handleClick(n)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </ViewFrame>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: SerializedNotification;
  onClick: () => void;
}) {
  const meta =
    NOTIFICATION_TYPE_META[notification.type] ??
    NOTIFICATION_TYPE_META.comment;
  const Icon = meta.icon;

  const inner = (
    <>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-surface-3"
        style={{ color: meta.color }}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-[0.85rem] font-medium leading-snug">
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
          )}
        </div>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-[0.78rem] text-muted-foreground">
            {notification.body}
          </p>
        )}
        <time className="mt-1 block text-[0.68rem] tabular-nums text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: de,
          })}
        </time>
      </div>
    </>
  );

  const className = cn(
    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
    !notification.read
      ? "border-accent/25 bg-accent-dim/30 hover:border-accent/40"
      : "border-border/60 bg-surface-2/50 hover:border-border hover:bg-surface-3/50",
  );

  if (notification.link) {
    return (
      <li>
        <Link href={notification.link} onClick={onClick} className={className}>
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    </li>
  );
}
