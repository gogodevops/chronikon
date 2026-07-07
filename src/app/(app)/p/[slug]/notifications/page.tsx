import { AppShell } from "@/components/app-shell";
import { NotificationsView } from "@/components/views/notifications-view";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getNotifications } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await db.project.findUnique({ where: { slug } });
  if (!project) return null;

  const notifications = await getNotifications(session.user.id, 100);

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={[]}
      totalCount={0}
      viewMode="notifications"
    >
      <NotificationsView
        notifications={notifications}
        projectSlug={slug}
      />
    </AppShell>
  );
}
