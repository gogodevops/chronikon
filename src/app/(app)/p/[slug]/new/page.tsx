import { AppShell } from "@/components/app-shell";
import { CaptureForm } from "@/components/views/capture-form";
import { db } from "@/lib/db";
import { getEntryDetail } from "@/lib/queries";

export default async function NewEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : undefined;

  const project = await db.project.findUnique({
    where: { slug },
    include: { topics: { orderBy: { name: "asc" } } },
  });
  if (!project) return null;

  const editEntry = editId
    ? await getEntryDetail(project.id, editId)
    : null;

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={[]}
      totalCount={0}
      viewMode="form"
    >
      <CaptureForm
        projectId={project.id}
        projectSlug={slug}
        topics={project.topics.map((t) => t.name)}
        editEntryId={editEntry?.id}
        initialFields={
          editEntry
            ? {
                type: editEntry.type,
                title: editEntry.title,
                yearStart: String(editEntry.yearStart ?? ""),
                yearEnd: String(editEntry.yearEnd ?? ""),
                confidence: editEntry.confidence,
                topic: editEntry.topics?.[0] ?? "",
                summary: editEntry.summary ?? "",
                body: editEntry.body ?? "",
                language: editEntry.language ?? "",
                author: editEntry.author ?? "",
                placeName: editEntry.placeName ?? "",
              }
            : undefined
        }
      />
    </AppShell>
  );
}
