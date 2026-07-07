import { db } from "@/lib/db";
import { getEntriesForProject } from "@/lib/queries";

import { GraphPageClient } from "./graph-client";

export default async function GraphPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  const [{ entries }, relations] = await Promise.all([
    getEntriesForProject(project.id, {}, { limit: 500 }),
    db.entryRelation.findMany({
      where: {
        fromEntry: { projectId: project.id },
      },
      select: { fromEntryId: true, toEntryId: true },
    }),
  ]);

  return (
    <GraphPageClient
      project={{ slug, name: project.name, icon: project.icon }}
      entries={entries}
      relations={relations.map((r) => ({
        source: r.fromEntryId,
        target: r.toEntryId,
      }))}
      projectSlug={slug}
    />
  );
}
