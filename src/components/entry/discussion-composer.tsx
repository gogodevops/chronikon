"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface QuestionFormData {
  text: string;
  category?: string;
}

export interface CommentFormData {
  text: string;
}

export interface DiscussionComposerProps {
  entryId: string;
  mode?: "question" | "comment";
  onSubmitQuestion?: (data: QuestionFormData) => void;
  onSubmitComment?: (data: CommentFormData) => void;
}

const CATEGORIES = [
  "Datierung",
  "Quellenkritik",
  "Interpretation",
  "Methodik",
  "Sonstiges",
];

export function DiscussionComposer({
  entryId,
  mode: modeProp,
  onSubmitQuestion,
  onSubmitComment,
}: DiscussionComposerProps) {
  const [mode, setMode] = React.useState<"question" | "comment">(
    modeProp ?? "question",
  );
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0]);

  React.useEffect(() => {
    if (modeProp) setMode(modeProp);
  }, [modeProp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (mode === "question") {
      onSubmitQuestion?.({ text: text.trim(), category });
    } else {
      onSubmitComment?.({ text: text.trim() });
    }
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-border bg-surface-2 p-3"
    >
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setMode("question")}
          className={cn(
            "cursor-pointer rounded-md border px-2 py-1 text-[0.72rem] transition-colors",
            mode === "question"
              ? "border-accent bg-accent-dim text-accent"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          Frage
        </button>
        <button
          type="button"
          onClick={() => setMode("comment")}
          className={cn(
            "cursor-pointer rounded-md border px-2 py-1 text-[0.72rem] transition-colors",
            mode === "comment"
              ? "border-accent bg-accent-dim text-accent"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          Kommentar
        </button>
      </div>

      {mode === "question" && (
        <div className="mb-2 flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "cursor-pointer rounded-full border px-2 py-0.5 text-[0.68rem]",
                category === cat
                  ? "border-accent bg-accent-dim text-accent"
                  : "border-border text-muted-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <Textarea
        placeholder={
          mode === "question"
            ? "Offene Forschungsfrage formulieren…"
            : "Kommentar oder Zitat einfügen…"
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="mb-2"
      />

      <Button type="submit" size="sm" disabled={!text.trim()}>
        {mode === "question" ? "Frage stellen" : "Kommentieren"}
      </Button>
    </form>
  );
}
