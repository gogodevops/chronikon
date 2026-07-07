import { AppShell } from "@/components/app-shell";
import { ExportView } from "@/components/views/export-view";
import { db } from "@/lib/db";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={[]}
      totalCount={0}
      viewMode="export"
    >
      <ExportView
        projectId={project.id}
        projectName={project.name}
        projectSlug={slug}
      />
    </AppShell>
  );
}
