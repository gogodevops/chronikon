import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { TYPE_META } from "@/lib/constants";
import { searchEntries } from "@/lib/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const q = searchParams.get("q") ?? "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId fehlt" }, { status: 400 });
  }

  try {
    const results = await searchEntries(projectId, q);
    const mapped = results.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      subtitle: r.subtitle ?? TYPE_META.text.label,
      entryId: r.entryId,
    }));
    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Suche fehlgeschlagen" }, { status: 500 });
  }
}
