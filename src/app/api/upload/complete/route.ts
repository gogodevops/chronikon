import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
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

  return NextResponse.json({
    storageKey,
    url: filePublicUrl(storageKey),
    mimeType,
    name: filename,
  });
}
