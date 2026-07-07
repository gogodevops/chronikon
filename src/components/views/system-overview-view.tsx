"use client";

import * as React from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowRight,
  FolderOpen,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import {
  AppHeader,
  type ProjectOption,
} from "@/components/layout/app-header";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { SystemActivityFeed } from "@/components/system-activity-feed";
import { Button } from "@/components/ui/button";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import { CHANGELOG } from "@/lib/changelog";
import type { SerializedNotification } from "@/lib/queries";
import type {
  SystemActivityItem,
  SystemOverviewStats,
  SystemProjectRow,
  SystemUserRow,
} from "@/lib/system-queries";

export type SystemOverviewViewProps = {
  projects: ProjectOption[];
  userName: string;
  userInitials: string;
  userImage?: string | null;
  notifications: SerializedNotification[];
  isAppAdmin: boolean;
  stats: SystemOverviewStats;
  users: SystemUserRow[];
  systemProjects: SystemProjectRow[];
  activity: SystemActivityItem[];
};

export function SystemOverviewView({
  projects,
  userName,
  userInitials,
  userImage,
  notifications,
  isAppAdmin,
  stats,
  users,
  systemProjects,
  activity,
}: SystemOverviewViewProps) {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <AppHeader
        projects={projects}
        activeView="dashboard"
        userName={userName}
        userImage={userImage ?? undefined}
        userInitials={userInitials}
        notifications={notifications}
        canCreateProject
        isAppAdmin={isAppAdmin}
        isSystemView
        createDialogOpen={createOpen}
        onCreateDialogOpenChange={setCreateOpen}
        onProjectChange={(slug) => {
          window.location.href = `/p/${slug}/dashboard`;
        }}
      />
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />

      <main className="min-h-0 flex-1 overflow-hidden">
        <ViewFrame
          eyebrow="Chronikon"
          title="System-Übersicht"
          description="Plattformweite Kennzahlen, Nutzer und letzte Aktivität."
          maxWidth="full"
          fixedBody
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Neues Ober-Thema
              </Button>
              {isAppAdmin && (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5" asChild>
                    <Link href="/admin/users">
                      <UserPlus className="h-3.5 w-3.5" />
                      Nutzer einladen
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" asChild>
                    <Link href="/admin/users">
                      <Users className="h-3.5 w-3.5" />
                      Nutzer verwalten
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4">
              <KpiCard label="Nutzer" value={stats.userCount} />
              <KpiCard label="Ober-Themen" value={stats.projectCount} />
              <KpiCard label="Einträge gesamt" value={stats.entryCount} />
              <KpiCard label="Offene Einladungen" value={stats.pendingInvites} />
            </div>

            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-5">
              <section className="flex min-h-0 flex-col overflow-hidden lg:col-span-3">
                <SectionCard
                  title="Letzte Aktivität"
                  subtitle="Über alle Ober-Themen"
                  icon={Sparkles}
                  scroll
                >
                  <SystemActivityFeed items={activity} compact />
                </SectionCard>
              </section>

              <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto lg:col-span-2">
                <SectionCard
                  title="Nutzer im System"
                  subtitle={`${stats.userCount} gesamt`}
                >
                  <ul className="space-y-2">
                    {users.map((user) => (
                      <li
                        key={user.id}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-2/50 px-2.5 py-2"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[0.65rem] font-medium">
                          {user.avatarInitials ?? "?"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-medium">
                            {user.name ?? user.email}
                            {user.isAdmin && (
                              <span className="ml-1.5 text-[0.62rem] font-normal text-accent">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[0.68rem] text-muted-foreground">
                            {user.projectCount} Ober-Thema
                            {user.projectCount === 1 ? "" : "n"}
                            {" · "}
                            {format(new Date(user.createdAt), "d. MMM yyyy", {
                              locale: de,
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {isAppAdmin && (
                    <Link
                      href="/admin/users"
                      className="mt-2 inline-flex items-center gap-1 text-[0.72rem] text-accent hover:underline"
                    >
                      Alle Nutzer
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </SectionCard>

                <SectionCard
                  title="Ober-Themen"
                  subtitle={`${stats.projectCount} Projekte`}
                  icon={FolderOpen}
                >
                  <ul className="space-y-1.5">
                    {systemProjects.map((project) => (
                      <SystemProjectListItem key={project.id} project={project} />
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title="Was ist neu" subtitle="Chronikon Updates">
                  <div className="space-y-3">
                    {CHANGELOG.map((entry) => (
                      <div
                        key={entry.version}
                        className="rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2.5"
                      >
                        <p className="text-[0.78rem] font-medium">
                          v{entry.version} — {entry.title}
                        </p>
                        <p className="text-[0.68rem] text-muted-foreground">
                          {entry.date}
                        </p>
                        <ul className="mt-2 space-y-1 text-[0.72rem] text-muted-foreground">
                          {entry.items.map((item) => (
                            <li key={item} className="flex gap-1.5">
                              <span className="text-accent">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </aside>
            </div>
          </div>
        </ViewFrame>
      </main>
    </div>
  );
}

function SystemProjectListItem({ project }: { project: SystemProjectRow }) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <li>
      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface-2/50 pr-1 transition-colors hover:border-accent/30 hover:bg-surface-3/40">
        <Link
          href={`/p/${project.slug}/dashboard`}
          className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2"
        >
          <span className="text-base" aria-hidden>
            {project.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.78rem] font-medium">{project.name}</p>
            <p className="text-[0.68rem] text-muted-foreground">
              {project.memberCount} Mitglieder · {project.entryCount} Einträge
              {project.lastActivityAt && (
                <>
                  {" · "}
                  {formatDistanceToNow(new Date(project.lastActivityAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </>
              )}
            </p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
          title="Ober-Thema löschen"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <DeleteProjectDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </li>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5">
      <p className="text-[0.68rem] text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  scroll,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  scroll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        scroll
          ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-surface-2/30"
          : "rounded-xl border border-border/70 bg-surface-2/30"
      }
    >
      <header className="shrink-0 border-b border-border/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-accent" />}
          <h3 className="text-[0.82rem] font-semibold">{title}</h3>
        </div>
        {subtitle && (
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{subtitle}</p>
        )}
      </header>
      <div
        className={
          scroll ? "min-h-0 flex-1 overflow-y-auto px-3.5 py-3" : "px-3.5 py-3"
        }
      >
        {children}
      </div>
    </section>
  );
}
