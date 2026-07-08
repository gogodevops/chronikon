"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChSectionLabel } from "@/components/ui/chronikon-shell";

export type AttachmentUploadStatus =
  | { state: "idle" }
  | { state: "uploading"; filename: string }
  | { state: "success"; filename: string }
  | { state: "error"; filename: string; message: string };

export interface AttachmentItem {
  id: string;
  filename: string;
  mimeType?: string;
  url?: string;
  label?: string | null;
}

function isPdfMime(mimeType?: string, filename?: string): boolean {
  return (
    mimeType === "application/pdf" ||
    !!filename?.toLowerCase().endsWith(".pdf")
  );
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
  uploadStatus?: AttachmentUploadStatus;
}

function UploadStatusBanner({ status }: { status: AttachmentUploadStatus }) {
  if (status.state === "idle") return null;

  if (status.state === "uploading") {
    return (
      <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-accent/25 bg-accent-dim/30 px-2.5 py-2 text-[0.72rem] text-accent">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        <span>
          <strong>{status.filename}</strong> wird hochgeladen…
        </span>
      </div>
    );
  }

  if (status.state === "success") {
    return (
      <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-green/25 bg-green/10 px-2.5 py-2 text-[0.72rem] text-green">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>{status.filename}</strong> erfolgreich hochgeladen.
        </span>
      </div>
    );
  }

  return (
    <div className="mb-2.5 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-[0.72rem] text-destructive">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        Upload von <strong>{status.filename}</strong> fehlgeschlagen:{" "}
        {status.message}
      </span>
    </div>
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
          PDF — zum Öffnen oder Herunterladen klicken
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
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen?.(attachment)}
        className="w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 p-2 text-left transition-all hover:border-accent/30 hover:shadow-sm"
      >
        <div className="mb-1.5 px-0.5">
          <span className="truncate text-[0.72rem] font-medium">
            {attachment.filename}
          </span>
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
  uploadStatus = { state: "idle" },
}: AttachmentsSectionProps) {
  const isUploading = uploadStatus.state === "uploading";

  const content = (
    <>
      <UploadStatusBanner status={uploadStatus} />

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
            disabled={!canEdit || isUploading}
          >
            <Plus className="h-3 w-3" />
            {isUploading ? "Lädt…" : "Hinzufügen"}
          </Button>
        </div>
      )}

      {embedded && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.78rem] text-muted-foreground">
            PDFs und Bilder zu diesem Eintrag hochladen.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-[0.72rem] text-accent hover:text-accent"
            onClick={onAdd}
            disabled={!canEdit || isUploading}
          >
            <Plus className="h-3 w-3" />
            {isUploading ? "Lädt…" : "Hinzufügen"}
          </Button>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-[0.78rem] leading-relaxed text-muted-foreground">
          {embedded
            ? "Noch keine Anhänge — PDF oder Bild hochladen."
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
