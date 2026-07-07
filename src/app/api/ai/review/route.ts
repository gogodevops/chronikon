import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { reviewEntry } from "@/lib/ai";
import { requireProjectRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const body = (await request.json()) as {
    entryId?: string;
    projectId?: string;
  };

  if (!body.entryId || !body.projectId) {
    return NextResponse.json({ error: "Parameter fehlen" }, { status: 400 });
  }

  try {
    await requireProjectRole(body.projectId, "viewer");
  } catch {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const [entry, projectEntries] = await Promise.all([
    db.entry.findFirst({
      where: { id: body.entryId, projectId: body.projectId },
    }),
    db.entry.findMany({
      where: { projectId: body.projectId },
      select: {
        id: true,
        title: true,
        type: true,
        yearStart: true,
        yearEnd: true,
        confidence: true,
        body: true,
        summary: true,
      },
    }),
  ]);

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  const suggestions = await reviewEntry(entry, projectEntries);
  return NextResponse.json({ suggestions });
}
