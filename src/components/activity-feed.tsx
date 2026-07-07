"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, Inbox } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ACTIVITY_META } from "@/lib/activity-meta";
import type { ActivityItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ActivityFeed({
  items,
  projectSlug,
  compact = false,
}: {
  items: ActivityItem[];
  projectSlug: string;
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/50 px-6 py-12 text-center">
        <Inbox className="mb-3 h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm font-medium text-foreground">Noch keine Aktivität</p>
        <p className="mt-1 max-w-xs text-[0.78rem] text-muted-foreground">
          Sobald Teammitglieder Einträge, Fragen oder Kommentare hinzufügen,
          erscheinen sie hier.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => {
        const meta = ACTIVITY_META[item.kind];
        const Icon = meta.icon;
        const isLast = index === items.length - 1;
        const slug = item.projectSlug ?? projectSlug;

        return (
          <li key={item.id} className="relative flex gap-3">
            {!isLast && (
              <span
                className="absolute left-[15px] top-9 bottom-0 w-px bg-border"
                aria-hidden
              />
            )}

            <div
              className="relative z-10 mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-3"
              style={{ color: meta.color }}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </div>

            <Link
              href={`/p/${slug}?entry=${item.entryId}`}
              className={cn(
                "group mb-2 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 transition-all hover:border-accent/30 hover:bg-surface-3 hover:shadow-[0_2px_12px_rgba(0,0,0,0.18)]",
                compact ? "px-3 py-2.5" : "px-4 py-3",
              )}
            >
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[0.58rem]">
                      {item.authorInitials ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 text-[0.8rem] leading-snug">
                    <span className="font-medium">{item.authorName}</span>
                    <span className="text-muted-foreground"> {meta.verb}</span>
                  </p>
                </div>
                <time
                  className="shrink-0 text-[0.68rem] tabular-nums text-muted-foreground"
                  dateTime={new Date(item.createdAt).toISOString()}
                >
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </time>
              </div>

              <p
                className={cn(
                  "text-muted-foreground leading-snug",
                  compact ? "text-[0.78rem] line-clamp-1" : "text-[0.82rem] line-clamp-2",
                )}
              >
                {item.summary}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide"
                  style={{
                    color: meta.color,
                    background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
                  }}
                >
                  {meta.label}
                  {item.meta ? ` · ${item.meta}` : ""}
                </span>
                <span className="flex min-w-0 items-center gap-1 text-[0.75rem] text-accent opacity-80 transition-opacity group-hover:opacity-100">
                  {item.projectName && (
                    <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                      {item.projectName} ·
                    </span>
                  )}
                  <span className="truncate">{item.entryTitle}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
