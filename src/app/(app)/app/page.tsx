import { listUserProjects } from "@/actions/projects";
import { auth } from "@/auth";
import { EmptyAppShell } from "@/components/empty-app-shell";
import { UserProjectsPicker } from "@/components/user-projects-picker";
import { SystemOverviewView } from "@/components/views/system-overview-view";
import { isAppAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getNotifications } from "@/lib/queries";
import {
  getSystemActivity,
  getSystemOverviewStats,
  getSystemProjects,
  getSystemUsers,
} from "@/lib/system-queries";
import { redirect } from "next/navigation";

export default async function AppHomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [memberships, user, notifications, appAdmin] = await Promise.all([
    listUserProjects(),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, avatarInitials: true, image: true },
    }),
    getNotifications(session.user.id),
    isAppAdmin(session.user.id),
  ]);

  const projects = memberships.map((m) => ({
    id: m.project.slug,
    name: m.project.name,
    icon: m.project.icon,
  }));

  const shellProps = {
    projects,
    userName: user?.name ?? "Nutzer",
    userInitials: user?.avatarInitials ?? "??",
    userImage: user?.image,
    notifications,
    isAppAdmin: appAdmin,
  };

  if (appAdmin) {
    const [stats, users, systemProjects, activity] = await Promise.all([
      getSystemOverviewStats(),
      getSystemUsers(8),
      getSystemProjects(),
      getSystemActivity(20),
    ]);

    return (
      <SystemOverviewView
        {...shellProps}
        stats={stats}
        users={users}
        systemProjects={systemProjects}
        activity={activity}
      />
    );
  }

  if (memberships.length > 0) {
    return <UserProjectsPicker {...shellProps} />;
  }

  return <EmptyAppShell {...shellProps} />;
}
