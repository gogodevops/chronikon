import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import {
  getEntriesForProject,
  getEntryDetail,
  getEntryTitleIndex,
  getRecentActivityEntryIds,
  parseFiltersFromSearchParams,
} from "@/lib/queries";

export default async function ProjectBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  const filters = parseFiltersFromSearchParams(sp);
  const [{ entries, total }, recentActivityEntryIds, entryIndex] =
    await Promise.all([
      getEntriesForProject(project.id, filters),
      getRecentActivityEntryIds(project.id),
      getEntryTitleIndex(project.id),
    ]);

  const selectedId =
    typeof sp.entry === "string" ? sp.entry : entries[0]?.id ?? null;

  const selectedEntry = selectedId
    ? await getEntryDetail(project.id, selectedId)
    : null;

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={entries}
      totalCount={total}
      selectedEntryId={selectedId}
      selectedEntry={selectedEntry}
      entryIndex={entryIndex}
      viewMode="browse"
      recentActivityEntryIds={recentActivityEntryIds}
    />
  );
}
