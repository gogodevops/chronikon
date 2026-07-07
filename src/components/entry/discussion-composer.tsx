"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface DiscussionFormData {
  text: string;
}

export interface DiscussionComposerProps {
  entryId: string;
  onSubmit?: (data: DiscussionFormData) => void;
}

export function DiscussionComposer({
  onSubmit,
}: DiscussionComposerProps) {
  const [text, setText] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit?.({ text: text.trim() });
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-border bg-surface-2 p-3"
    >
      <Textarea
        placeholder="Beitrag zur Diskussion… (@Name für Erwähnung)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="mb-2"
      />

      <Button type="submit" size="sm" disabled={!text.trim()}>
        Beitrag senden
      </Button>
    </form>
  );
}
