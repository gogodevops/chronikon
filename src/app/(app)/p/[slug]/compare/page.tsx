import { AppShell } from "@/components/app-shell";
import { CompareView } from "@/components/views/compare-view";
import { db } from "@/lib/db";

const ROBINSON_LOGION_114 = `Logion 114 (Robinson 1988):
Simon Petrus sprach zu ihnen: „Lasst Maria von uns gehen, denn Frauen sind des Lebens nicht würdig."
Jesus sprach: „Siehe, ich werde sie leiten, damit ich sie männlich mache, damit sie auch ein lebendiger Geist werde wie ihr Männer. Denn jedes Weib, das männlich wird, wird des Himmelreiches würdig."`;

const PLISCH_LOGION_114 = `Logion 114 (Plisch 2007):
Simon Petrus sagte zu ihnen: „Lasst Mariam von uns weggehen, denn Frauen sind nicht würdig, das Leben zu empfangen."
Jesus sagte: „Siehe, ich werde sie leiten, damit ich sie männlich mache, damit sie auch ein lebendiger Geist werde wie ihr Männer. Denn jedes Weib, das männlich wird, wird des Himmelreiches würdig."

Anmerkung Plisch: Der koptische Text ist mehrdeutig — „männlich machen" kann metaphorisch gemeint sein.`;

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  const compareSet = await db.compareSet.findFirst({
    where: { projectId: project.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  const items =
    compareSet?.items.map((i) => ({ label: i.label, content: i.content })) ?? [
      { label: "Robinson (1988)", content: ROBINSON_LOGION_114 },
      { label: "Plisch (2007)", content: PLISCH_LOGION_114 },
    ];

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={[]}
      totalCount={0}
      viewMode="compare"
    >
      <CompareView
        title={compareSet?.title ?? "Logion 114 — Übersetzungsvergleich"}
        items={items}
      />
    </AppShell>
  );
}
