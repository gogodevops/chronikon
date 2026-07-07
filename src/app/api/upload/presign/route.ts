import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  MAX_ATTACHMENT_BYTES,
  VERCEL_DIRECT_UPLOAD_MAX_BYTES,
  formatFileSize,
} from "@/lib/upload-constants";
import { presignUpload } from "@/lib/storage";
import { storageMode } from "@/lib/storage-config";

export const runtime = "nodejs";

const presignSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const parsed = presignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Anfrage" },
      { status: 400 },
    );
  }

  const { filename, mimeType, size } = parsed.data;

  if (size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      {
        error: `Datei zu groß (max. ${formatFileSize(MAX_ATTACHMENT_BYTES)})`,
      },
      { status: 400 },
    );
  }

  if (
    storageMode() === "local" ||
    size <= VERCEL_DIRECT_UPLOAD_MAX_BYTES
  ) {
    return NextResponse.json({ mode: "direct" as const });
  }

  if (storageMode() !== "s3") {
    return NextResponse.json(
      {
        error:
          "Datei-Upload auf Vercel erfordert R2/S3 (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY).",
      },
      { status: 503 },
    );
  }

  try {
    const { storageKey, uploadUrl, publicUrl } = await presignUpload(
      filename,
      mimeType,
    );

    return NextResponse.json({
      mode: "presigned" as const,
      storageKey,
      uploadUrl,
      publicUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Presign fehlgeschlagen";
    console.error("[upload/presign]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
