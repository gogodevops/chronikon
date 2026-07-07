"use client";

import * as React from "react";
import {
  HelpCircle,
  Link2,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EntryAction =
  | "question"
  | "comment"
  | "claim"
  | "source"
  | "relation"
  | "attachment"
  | "edit"
  | "delete";

const ACTION_GROUPS: {
  actions: {
    action: EntryAction;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant?: "default" | "accent" | "danger";
  }[];
}[] = [
  {
    actions: [
      { action: "question", label: "Frage", icon: HelpCircle },
      { action: "comment", label: "Kommentar", icon: MessageSquare },
    ],
  },
  {
    actions: [
      { action: "claim", label: "Behauptung", icon: Scale },
      { action: "source", label: "Quelle", icon: Plus },
      { action: "relation", label: "Verknüpfung", icon: Link2 },
      { action: "attachment", label: "Anhang", icon: Paperclip },
    ],
  },
  {
    actions: [
      { action: "edit", label: "Bearbeiten", icon: Pencil, variant: "accent" },
      { action: "delete", label: "Löschen", icon: Trash2, variant: "danger" },
    ],
  },
];

export interface EntryActionBarProps {
  onAction?: (action: EntryAction) => void;
  canEdit?: boolean;
  canDiscuss?: boolean;
  questionCount?: number;
  commentCount?: number;
  className?: string;
}

function actionLabel(
  action: EntryAction,
  base: string,
  questionCount: number,
  commentCount: number,
): string {
  if (action === "question" && questionCount === 0) return `+ ${base}`;
  if (action === "comment" && commentCount === 0) return `+ ${base}`;
  return base;
}

export function EntryActionBar({
  onAction,
  canEdit = true,
  canDiscuss = true,
  questionCount = 0,
  commentCount = 0,
  className,
}: EntryActionBarProps) {
  const disabled = new Set<EntryAction>();
  if (!canDiscuss) {
    disabled.add("question");
    disabled.add("comment");
  }
  if (!canEdit) {
    disabled.add("claim");
    disabled.add("source");
    disabled.add("relation");
    disabled.add("attachment");
    disabled.add("edit");
    disabled.add("delete");
  }

  return (
    <div className={cn("mt-4 flex flex-wrap items-center gap-1", className)}>
      {ACTION_GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && (
            <span className="mx-0.5 h-5 w-px bg-border/80" aria-hidden />
          )}
          {group.actions.map(({ action, label, icon: Icon, variant = "default" }) => (
            <button
              key={action}
              type="button"
              disabled={disabled.has(action)}
              onClick={() => onAction?.(action)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.72rem] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
                variant === "default" &&
                  "border-border/70 bg-surface-3/50 text-foreground hover:border-accent/40 hover:bg-accent-dim/60 hover:text-accent",
                variant === "accent" &&
                  "border-accent/35 bg-accent-dim/40 text-accent hover:bg-accent-dim",
                variant === "danger" &&
                  "border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
              {actionLabel(action, label, questionCount, commentCount)}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
