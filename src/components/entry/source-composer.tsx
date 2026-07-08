"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChComposer } from "@/components/ui/chronikon-shell";

export interface SourceFormData {
  title: string;
  author?: string;
  year?: string;
  type: "primary" | "secondary" | "tertiary";
  note?: string;
}

export interface SourceComposerProps {
  entryId: string;
  titlePlaceholder?: string;
  onSubmit?: (data: SourceFormData) => void;
  autoFocus?: boolean;
}

export function SourceComposer({
  titlePlaceholder = "Titel der Publikation oder Quelle",
  onSubmit,
  autoFocus = false,
}: SourceComposerProps) {
  const [title, setTitle] = React.useState("");
  const titleRef = React.useRef<HTMLInputElement>(null);
  const [author, setAuthor] = React.useState("");
  const [year, setYear] = React.useState("");
  const [type, setType] = React.useState<SourceFormData["type"]>("secondary");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (autoFocus) {
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit?.({ title, author, year, type, note });
    setTitle("");
    setAuthor("");
    setYear("");
    setNote("");
  };

  return (
    <ChComposer title="Quelle hinzufügen" icon={BookOpen} onSubmit={handleSubmit}>
      <Input
        ref={titleRef}
        placeholder={titlePlaceholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-2 h-9 border-border/70 bg-surface-3/50"
      />
      <div className="mb-2 flex gap-2">
        <Input
          placeholder="Autor"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="h-9 flex-1 border-border/70 bg-surface-3/50"
        />
        <Input
          placeholder="Jahr"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-9 w-24 border-border/70 bg-surface-3/50"
        />
      </div>
      <Select
        value={type}
        onValueChange={(v) => setType(v as SourceFormData["type"])}
      >
        <SelectTrigger className="mb-2 h-9 border-border/70 bg-surface-3/50">
          <SelectValue placeholder="Quellentyp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">Primärquelle</SelectItem>
          <SelectItem value="secondary">Sekundärquelle</SelectItem>
          <SelectItem value="tertiary">Tertiärquelle</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Anmerkung (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="mb-3 border-border/70 bg-surface-3/50"
      />
      <Button type="submit" size="sm" disabled={!title.trim()}>
        Quelle speichern
      </Button>
    </ChComposer>
  );
}
