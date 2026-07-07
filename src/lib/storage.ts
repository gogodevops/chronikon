import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import {
  deleteFile as deleteFromS3,
  downloadFile as downloadFromS3,
  uploadFile as uploadToS3,
} from "@/lib/s3";
import {
  filePublicUrl,
  hasS3Config,
  storageMode,
} from "@/lib/storage-config";

export type StoredFile = {
  storageKey: string;
  publicUrl: string;
};

async function uploadLocal(
  file: Buffer | Uint8Array,
  filename: string,
): Promise<StoredFile> {
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf("."))
    : "";
  const storageKey = `uploads/${uuidv4()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(process.cwd(), "public", storageKey);
  await writeFile(fullPath, file);

  return {
    storageKey,
    publicUrl: filePublicUrl(storageKey),
  };
}

export async function storeFile(
  file: Buffer | Uint8Array,
  filename: string,
  mimeType: string,
): Promise<StoredFile> {
  if (process.env.VERCEL === "1" && !hasS3Config()) {
    throw new Error(
      "Datei-Upload auf Vercel erfordert R2/S3 (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY).",
    );
  }
  if (storageMode() === "local") {
    return uploadLocal(file, filename);
  }
  const result = await uploadToS3(file, filename, mimeType);
  return {
    storageKey: result.storageKey,
    publicUrl: filePublicUrl(result.storageKey),
  };
}

export async function readStoredFile(
  storageKey: string,
): Promise<{ body: Buffer; mimeType: string }> {
  if (storageMode() === "local") {
    const fullPath = path.join(process.cwd(), "public", storageKey);
    const { readFile } = await import("fs/promises");
    const body = await readFile(fullPath);
    const ext = path.extname(storageKey).toLowerCase();
    const mimeType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : "application/octet-stream";
    return { body, mimeType };
  }
  return downloadFromS3(storageKey);
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  if (storageMode() === "local") {
    try {
      await unlink(path.join(process.cwd(), "public", storageKey));
    } catch {
      /* Datei bereits weg */
    }
    return;
  }
  await deleteFromS3(storageKey);
}

/** Best-effort removal of multiple stored files (S3 or local). */
export async function deleteStoredFiles(storageKeys: string[]): Promise<void> {
  if (storageKeys.length === 0) return;
  await Promise.allSettled(storageKeys.map((key) => deleteStoredFile(key)));
}

export function isLocalStorage() {
  return storageMode() === "local";
}

export { storageMode };
