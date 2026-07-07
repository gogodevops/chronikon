import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { storeFile } from "@/lib/storage";

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text ?? "";
  } catch {
    return "";
  }
}

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

    let text = "";
    if (mimeType === "application/pdf" || file.name.endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    }

    const { storageKey, publicUrl } = await storeFile(
      buffer,
      file.name,
      mimeType,
    );

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
