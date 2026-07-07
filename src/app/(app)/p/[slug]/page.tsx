import { AppShell } from "@/components/app-shell";
import { generateKiChecks } from "@/lib/ki-review";
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
  const [{ entries, total }, recentActivityEntryIds] = await Promise.all([
    getEntriesForProject(project.id, filters),
    getRecentActivityEntryIds(project.id),
  ]);

  const selectedId =
    typeof sp.entry === "string" ? sp.entry : entries[0]?.id ?? null;

  const selectedEntry = selectedId
    ? await getEntryDetail(project.id, selectedId)
    : null;

  const [fullEntry, allEntries, entryIndex] = selectedId
    ? await Promise.all([
        db.entry.findFirst({
          where: { id: selectedId },
          include: {
            sources: true,
            relationsFrom: true,
            relationsTo: true,
          },
        }),
        db.entry.findMany({ where: { projectId: project.id } }),
        getEntryTitleIndex(project.id),
      ])
    : [null, [], await getEntryTitleIndex(project.id)];

  let kiChecks: ReturnType<typeof generateKiChecks> = [];
  if (fullEntry) {
    kiChecks = generateKiChecks(fullEntry, allEntries);
  }

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={entries}
      totalCount={total}
      selectedEntryId={selectedId}
      selectedEntry={selectedEntry}
      entryIndex={entryIndex}
      viewMode="browse"
      kiChecks={kiChecks}
      recentActivityEntryIds={recentActivityEntryIds}
    />
  );
}
