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
}

export interface AttachmentsSectionProps {
  attachments: AttachmentItem[];
  entryId: string;
  onAdd?: () => void;
  onDelete?: (attachmentId: string) => void;
  onOpen?: (attachment: AttachmentItem) => void;
  canEdit?: boolean;
  className?: string;
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

export function AttachmentsSection({
  attachments,
  entryId,
  onAdd,
  onDelete,
  onOpen,
  canEdit = true,
  className,
}: AttachmentsSectionProps) {
  return (
    <section
      className={cn(
        "my-4 rounded-xl border border-border/60 bg-surface-2/30 p-3",
        className,
      )}
    >
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

      {attachments.length === 0 ? (
        <p className="text-[0.78rem] leading-relaxed text-muted-foreground">
          PDF, Bilder oder Scans hochladen.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="relative">
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
          ))}
        </div>
      )}

      <input
        type="file"
        id={`attach-input-${entryId}`}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
      />
    </section>
  );
}
