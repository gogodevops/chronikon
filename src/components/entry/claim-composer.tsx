"use client";

import * as React from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChComposer } from "@/components/ui/chronikon-shell";

export interface ClaimFormData {
  text: string;
  confidence: "verified" | "likely" | "disputed" | "unknown";
}

export interface ClaimComposerProps {
  entryId: string;
  onSubmit?: (data: ClaimFormData) => void;
}

export function ClaimComposer({ onSubmit }: ClaimComposerProps) {
  const [text, setText] = React.useState("");
  const [confidence, setConfidence] =
    React.useState<ClaimFormData["confidence"]>("likely");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit?.({ text, confidence });
    setText("");
    setConfidence("likely");
  };

  return (
    <ChComposer title="Neue Behauptung" icon={Scale} onSubmit={handleSubmit}>
      <Textarea
        placeholder='z.B. „Norwich stützt sich für Justinian vor allem auf Prokop."'
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="mb-3 border-border/70 bg-surface-3/50"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={confidence}
          onValueChange={(v) =>
            setConfidence(v as ClaimFormData["confidence"])
          }
        >
          <SelectTrigger className="h-9 w-[160px] border-border/70 bg-surface-3/50">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verified">Gesichert</SelectItem>
            <SelectItem value="likely">Vermutlich</SelectItem>
            <SelectItem value="disputed">Streitig</SelectItem>
            <SelectItem value="unknown">Unbekannt</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={!text.trim()}>
          Behauptung speichern
        </Button>
      </div>
    </ChComposer>
  );
}
