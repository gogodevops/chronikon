import { listUserProjects } from "@/actions/projects";
import { auth } from "@/auth";
import { EmptyAppShell } from "@/components/empty-app-shell";
import { isAppAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getNotifications } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function AppHomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const memberships = await listUserProjects();
  if (memberships.length > 0) {
    redirect(`/p/${memberships[0].project.slug}/dashboard`);
  }

  const [user, notifications, appAdmin] = await Promise.all([
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

  return (
    <EmptyAppShell
      projects={projects}
      userName={user?.name ?? "Nutzer"}
      userInitials={user?.avatarInitials ?? "??"}
      userImage={user?.image}
      notifications={notifications}
      isAppAdmin={appAdmin}
    />
  );
}
