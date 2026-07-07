import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { extractPdfText } from "@/lib/pdf-text";
import { storeFile } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    const { storageKey, publicUrl } = await storeFile(
      buffer,
      file.name,
      mimeType,
    );

    let text = "";
    if (mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    }

    return NextResponse.json({
      storageKey,
      url: publicUrl,
      text,
      mimeType,
      name: file.name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload fehlgeschlagen";
    console.error("[upload]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
