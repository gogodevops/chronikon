import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { TeamView } from "@/components/views/team-view";
import { getTeamData } from "@/actions/team";
import { getUserProjectRole } from "@/lib/auth-helpers";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await db.project.findUnique({ where: { slug } });
  if (!project) notFound();

  const role = await getUserProjectRole(project.id, session.user.id);
  if (!role || role !== "owner") {
    redirect(`/p/${slug}/dashboard`);
  }

  const team = await getTeamData(project.id);

  return (
    <AppShell
      project={{ id: slug, name: project.name, icon: project.icon }}
      entries={[]}
      totalCount={0}
      viewMode="team"
    >
      <TeamView
        members={team.members}
        invites={team.invites}
        currentUserId={team.currentUserId}
        projectId={project.id}
      />
    </AppShell>
  );
}
