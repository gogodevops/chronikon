import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { analyzeDocument } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const body = (await request.json()) as {
    text?: string;
    filename?: string;
    projectSlug?: string;
  };

  const project = body.projectSlug
    ? await db.project.findUnique({ where: { slug: body.projectSlug } })
    : null;

  const analysis = await analyzeDocument(
    body.text ?? "",
    body.filename ?? "document",
    project
      ? {
          slug: project.slug,
          name: project.name,
          topics: [],
        }
      : undefined,
  );

  return NextResponse.json(analysis);
}
