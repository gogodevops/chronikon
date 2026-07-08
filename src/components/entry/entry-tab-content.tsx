"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { ClaimComposer } from "@/components/entry/claim-composer";
import { RelationTypeIcon } from "@/components/entry/relation-icons";
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
import {
  COLLAPSE_LIST_THRESHOLD,
  CollapsibleItem,
  CollapsibleListControls,
  useCollapsibleList,
} from "@/components/ui/collapsible-section";

export function SourcesList({
  sources,
  emptyHint = "Noch keine Quellen ausgeschrieben — unten ergänzen.",
  onNavigate,
  onDelete,
  canEdit = true,
}: {
  sources: SerializedSource[];
  emptyHint?: string;
  onNavigate?: (entryId: string) => void;
  onDelete?: (sourceId: string) => void;
  canEdit?: boolean;
}) {
  const collapsible = sources.length > COLLAPSE_LIST_THRESHOLD;
  const list = useCollapsibleList(
    sources.map((source) => source.id),
    collapsible,
  );

  if (sources.length === 0) {
    return (
      <p className="mb-3 text-[0.82rem] leading-relaxed text-muted-foreground">
        {emptyHint}
      </p>
    );
  }

  const renderSource = (s: SerializedSource, nested = false) => (
    <div
      key={s.id}
      className={cn(
        "relative rounded-xl border border-border/70 bg-surface-2/60 p-3 pr-9 text-[0.82rem] transition-colors hover:border-border",
        s.type === "primary" && "border-l-[3px] border-l-green/80",
        s.type === "secondary" && "border-l-[3px] border-l-blue/80",
        nested && "border-none bg-transparent p-0 pr-9",
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
        <div className="mt-1 text-[0.78rem] text-muted-foreground">{s.note}</div>
      )}
    </div>
  );

  return (
    <div className="mb-3 space-y-2">
      {collapsible && (
        <CollapsibleListControls
          onExpandAll={list.expandAll}
          onCollapseAll={list.collapseAll}
          allExpanded={list.allExpanded}
          noneExpanded={list.noneExpanded}
        />
      )}
      {sources.map((s) =>
        collapsible ? (
          <CollapsibleItem
            key={s.id}
            id={s.id}
            isOpen={list.isExpanded(s.id)}
            onToggle={list.toggle}
            header={
              <div className="min-w-0 text-[0.82rem]">
                <div className="truncate font-medium">{s.title}</div>
                <div className="truncate text-[0.72rem] text-muted-foreground">
                  {SOURCE_TYPE_LABELS[s.type as keyof typeof SOURCE_TYPE_LABELS] ??
                    s.type}
                </div>
              </div>
            }
          >
            {renderSource(s, true)}
          </CollapsibleItem>
        ) : (
          renderSource(s)
        ),
      )}
    </div>
  );
}

