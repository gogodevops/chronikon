import { MAX_ATTACHMENT_BYTES, formatFileSize } from "@/lib/upload-constants";

export type UploadApiResult = {
  storageKey: string;
  url?: string;
  mimeType: string;
  name: string;
};

export async function parseUploadError(
  res: Response,
): Promise<string> {
  if (res.status === 401) {
    return "Nicht angemeldet — bitte neu einloggen";
  }
  if (res.status === 413) {
    return `Datei zu groß für Server-Upload (max. ${formatFileSize(4 * 1024 * 1024)})`;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (body.error) return body.error;
  }

  const text = await res.text().catch(() => "");
  if (text && text.length < 300) return text;

  return `Upload fehlgeschlagen (HTTP ${res.status})`;
}

export function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Datei zu groß (max. ${formatFileSize(MAX_ATTACHMENT_BYTES)})`;
  }

  const name = file.name.toLowerCase();
  const allowed =
    file.type === "application/pdf" ||
    file.type.startsWith("image/") ||
    name.endsWith(".pdf") ||
    /\.(jpe?g|png|webp)$/.test(name);

  if (!allowed) {
    return "Nur PDF oder Bilder (JPG, PNG, WebP) erlaubt";
  }

  return null;
}

export async function uploadAttachmentFile(
  file: File,
): Promise<UploadApiResult> {
  const validationError = validateAttachmentFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const mimeType = file.type || "application/octet-stream";

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mimeType,
      size: file.size,
    }),
  });

  if (!presignRes.ok) {
    throw new Error(await parseUploadError(presignRes));
  }

  const presign = (await presignRes.json()) as
    | {
        mode: "presigned";
        storageKey: string;
        uploadUrl: string;
        publicUrl: string;
      }
    | { mode: "direct" };

  if (presign.mode === "presigned") {
    const putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": mimeType },
    });

    if (!putRes.ok) {
      throw new Error(
        putRes.status === 403 || putRes.status === 0
          ? "Direkt-Upload zu R2 fehlgeschlagen — R2-Bucket-CORS prüfen (siehe DEPLOY.md)"
          : `Speicher-Upload fehlgeschlagen (HTTP ${putRes.status})`,
      );
    }

    const completeRes = await fetch("/api/upload/complete", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storageKey: presign.storageKey,
        filename: file.name,
        mimeType,
      }),
    });

    if (!completeRes.ok) {
      throw new Error(await parseUploadError(completeRes));
    }

    return (await completeRes.json()) as UploadApiResult;
  }

  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  if (!res.ok) {
    throw new Error(await parseUploadError(res));
  }

  return (await res.json()) as UploadApiResult;
}
