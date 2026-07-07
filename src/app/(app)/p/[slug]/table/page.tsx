import { db } from "@/lib/db";
import { getEntriesForProject } from "@/lib/queries";

import { TablePageClient } from "./table-client";

export default async function TablePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  const { entries } = await getEntriesForProject(project.id, {}, { limit: 500 });

  return (
    <TablePageClient
      project={{ slug, name: project.name, icon: project.icon }}
      entries={entries}
      projectSlug={slug}
    />
  );
}
