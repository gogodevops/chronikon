import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { CONF_META, TYPE_META } from "@/lib/constants";
import { requireProjectRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

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

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      entries: {
        include: {
          topics: { include: { topic: true } },
          sources: true,
          relationsFrom: { include: { toEntry: true } },
        },
        orderBy: { title: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
  }

  const lines: string[] = [
    `# ${project.name}`,
    "",
    `Exportiert: ${new Date().toISOString()}`,
    "",
    "---",
    "",
  ];

  for (const entry of project.entries) {
    lines.push(`## ${entry.title}`);
    lines.push("");
    lines.push(`- **Typ:** ${TYPE_META[entry.type].label}`);
    lines.push(`- **Zeitraum:** ${entry.yearStart} – ${entry.yearEnd}`);
    lines.push(`- **Confidence:** ${CONF_META[entry.confidence].label}`);
    if (entry.topics.length) {
      lines.push(
        `- **Themen:** ${entry.topics.map((t) => t.topic.name).join(", ")}`,
      );
    }
    if (entry.summary) {
      lines.push("");
      lines.push(entry.summary);
    }
    if (entry.body) {
      lines.push("");
      lines.push(entry.body);
    }
    if (entry.sources.length) {
      lines.push("");
      lines.push("### Quellen");
      for (const s of entry.sources) {
        lines.push(`- ${s.title}${s.ref ? ` (${s.ref})` : ""}`);
      }
    }
    if (entry.relationsFrom.length) {
      lines.push("");
      lines.push("### Verknüpfungen");
      for (const r of entry.relationsFrom) {
        lines.push(`- → ${r.toEntry.title} (${r.type})`);
      }
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const markdown = lines.join("\n");
  const filename = `chronikon-${project.slug}-export.md`;

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
