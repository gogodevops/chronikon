import { redirect } from "next/navigation";

import { getUserLandingPath, listUserProjects } from "@/actions/projects";
import { auth } from "@/auth";
import { ProjectProvider } from "@/context/project-context";
import { getUserProjectRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getNotifications, getProjectBySlug } from "@/lib/queries";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await getProjectBySlug(slug, session.user.id);
  if (!project) {
    redirect(await getUserLandingPath(session.user.id));
  }

  const [memberships, role, user, notifications] = await Promise.all([
    listUserProjects(),
    getUserProjectRole(project.id, session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, avatarInitials: true, image: true },
    }),
    getNotifications(session.user.id),
  ]);

  if (!role) {
    redirect("/login");
  }

  const ctx = {
    id: project.id,
    slug: project.slug,
    name: project.name,
    icon: project.icon,
    topics: project.topics,
    savedViews: project.savedViews.map((v) => ({
      id: v.id,
      label: v.label,
    })),
    userRole: role,
    userName: user?.name ?? "Nutzer",
    userInitials: user?.avatarInitials ?? "??",
    userImage: user?.image,
    projects: memberships.map((m) => m.project),
    notifications,
  };

  return <ProjectProvider value={ctx}>{children}</ProjectProvider>;
}
