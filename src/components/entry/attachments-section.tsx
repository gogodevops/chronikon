"use client";

import * as React from "react";
import { FileText, ImageIcon, Paperclip, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChSectionLabel } from "@/components/ui/chronikon-shell";
import {
  attachmentTextStatusLabel,
  isPdfMime,
} from "@/lib/attachment-text-status";

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

function TextStatusBadge({ status }: { status?: string }) {
  const label = attachmentTextStatusLabel(status);
  const className =
    status === "done"
      ? "bg-green/15 text-green"
      : status === "failed"
        ? "bg-destructive/15 text-destructive"
        : "bg-surface-3 text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[0.62rem] font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

function AttachmentPreview({ attachment }: { attachment: AttachmentItem }) {
  const isImage = attachment.mimeType?.startsWith("image/");
  const isPdf = isPdfMime(attachment.mimeType, attachment.filename);

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

  if (isPdf) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 bg-surface-3 p-4 text-center">
        {attachment.url ? (
          <iframe
            src={attachment.url}
            title={attachment.filename}
            className="mb-2 h-28 w-full rounded border-0 bg-surface-2"
          />
        ) : (
          <FileText className="mx-auto mb-2 h-8 w-8 opacity-60 text-muted-foreground" />
        )}
        <p className="text-[0.68rem] text-muted-foreground">
          PDF-Vorschau — vollständiger Seitenleser folgt in Phase 2
        </p>
      </div>
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
  const [textOpen, setTextOpen] = React.useState(false);
  const hasText = !!attachment.extractedText?.trim();
  const isPdf = isPdfMime(attachment.mimeType, attachment.filename);

  return (
    <div className="space-y-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen?.(attachment)}
          className="w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 p-2 text-left transition-all hover:border-accent/30 hover:shadow-sm"
        >
          <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
            <span className="truncate text-[0.72rem] font-medium">
              {attachment.filename}
            </span>
            <TextStatusBadge status={attachment.ocrStatus} />
          </div>
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
      {isPdf && !hasText && attachment.ocrStatus === "failed" && (
        <p className="text-[0.68rem] text-destructive/90">
          Kein Text extrahiert — Scan-OCR ist in Phase 1 noch nicht verfügbar.
        </p>
      )}
      {hasText && (
        <details
          open={textOpen}
          onToggle={(e) => setTextOpen((e.target as HTMLDetailsElement).open)}
          className="rounded-lg border border-border/50 bg-surface-3/40"
        >
          <summary className="cursor-pointer px-2.5 py-1.5 text-[0.72rem] font-medium text-muted-foreground select-none">
            Extrahierter PDF-Text (
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
            PDFs (Textextraktion) oder Bilder — Deutsch/Englisch.
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
            ? "Noch keine Anhänge — digitales PDF hochladen; Text wird automatisch extrahiert."
            : "PDF oder Bild hochladen."}
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
