import { AppShell } from "@/components/app-shell";
import { CaptureForm } from "@/components/views/capture-form";
import { db } from "@/lib/db";
import { DEFAULT_ENTRY_LANGUAGE } from "@/lib/languages";
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
  const parentId = typeof sp.parent === "string" ? sp.parent : undefined;

  const project = await db.project.findUnique({
    where: { slug },
    include: { topics: { orderBy: { name: "asc" } } },
  });
  if (!project) return null;

  const [editEntry, parentEntry] = await Promise.all([
    editId ? getEntryDetail(project.id, editId) : null,
    parentId ? getEntryDetail(project.id, parentId) : null,
  ]);

  const childInitialFields =
    parentEntry && parentEntry.type === "book"
      ? {
          type: "text",
          title: "",
          yearStart: String(parentEntry.yearStart ?? ""),
          yearEnd: String(parentEntry.yearEnd ?? ""),
          confidence: parentEntry.confidence,
          topic: parentEntry.topics?.[0] ?? "",
          summary: "",
          body: "",
          language: parentEntry.language ?? DEFAULT_ENTRY_LANGUAGE,
          author: parentEntry.author ?? "",
          placeName: parentEntry.placeName ?? "",
        }
      : undefined;

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
        parentEntryId={
          parentEntry?.type === "book" ? parentEntry.id : undefined
        }
        parentEntryTitle={
          parentEntry?.type === "book" ? parentEntry.title : undefined
        }
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
                language: editEntry.language ?? DEFAULT_ENTRY_LANGUAGE,
                author: editEntry.author ?? "",
                placeName: editEntry.placeName ?? "",
              }
            : childInitialFields
        }
      />
    </AppShell>
  );
}
