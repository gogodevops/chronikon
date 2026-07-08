import { AppShell } from "@/components/app-shell";
import { CaptureForm } from "@/components/views/capture-form";
import { db } from "@/lib/db";
import {
  bookFormInitialFromEntry,
  inputFromSignedYear,
} from "@/lib/historical-year-fields";
import { getEntryDetail } from "@/lib/queries";

function yearFormFields(
  yearStart: number,
  yearEnd: number,
  bookFields?: ReturnType<typeof bookFormInitialFromEntry>,
) {
  if (bookFields) {
    return {
      yearStart: bookFields.yearStart,
      yearEnd: bookFields.yearEnd,
      eraStart: bookFields.eraStart,
      eraEnd: bookFields.eraEnd,
      publishedYearStart: bookFields.publishedYearStart,
      publishedYearEnd: bookFields.publishedYearEnd,
    };
  }

  const from = inputFromSignedYear(yearStart);
  const to = inputFromSignedYear(yearEnd);
  return {
    yearStart: from.year,
    yearEnd: to.year,
    eraStart: from.era,
    eraEnd: to.era,
    publishedYearStart: "",
    publishedYearEnd: "",
  };
}

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
          ...yearFormFields(parentEntry.yearStart, parentEntry.yearEnd),
          pageStart: "",
          pageEnd: "",
          confidence: parentEntry.confidence,
          topic: parentEntry.topics?.[0] ?? "",
          author: parentEntry.author ?? "",
          placeName: parentEntry.placeName ?? "",
        }
      : undefined;

  const editBookFields = editEntry
    ? bookFormInitialFromEntry(editEntry)
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
                ...yearFormFields(
                  editEntry.yearStart,
                  editEntry.yearEnd,
                  editBookFields,
                ),
                pageStart: String(editEntry.pageStart ?? ""),
                pageEnd: String(editEntry.pageEnd ?? ""),
                confidence: editEntry.confidence,
                topic: editEntry.topics?.[0] ?? "",
                author: editEntry.author ?? "",
                placeName: editEntry.placeName ?? "",
              }
            : childInitialFields
        }
      />
    </AppShell>
  );
}
