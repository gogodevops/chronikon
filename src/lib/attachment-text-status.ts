/** Status der Textextraktion aus Anhängen (Phase 1: digitale PDFs, kein Scan-OCR). */
export type AttachmentTextStatus = "pending" | "done" | "failed";

export function isPdfMime(mimeType?: string, filename?: string): boolean {
  return (
    mimeType === "application/pdf" ||
    !!filename?.toLowerCase().endsWith(".pdf")
  );
}

export function resolveAttachmentTextStatus(
  mimeType: string,
  extractedText?: string | null,
  filename?: string,
): AttachmentTextStatus {
  if (extractedText?.trim()) return "done";
  if (isPdfMime(mimeType, filename)) return "failed";
  return "pending";
}

export function attachmentTextStatusLabel(status?: string): string {
  switch (status) {
    case "done":
      return "Text extrahiert";
    case "failed":
      return "Extraktion fehlgeschlagen";
    case "pending":
    default:
      return "Ausstehend";
  }
}
