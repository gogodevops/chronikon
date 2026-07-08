"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { EntryBody } from "@/components/entry/entry-body";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { OPEN_SECTION_KERN } from "@/lib/entry-section-events";
import type { EntryTitleIndex } from "@/lib/queries";

export function KernSection({
  body,
  summary,
  hint,
  entryIndex,
  projectSlug,
  canEdit = false,
  open,
  onOpenChange,
  onSaveBody,
}: {
  body?: string | null;
  summary?: string | null;
  hint?: string;
  entryIndex: EntryTitleIndex[];
  projectSlug: string;
  canEdit?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaveBody?: (body: string) => Promise<void> | void;
}) {
  const [draft, setDraft] = React.useState(body ?? "");
  const [saving, setSaving] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(true);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setDraft(body ?? "");
  }, [body]);

  React.useEffect(() => {
    const focusKern = () => {
      onOpenChange?.(true);
      setTimeout(() => textareaRef.current?.focus(), 150);
    };
    window.addEventListener(OPEN_SECTION_KERN, focusKern);
    return () => window.removeEventListener(OPEN_SECTION_KERN, focusKern);
  }, [onOpenChange]);

  const dirty = draft !== (body ?? "");

  const handleSave = async () => {
    if (!onSaveBody || !dirty) return;
    setSaving(true);
    try {
      await onSaveBody(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="entry-section-kern">
    <CollapsibleSection
      title="Kern"
      hint={hint}
      open={open}
      onOpenChange={onOpenChange}
    >
      {summary && (
        <p className="mb-3 text-[0.82rem] leading-relaxed text-muted-foreground">
          {summary}
        </p>
      )}

      {canEdit && onSaveBody ? (
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Notizen, Zusammenfassung, Markdown … Verknüpfungen mit [[Titel des Eintrags]]"
            rows={8}
            className="min-h-[160px] border-border/70 bg-surface-3/50 font-mono text-[0.82rem] leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              {saving ? "Speichern…" : "Inhalt speichern"}
            </Button>
            {draft.trim() && (
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1 text-[0.75rem] text-muted-foreground hover:text-foreground"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Vorschau ausblenden
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Vorschau anzeigen
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : !body ? (
        <p className="my-3 text-[0.82rem] leading-relaxed text-muted-foreground">
          Noch kein Inhalt.
        </p>
      ) : null}

      {(body || draft) && (showPreview || !canEdit) && (
        <EntryBody
          body={dirty ? draft : body}
          entryIndex={entryIndex}
          projectSlug={projectSlug}
        />
      )}
    </CollapsibleSection>
    </div>
  );
}
