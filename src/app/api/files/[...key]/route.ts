import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";

async function canAccessFile(
  userId: string,
  storageKey: string,
): Promise<boolean> {
  const attachment = await db.attachment.findFirst({
    where: { storageKey },
    select: {
      entry: {
        select: {
          project: {
            select: {
              members: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  return (attachment?.entry.project.members.length ?? 0) > 0;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { key } = await context.params;
  const storageKey = key.join("/");

  if (!storageKey.startsWith("uploads/")) {
    return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 });
  }

  const allowed = await canAccessFile(session.user.id, storageKey);
  if (!allowed) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  try {
    const { body, mimeType } = await readStoredFile(storageKey);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }
}
