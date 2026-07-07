export type KiAttachmentInput = {
  name: string;
  label?: string | null;
  mimeType?: string;
  ocrStatus?: string;
  extractedText?: string | null;
};

export type KiChildEntryInput = {
  title: string;
  typeLabel: string;
  yearStart?: number;
  yearEnd?: number;
};

export type KiTemplateVars = {
  PROJECT: string;
  ENTRY_TITLE: string;
  ENTRY_BODY: string;
  ENTRY: string;
  OCR_TEXT: string;
  ATTACHMENTS_LIST: string;
  CHILD_ENTRIES: string;
  ENTRIES: string;
};

const OCR_TRUNCATE = 12000;

export function buildAttachmentsList(
  attachments: KiAttachmentInput[],
): string {
  if (attachments.length === 0) {
    return "(keine Anhänge)";
  }

  return attachments
    .map((attachment, index) => {
      const label = attachment.label ? ` — ${attachment.label}` : "";
      const ocr =
        attachment.ocrStatus === "done" && attachment.extractedText?.trim()
          ? " · OCR vorhanden"
          : attachment.ocrStatus === "pending"
            ? " · OCR ausstehend"
            : "";
      return `${index + 1}. ${attachment.name}${label} (${attachment.mimeType ?? "unbekannt"})${ocr}`;
    })
    .join("\n");
}

export function buildOcrText(attachments: KiAttachmentInput[]): string {
  const blocks = attachments
    .filter((attachment) => attachment.extractedText?.trim())
    .map((attachment) => {
      const text = attachment.extractedText!.trim();
      const truncated =
        text.length > OCR_TRUNCATE
          ? `${text.slice(0, OCR_TRUNCATE)}\n\n[… OCR gekürzt …]`
          : text;
      return `### ${attachment.name}\n\n${truncated}`;
    });

  if (blocks.length === 0) {
    return "(kein OCR-Text verfügbar — PDF-Anhänge hochladen oder ZIP-Export für vollständige OCR-Korpusnutzung)";
  }

  return blocks.join("\n\n---\n\n");
}

export function buildChildEntriesList(
  children: KiChildEntryInput[],
): string {
  if (children.length === 0) {
    return "(keine Untereinträge)";
  }

  return children
    .map((child, index) => {
      const years =
        child.yearStart != null && child.yearEnd != null
          ? ` (${child.yearStart}–${child.yearEnd})`
          : "";
      return `${index + 1}. ${child.title} [${child.typeLabel}]${years}`;
    })
    .join("\n");
}

export function buildEntryKiVars(input: {
  project: string;
  entryTitle: string;
  entryMarkdown: string;
  attachments?: KiAttachmentInput[];
  childEntries?: KiChildEntryInput[];
  entriesPlaceholder?: string;
}): KiTemplateVars {
  const attachments = input.attachments ?? [];
  const entryBody = input.entryMarkdown;

  return {
    PROJECT: input.project,
    ENTRY_TITLE: input.entryTitle,
    ENTRY_BODY: entryBody,
    ENTRY: entryBody,
    ATTACHMENTS_LIST: buildAttachmentsList(attachments),
    OCR_TEXT: buildOcrText(attachments),
    CHILD_ENTRIES: buildChildEntriesList(input.childEntries ?? []),
    ENTRIES:
      input.entriesPlaceholder ??
      "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren)",
  };
}

export function hasOcrContent(attachments: KiAttachmentInput[]): boolean {
  return attachments.some((attachment) => attachment.extractedText?.trim());
}
