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
  claimId?: string;
  initialText?: string;
  initialConfidence?: ClaimFormData["confidence"];
  title?: string;
  submitLabel?: string;
  onSubmit?: (data: ClaimFormData) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function ClaimComposer({
  claimId,
  initialText = "",
  initialConfidence = "likely",
  title = "Neue Behauptung",
  submitLabel = "Behauptung speichern",
  onSubmit,
  onCancel,
  autoFocus = false,
}: ClaimComposerProps) {
  const [text, setText] = React.useState(initialText);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [confidence, setConfidence] =
    React.useState<ClaimFormData["confidence"]>(initialConfidence);

  React.useEffect(() => {
    setText(initialText);
    setConfidence(initialConfidence);
  }, [initialText, initialConfidence, claimId]);

  React.useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit?.({ text, confidence });
    if (!claimId) {
      setText("");
      setConfidence("likely");
    }
  };

  return (
    <ChComposer title={title} icon={Scale} onSubmit={handleSubmit}>
      <Textarea
        ref={textareaRef}
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
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
      </div>
    </ChComposer>
  );
}
