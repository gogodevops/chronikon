import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { extractPdfText } from "@/lib/pdf-text";
import { readStoredFile } from "@/lib/storage";
import { filePublicUrl } from "@/lib/storage-config";

export const runtime = "nodejs";
export const maxDuration = 60;

const completeSchema = z.object({
  storageKey: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const parsed = completeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Anfrage" },
      { status: 400 },
    );
  }

  const { storageKey, filename, mimeType } = parsed.data;

  if (!storageKey.startsWith("uploads/")) {
    return NextResponse.json({ error: "Ungültiger Speicherpfad" }, { status: 400 });
  }

  try {
    let text = "";
    if (
      mimeType === "application/pdf" ||
      filename.toLowerCase().endsWith(".pdf")
    ) {
      const { body } = await readStoredFile(storageKey);
      text = await extractPdfText(body);
    }

    return NextResponse.json({
      storageKey,
      url: filePublicUrl(storageKey),
      text,
      mimeType,
      name: filename,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload-Abschluss fehlgeschlagen";
    console.error("[upload/complete]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