export function ClaimsList({
  claims,
  currentUserId,
  onDelete,
  onUpdate,
  canEdit = true,
}: {
  claims: SerializedClaim[];
  currentUserId?: string;
  onDelete?: (claimId: string) => void;
  onUpdate?: (claimId: string, data: { text: string; confidence: string }) => void;
  canEdit?: boolean;
}) {
  const [editingClaimId, setEditingClaimId] = React.useState<string | null>(null);
  const collapsible = claims.length > COLLAPSE_LIST_THRESHOLD;
  const list = useCollapsibleList(
    claims.map((claim) => claim.id),
    collapsible,
  );

  const isOwnClaim = (claim: SerializedClaim) =>
    !!currentUserId && claim.authorId === currentUserId;

  if (claims.length === 0) {
    return (
      <p className="mb-3 text-[0.82rem] text-muted-foreground">
        Noch keine Behauptungen — unten eine formulieren.
      </p>
    );
  }

  const renderClaim = (c: SerializedClaim, nested = false) => {
    if (editingClaimId === c.id && onUpdate) {
      return (
        <ClaimComposer
          key={c.id}
          entryId=""
          claimId={c.id}
          initialText={c.text}
          initialConfidence={c.confidence}
          title="Behauptung bearbeiten"
          submitLabel="Änderungen speichern"
          onSubmit={(data) => {
            onUpdate(c.id, data);
            setEditingClaimId(null);
          }}
          onCancel={() => setEditingClaimId(null)}
        />
      );
    }

    const own = isOwnClaim(c);

    return (
    <div
      key={c.id}
      className={cn(
        "relative flex gap-2 rounded-xl border border-border/70 bg-surface-2/60 p-3 pr-16",
        nested && "border-none bg-transparent p-0 pr-16",
      )}
    >
      {canEdit && own && onUpdate && (
        <button
          type="button"
          onClick={() => setEditingClaimId(c.id)}
          className="absolute right-8 top-2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent"
          title="Behauptung bearbeiten"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {canEdit && own && onDelete && (
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
    );
  };

  return (
    <div className="mb-3 space-y-2">
      {collapsible && (
        <CollapsibleListControls
          onExpandAll={list.expandAll}
          onCollapseAll={list.collapseAll}
          allExpanded={list.allExpanded}
          noneExpanded={list.noneExpanded}
        />
      )}
      {claims.map((c) =>
        collapsible ? (
          <CollapsibleItem
            key={c.id}
            id={c.id}
            isOpen={list.isExpanded(c.id)}
            onToggle={list.toggle}
            header={
              <div className="flex min-w-0 items-center gap-2 text-[0.82rem]">
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-medium"
                  style={{
                    background: `${c.confidenceColor}22`,
                    color: c.confidenceColor,
                  }}
                >
                  {c.confidenceLabel}
                </span>
                <span className="truncate">{c.text}</span>
              </div>
            }
          >
            {renderClaim(c, true)}
          </CollapsibleItem>
        ) : (
          renderClaim(c)
        ),
      )}
    </div>
  );
}

export function DiscussionFeed({
  questions,
  comments,
  onAnswer,
  onDeleteQuestion,
  onDeleteComment,
  canDiscuss = true,
}: {
  questions: SerializedQuestion[];
  comments: SerializedComment[];
  onAnswer?: (questionId: string, text: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  canDiscuss?: boolean;
}) {
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>(
    {},
  );

  if (questions.length === 0 && comments.length === 0) {
    return (
      <div className="mb-3">
        <p className="text-[0.82rem] text-muted-foreground">
          Noch keine Beiträge — unten einen Kommentar schreiben oder eine
          bestehende offene Frage beantworten.
        </p>
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
  onDelete?: (
    relationId: string,
    otherEntryTitle?: string,
    typeLabel?: string,
  ) => void;
  canEdit?: boolean;
}) {
  if (relations.length === 0) {
    return (
      <p className="text-[0.82rem] text-muted-foreground">
        Noch keine Verknüpfungen.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {relations.map((r) => (
        <li key={r.id} className="group relative">
          <button
            type="button"
            onClick={() =>
              onNavigate?.(r.otherEntryId, r.otherEntryProjectSlug ?? undefined)
            }
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-surface-2/60 py-2 pl-2.5 pr-9 text-left text-[0.82rem] transition-all hover:border-accent/30 hover:bg-surface-3/50"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-surface-3/80 text-accent"
              title={r.typeLabel}
            >
              <RelationTypeIcon type={r.type} className="h-3.5 w-3.5" />
            </span>
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: r.otherEntryTypeColor }}
              title="Eintragstyp"
            />
            <span className="min-w-0 flex-1 truncate">
              <span className="text-[0.72rem] text-muted-foreground">
                {r.typeLabel}
              </span>
              <span className="mx-1 text-muted-foreground/50">·</span>
              <strong className="font-medium">{r.otherEntryTitle}</strong>
              {r.isCrossProject && r.otherEntryProjectName && (
                <span className="ml-1.5 text-[0.68rem] font-normal text-accent">
                  {r.otherEntryProjectIcon} {r.otherEntryProjectName}
                </span>
              )}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
          {canEdit && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(r.id, r.otherEntryTitle, r.typeLabel);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              title="Verknüpfung entfernen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
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
