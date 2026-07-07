"use client";

import * as React from "react";
import { FileText, ImageIcon, Paperclip, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChSectionLabel } from "@/components/ui/chronikon-shell";

export interface AttachmentItem {
  id: string;
  filename: string;
  mimeType?: string;
  url?: string;
  label?: string | null;
  ocrStatus?: string;
  extractedText?: string | null;
}

export interface AttachmentsSectionProps {
  attachments: AttachmentItem[];
  entryId: string;
  onAdd?: () => void;
  onDelete?: (attachmentId: string) => void;
  onOpen?: (attachment: AttachmentItem) => void;
  canEdit?: boolean;
  className?: string;
  /** Ohne äußeren Rahmen — für Einbettung in Material-Sektion */
  embedded?: boolean;
}

function AttachmentPreview({ attachment }: { attachment: AttachmentItem }) {
  const isImage = attachment.mimeType?.startsWith("image/");
  const isPdf =
    attachment.mimeType === "application/pdf" ||
    attachment.filename?.toLowerCase().endsWith(".pdf");

  if (isImage && attachment.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={attachment.url}
        alt={attachment.filename}
        className="max-h-32 w-full rounded-lg object-contain bg-surface-3"
      />
    );
  }

  if (isPdf && attachment.url) {
    return (
      <iframe
        src={attachment.url}
        title={attachment.filename}
        className="h-32 w-full rounded-lg border-0 bg-surface-3"
      />
    );
  }

  if (isImage) {
    return (
      <div className="rounded-lg bg-surface-3 p-6 text-center text-muted-foreground">
        <ImageIcon className="mx-auto mb-1 h-8 w-8 opacity-60" />
        <span className="text-[0.72rem]">{attachment.filename}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface-3 p-6 text-center text-muted-foreground">
      <FileText className="mx-auto mb-1 h-8 w-8 opacity-60" />
      <span className="text-[0.72rem]">{attachment.filename}</span>
    </div>
  );
}

function AttachmentCard({
  attachment,
  onOpen,
  onDelete,
  canEdit,
}: {
  attachment: AttachmentItem;
  onOpen?: (attachment: AttachmentItem) => void;
  onDelete?: (attachmentId: string) => void;
  canEdit?: boolean;
}) {
  const [ocrOpen, setOcrOpen] = React.useState(false);
  const hasOcr = !!attachment.extractedText?.trim();

  return (
    <div className="space-y-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen?.(attachment)}
          className="w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 p-1 text-left transition-all hover:border-accent/30 hover:shadow-sm"
        >
          <AttachmentPreview attachment={attachment} />
        </button>
        {canEdit && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(attachment.id)}
            className="absolute right-2 top-2 cursor-pointer rounded-lg bg-surface/90 p-1 text-muted-foreground backdrop-blur-sm hover:text-destructive"
            title="Anhang löschen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {hasOcr && (
        <details
          open={ocrOpen}
          onToggle={(e) => setOcrOpen((e.target as HTMLDetailsElement).open)}
          className="rounded-lg border border-border/50 bg-surface-3/40"
        >
          <summary className="cursor-pointer px-2.5 py-1.5 text-[0.72rem] font-medium text-muted-foreground select-none">
            OCR-Text anzeigen (
            {attachment.extractedText!.length.toLocaleString("de-DE")} Zeichen)
          </summary>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-t border-border/40 p-2.5 font-mono text-[0.68rem] leading-relaxed text-muted-foreground">
            {attachment.extractedText!.length > 2000
              ? `${attachment.extractedText!.slice(0, 2000)}…`
              : attachment.extractedText}
          </pre>
        </details>
      )}
    </div>
  );
}

export function AttachmentsSection({
  attachments,
  entryId,
  onAdd,
  onDelete,
  onOpen,
  canEdit = true,
  className,
  embedded = false,
}: AttachmentsSectionProps) {
  const content = (
    <>
      {!embedded && (
        <div className="mb-2.5 flex items-center justify-between">
          <ChSectionLabel className="flex items-center gap-1.5 normal-case tracking-wide">
            <Paperclip className="h-3.5 w-3.5" />
            Anhänge ({attachments.length})
          </ChSectionLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[0.72rem] text-accent hover:text-accent"
            onClick={onAdd}
            disabled={!canEdit}
          >
            <Plus className="h-3 w-3" />
            Hinzufügen
          </Button>
        </div>
      )}

      {embedded && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.78rem] text-muted-foreground">
            PDF, Bilder oder Scans — optimiert für Deutsch und Englisch.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[0.72rem] text-accent hover:text-accent"
            onClick={onAdd}
            disabled={!canEdit}
          >
            <Plus className="h-3 w-3" />
            Hinzufügen
          </Button>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-[0.78rem] leading-relaxed text-muted-foreground">
          {embedded
            ? "Noch keine Anhänge — PDF oder Bild hochladen; OCR-Text wird automatisch gespeichert."
            : "PDF, Bilder oder Scans hochladen."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              onOpen={onOpen}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      <input
        type="file"
        id={`attach-input-${entryId}`}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
      />
    </>
  );

  if (embedded) {
    return <div className={className}>{content}</div>;
  }

  return (
    <section
      className={cn(
        "my-4 rounded-xl border border-border/60 bg-surface-2/30 p-3",
        className,
      )}
    >
      {content}
    </section>
  );
}
