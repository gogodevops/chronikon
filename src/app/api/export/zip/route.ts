import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireProjectRole } from "@/lib/auth-helpers";
import { buildProjectKnowledgeZip } from "@/lib/project-knowledge-export";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId fehlt" }, { status: 400 });
  }

  try {
    await requireProjectRole(projectId, "viewer");
  } catch {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  try {
    const { buffer, filename } = await buildProjectKnowledgeZip(projectId);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Export fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
