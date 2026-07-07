"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, CircleHelp, MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import type { DiscussionFeedItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function DiscussionsView({
  items,
  projectSlug,
}: {
  items: DiscussionFeedItem[];
  projectSlug: string;
}) {
  const openCount = items.filter((i) => i.status === "open").length;

  return (
    <ViewFrame
      eyebrow="Team-Diskussion"
      title="Diskussionen"
      description={`${openCount} offene ${openCount === 1 ? "Frage" : "Fragen"} im Projekt`}
      maxWidth="lg"
    >
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-2/50 px-6 py-10 text-center">
          <CircleHelp
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium">Noch keine Fragen</p>
          <p className="mt-1 text-[0.78rem] text-muted-foreground">
            Fragen zu Einträgen erscheinen hier und im Dashboard-Feed.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface-2 p-3.5 transition-colors hover:border-accent/25 hover:bg-surface-3"
            >
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[0.62rem]">
                      {item.authorInitials ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[0.82rem] font-medium">{item.authorName}</p>
                    <time
                      className="text-[0.68rem] tabular-nums text-muted-foreground"
                      dateTime={new Date(item.createdAt).toISOString()}
                    >
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </time>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusPill open={item.status === "open"} />
                  <span className="rounded-md bg-surface-3 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {item.category}
                  </span>
                </div>
              </div>

              <p className="mb-2 text-[0.86rem] leading-relaxed">{item.text}</p>

              {item.passageRef && (
                <p className="mb-2.5 text-[0.75rem] text-muted-foreground">
                  Passage: {item.passageRef}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                {item.answerCount > 0 ? (
                  <span className="flex items-center gap-1 text-[0.72rem] text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {item.answerCount}{" "}
                    {item.answerCount === 1 ? "Antwort" : "Antworten"}
                  </span>
                ) : (
                  <span className="text-[0.72rem] text-muted-foreground">
                    Noch keine Antwort
                  </span>
                )}
                <Link
                  href={`/p/${projectSlug}?entry=${item.entryId}`}
                  className="flex items-center gap-1 text-[0.78rem] text-accent hover:underline"
                >
                  <span className="truncate">{item.entryTitle}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </ViewFrame>
  );
}

function StatusPill({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
        open ? "bg-orange-500/15 text-orange-400" : "bg-green/15 text-green",
      )}
    >
      {open ? "Offen" : "Erledigt"}
    </span>
  );
}
