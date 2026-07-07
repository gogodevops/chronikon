import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { db } from "@/lib/db";
import {
  ACTIVITY_PAGE_SIZE,
  getDashboardStats,
  getProjectActivityPage,
} from "@/lib/queries";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawPage = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  const [stats, activityPage] = await Promise.all([
    getDashboardStats(project.id),
    getProjectActivityPage(project.id, page, ACTIVITY_PAGE_SIZE),
  ]);

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={[]}
      totalCount={0}
      viewMode="dashboard"
    >
      <DashboardView
        stats={stats}
        activityPage={activityPage}
        projectSlug={slug}
      />
    </AppShell>
  );
}
