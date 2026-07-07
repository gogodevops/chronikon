import { AppShell } from "@/components/app-shell";
import { DiscussionsView } from "@/components/views/discussions-view";
import { db } from "@/lib/db";
import { getDiscussions } from "@/lib/queries";

export default async function DiscussionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  const items = await getDiscussions(project.id);

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={[]}
      totalCount={0}
      viewMode="discussions"
    >
      <DiscussionsView items={items} projectSlug={slug} />
    </AppShell>
  );
}
