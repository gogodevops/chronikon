"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { SerializedQuestion } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function OpenPointsList({
  questions,
  onAnswer,
  onDelete,
  canDiscuss = true,
}: {
  questions: SerializedQuestion[];
  onAnswer?: (questionId: string, text: string) => void;
  onDelete?: (questionId: string) => void;
  canDiscuss?: boolean;
}) {
  const openQuestions = questions.filter((q) => q.status === "open");
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>(
    {},
  );

  if (openQuestions.length === 0) {
    return (
      <p className="text-[0.82rem] text-muted-foreground">
        Keine offenen Punkte — unten einen neuen Punkt anlegen.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {openQuestions.map((q) => (
        <div
          key={q.id}
          className="relative rounded-xl border border-border/70 bg-surface-2/60 p-3 pr-9"
        >
          {canDiscuss && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(q.id)}
              className="absolute right-2 top-2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Punkt löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[0.65rem] font-medium">
              {q.authorInitials ?? "?"}
            </span>
            <span className="text-[0.78rem] font-medium">{q.authorName}</span>
            <span className="rounded bg-accent-dim px-1.5 py-0.5 text-[0.65rem] text-accent">
              Offen
            </span>
          </div>
          {q.category && q.category !== "Allgemein" && (
            <div className="mb-1 text-[0.72rem] text-muted-foreground">
              {q.category}
              {q.passageRef ? ` · ${q.passageRef}` : ""}
            </div>
          )}
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
          {onAnswer && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Antwort / Lösung eintragen…"
                value={replyDrafts[q.id] ?? ""}
                onChange={(e) =>
                  setReplyDrafts((d) => ({ ...d, [q.id]: e.target.value }))
                }
                className="h-8 text-[0.78rem]"
                disabled={!canDiscuss}
              />
              <Button
                size="sm"
                variant="accent"
                disabled={!canDiscuss}
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
    </div>
  );
}

export function OpenPointComposer({
  onSubmit,
  canDiscuss = true,
}: {
  onSubmit?: (text: string) => void;
  canDiscuss?: boolean;
}) {
  const [text, setText] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "mt-3 rounded-lg border border-border bg-surface-2 p-3",
        !canDiscuss && "opacity-60",
      )}
    >
      <Textarea
        placeholder="Offenen Punkt formulieren…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        disabled={!canDiscuss}
        className="mb-2 text-[0.82rem]"
      />
      <Button type="submit" size="sm" disabled={!canDiscuss || !text.trim()}>
        Punkt hinzufügen
      </Button>
    </form>
  );
}

export function OpenPointsSection({
  questions,
  onAdd,
  onAnswer,
  onDelete,
  canDiscuss = true,
}: {
  questions: SerializedQuestion[];
  onAdd?: (text: string) => void;
  onAnswer?: (questionId: string, text: string) => void;
  onDelete?: (questionId: string) => void;
  canDiscuss?: boolean;
}) {
  const openCount = questions.filter((q) => q.status === "open").length;

  return (
    <CollapsibleSection title="Offen" count={openCount}>
      <OpenPointsList
        questions={questions}
        onAnswer={onAnswer}
        onDelete={onDelete}
        canDiscuss={canDiscuss}
      />
      {canDiscuss && <OpenPointComposer onSubmit={onAdd} canDiscuss={canDiscuss} />}
    </CollapsibleSection>
  );
}
