"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Trash2 } from "lucide-react";
import { SOURCE_TYPE_LABELS } from "@/lib/constants";
import type {
  SerializedClaim,
  SerializedComment,
  SerializedEntryVersion,
  SerializedQuestion,
  SerializedRelation,
  SerializedSource,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export function SourcesList({
  sources,
  onNavigate,
  onDelete,
  canEdit = true,
}: {
  sources: SerializedSource[];
  onNavigate?: (entryId: string) => void;
  onDelete?: (sourceId: string) => void;
  canEdit?: boolean;
}) {
  if (sources.length === 0) {
    return (
      <p className="mb-3 text-[0.82rem] text-muted-foreground">
        Noch keine Quellen ausgeschrieben — unten ergänzen.
      </p>
    );
  }

  return (
    <div className="mb-3 space-y-2">
      {sources.map((s) => (
        <div
          key={s.id}
          className={cn(
            "relative rounded-xl border border-border/70 bg-surface-2/60 p-3 pr-9 text-[0.82rem] transition-colors hover:border-border",
            s.type === "primary" && "border-l-[3px] border-l-green/80",
            s.type === "secondary" && "border-l-[3px] border-l-blue/80",
          )}
        >
          {canEdit && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              className="absolute right-2 top-2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Quelle löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="font-medium">{s.title}</div>
          <div className="mt-0.5 text-[0.72rem] text-muted-foreground">
            {SOURCE_TYPE_LABELS[s.type as keyof typeof SOURCE_TYPE_LABELS] ??
              s.type}
            {s.ref ? ` · ${s.ref}` : ""}
            {s.linkedEntryId && s.linkedEntryTitle ? (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => onNavigate?.(s.linkedEntryId!)}
                  className="cursor-pointer text-accent hover:underline"
                >
                  → {s.linkedEntryTitle}
                </button>
              </>
            ) : null}
          </div>
          {s.note && (
            <div className="mt-1 text-[0.78rem] text-muted-foreground">
              {s.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ClaimsList({
  claims,
  onDelete,
  canEdit = true,
}: {
  claims: SerializedClaim[];
  onDelete?: (claimId: string) => void;
  canEdit?: boolean;
}) {
  if (claims.length === 0) {
    return (
      <p className="mb-3 text-[0.82rem] text-muted-foreground">
        Noch keine Behauptungen — unten eine formulieren.
      </p>
    );
  }

  return (
    <div className="mb-3 space-y-2">
      {claims.map((c) => (
        <div
          key={c.id}
          className="relative flex gap-2 rounded-xl border border-border/70 bg-surface-2/60 p-3 pr-9"
        >
          {canEdit && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(c.id)}
              className="absolute right-2 top-2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Behauptung löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <span
            className="h-fit shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-medium"
            style={{
              background: `${c.confidenceColor}22`,
              color: c.confidenceColor,
            }}
          >
            {c.confidenceLabel}
          </span>
          <div className="min-w-0 text-[0.82rem]">
            <p>{c.text}</p>
            {c.authorName && (
              <p className="mt-1 text-[0.72rem] text-muted-foreground">
                {c.authorName}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscussionFeed({
  questions,
  comments,
  onAnswer,
  onDeleteQuestion,
  onDeleteComment,
  onStartQuestion,
  onStartComment,
  canDiscuss = true,
}: {
  questions: SerializedQuestion[];
  comments: SerializedComment[];
  onAnswer?: (questionId: string, text: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onStartQuestion?: () => void;
  onStartComment?: () => void;
  canDiscuss?: boolean;
}) {
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>(
    {},
  );

  if (questions.length === 0 && comments.length === 0) {
    return (
      <div className="mb-3">
        <p className="text-[0.82rem] text-muted-foreground">
          Noch keine Fragen oder Kommentare.
        </p>
        {canDiscuss && (onStartQuestion || onStartComment) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {onStartQuestion && (
              <button
                type="button"
                onClick={onStartQuestion}
                className="cursor-pointer rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[0.72rem] text-accent hover:border-accent hover:bg-accent-dim"
              >
                + Frage stellen
              </button>
            )}
            {onStartComment && (
              <button
                type="button"
                onClick={onStartComment}
                className="cursor-pointer rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[0.72rem] text-accent hover:border-accent hover:bg-accent-dim"
              >
                + Kommentieren
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 space-y-3">
      {questions.map((q) => (
        <div
          key={q.id}
          className={cn(
            "relative rounded-xl border border-border/70 bg-surface-2/60 p-3 pr-9",
            q.status === "resolved" && "opacity-85",
          )}
        >
          {canDiscuss && onDeleteQuestion && (
            <button
              type="button"
              onClick={() => onDeleteQuestion(q.id)}
              className="absolute right-2 top-2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Frage löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[0.65rem] font-medium">
              {q.authorInitials ?? "?"}
            </span>
            <span className="text-[0.78rem] font-medium">{q.authorName}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[0.65rem]",
                q.status === "open"
                  ? "bg-accent-dim text-accent"
                  : "bg-[#4caf8222] text-[#4caf82]",
              )}
            >
              {q.status === "open" ? "Offen" : "Gelöst"}
            </span>
          </div>
          <div className="mb-1 text-[0.72rem] text-muted-foreground">
            {q.category}
            {q.passageRef ? ` · ${q.passageRef}` : ""}
          </div>
          <p className="text-[0.82rem]">{q.text}</p>
          {q.answers.map((a) => (
            <div
              key={a.id}
              className="mt-2 rounded-md border-l-2 border-accent bg-surface-3 p-2 text-[0.8rem]"
            >
              ✓ {a.text}
              <span className="ml-2 text-[0.72rem] text-muted-foreground">
                — {a.authorName}
              </span>
            </div>
          ))}
          {q.status === "open" && onAnswer && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Antwort / Lösung eintragen…"
                value={replyDrafts[q.id] ?? ""}
                onChange={(e) =>
                  setReplyDrafts((d) => ({ ...d, [q.id]: e.target.value }))
                }
                className="h-8 text-[0.78rem]"
              />
              <Button
                size="sm"
                variant="accent"
                onClick={() => {
                  const text = replyDrafts[q.id]?.trim();
                  if (!text) return;
                  onAnswer(q.id, text);
                  setReplyDrafts((d) => ({ ...d, [q.id]: "" }));
                }}
              >
                Als gelöst
              </Button>
            </div>
          )}
        </div>
      ))}

      {comments.map((c) => (
        <div
          key={c.id}
          className="relative rounded-xl border border-border/70 bg-surface-2/60 p-3 pr-9"
        >
          {canDiscuss && onDeleteComment && (
            <button
              type="button"
              onClick={() => onDeleteComment(c.id)}
              className="absolute right-2 top-2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Kommentar löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[0.65rem] font-medium">
              {c.authorInitials ?? "?"}
            </span>
            <span className="text-[0.78rem] font-medium">{c.authorName}</span>
          </div>
          <p className="text-[0.82rem]">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

export function RelationsList({
  relations,
  onNavigate,
  onDelete,
  canEdit = true,
}: {
  relations: SerializedRelation[];
  onNavigate?: (entryId: string, projectSlug?: string) => void;
  onDelete?: (relationId: string) => void;
  canEdit?: boolean;
}) {
  if (relations.length === 0) {
    return (
      <p className="mb-3 text-[0.82rem] text-muted-foreground">
        Keine Verknüpfungen — unten anlegen.
      </p>
    );
  }

  return (
    <div className="mb-3 space-y-1.5">
      {relations.map((r) => (
        <div key={r.id} className="relative">
          <button
            type="button"
            onClick={() =>
              onNavigate?.(r.otherEntryId, r.otherEntryProjectSlug ?? undefined)
            }
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-surface-2/60 p-2.5 pr-9 text-left text-[0.82rem] transition-all hover:border-accent/30 hover:bg-surface-3/50"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: r.otherEntryTypeColor }}
            />
            <span className="min-w-0 flex-1 truncate">
              {r.typeLabel}: <strong className="font-medium">{r.otherEntryTitle}</strong>
              {r.isCrossProject && r.otherEntryProjectName && (
                <span className="ml-1.5 text-[0.68rem] font-normal text-accent">
                  {r.otherEntryProjectIcon} {r.otherEntryProjectName}
                </span>
              )}
            </span>
          </button>
          {canEdit && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(r.id)}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Verknüpfung löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function formatVersionDate(date: Date | string, style: "short" | "long") {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function versionAuthorLabel(version: SerializedEntryVersion) {
  if (version.changedByName) return version.changedByName;
  if (version.changedByEmail) return version.changedByEmail;
  return "Unbekannt";
}

export function VersionsList({
  versions,
}: {
  versions: SerializedEntryVersion[];
}) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  if (versions.length === 0) {
    return (
      <p className="text-[0.82rem] text-muted-foreground">
        Noch keine früheren Versionen — erscheint nach der ersten Bearbeitung.
      </p>
    );
  }

  const allExpanded = expandedIds.size === versions.length;

  const toggleVersion = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(versions.map((v) => v.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <div className="space-y-2">
      {versions.length > 1 && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={expandAll}
            disabled={allExpanded}
            className="cursor-pointer text-[0.72rem] text-accent hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
          >
            Alle aufklappen
          </button>
          <span className="text-[0.72rem] text-muted-foreground">·</span>
          <button
            type="button"
            onClick={collapseAll}
            disabled={expandedIds.size === 0}
            className="cursor-pointer text-[0.72rem] text-accent hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
          >
            Alle einklappen
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {versions.map((version) => {
          const { snapshot } = version;
          const isOpen = expandedIds.has(version.id);
          const eventLabel =
            version.eventKind === "created" ? "Eintrag angelegt" : "Bearbeitet";

          return (
            <li
              key={version.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border/70 bg-surface-2/50 transition-colors",
                isOpen && "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => toggleVersion(version.id)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-3/30"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                    !isOpen && "-rotate-90",
                  )}
                />
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-[0.68rem] font-medium",
                    version.eventKind === "created"
                      ? "bg-green/15 text-green"
                      : "bg-accent-dim/60 text-accent",
                  )}
                >
                  {eventLabel}
                </span>
                <time
                  className="min-w-0 shrink truncate text-[0.72rem] text-muted-foreground"
                  dateTime={new Date(version.createdAt).toISOString()}
                >
                  {formatVersionDate(version.createdAt, "short")}
                </time>
                <span className="min-w-0 flex-1 truncate text-[0.72rem] text-muted-foreground">
                  {versionAuthorLabel(version)}
                </span>
                <span className="shrink-0 text-[0.68rem] text-accent">
                  {isOpen ? "Einklappen" : "Aufklappen"}
                </span>
              </button>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-3 border-t border-border/50 px-3.5 pb-3.5 pt-2">
                    <div className="rounded-lg border border-border/50 bg-surface-1/40 px-3 py-2.5">
                      <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
                        Version vom {formatVersionDate(version.createdAt, "long")}
                      </p>
                      <dl className="mt-2 space-y-1.5 text-[0.78rem]">
                        <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                          <dt className="text-muted-foreground">Titel</dt>
                          <dd className="min-w-0 font-medium break-words">
                            {snapshot.title}
                          </dd>
                        </div>
                        <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                          <dt className="text-muted-foreground">Typ</dt>
                          <dd>{snapshot.typeLabel}</dd>
                        </div>
                        <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                          <dt className="text-muted-foreground">Zeitraum</dt>
                          <dd>{snapshot.yearRangeLabel}</dd>
                        </div>
                        <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                          <dt className="text-muted-foreground">Vertrauen</dt>
                          <dd>{snapshot.confidenceLabel}</dd>
                        </div>
                        <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                          <dt className="text-muted-foreground">Thema</dt>
                          <dd className="min-w-0 break-words">
                            {snapshot.topics.length > 0
                              ? snapshot.topics.join(", ")
                              : "—"}
                          </dd>
                        </div>
                        {snapshot.summaryPreview && (
                          <div className="grid grid-cols-[5.5rem_1fr] gap-x-2">
                            <dt className="text-muted-foreground">Kurztext</dt>
                            <dd className="min-w-0 break-words text-muted-foreground">
                              {snapshot.summaryPreview}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {version.changes.length > 0 && (
                      <div>
                        <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
                          Geändert zu
                        </p>
                        <ul className="mt-1.5 space-y-1.5">
                          {version.changes.map((change) => (
                            <li
                              key={`${version.id}-${change.field}`}
                              className="rounded-md bg-surface-3/40 px-2.5 py-1.5 text-[0.75rem]"
                            >
                              <span className="font-medium">{change.label}:</span>{" "}
                              <span className="text-muted-foreground line-through">
                                {change.before}
                              </span>
                              <span className="mx-1 text-muted-foreground">→</span>
                              <span className="break-words">{change.after}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
