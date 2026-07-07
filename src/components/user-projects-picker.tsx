"use client";

import * as React from "react";
import { ChevronRight, FolderOpen } from "lucide-react";

import {
  AppHeader,
  type ProjectOption,
} from "@/components/layout/app-header";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import type { SerializedNotification } from "@/lib/queries";

export type UserProjectsPickerProps = {
  projects: ProjectOption[];
  userName: string;
  userInitials: string;
  userImage?: string | null;
  notifications: SerializedNotification[];
  isAppAdmin?: boolean;
};

export function UserProjectsPicker({
  projects,
  userName,
  userInitials,
  userImage,
  notifications,
  isAppAdmin = false,
}: UserProjectsPickerProps) {
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
        navDisabled
        onProjectChange={(slug) => {
          window.location.href = `/p/${slug}/dashboard`;
        }}
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <ViewFrame
          eyebrow="Willkommen"
          title="Deine Ober-Themen"
          description="Wähle ein Forschungsprojekt, um fortzufahren."
          maxWidth="md"
        >
          <ul className="space-y-2 px-2 py-4">
            {projects.map((project) => (
              <li key={project.id}>
                <a
                  href={`/p/${project.id}/dashboard`}
                  className="group flex items-center gap-4 rounded-xl border border-border/80 bg-surface-2/70 px-4 py-4 transition-all hover:border-accent/30 hover:bg-surface-3 hover:shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-surface-3 text-xl">
                    {project.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.92rem] font-semibold">
                      {project.name}
                    </p>
                    <p className="text-[0.75rem] text-muted-foreground">
                      Zum Dashboard öffnen
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-accent opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>

          {projects.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface-2/50">
                <FolderOpen
                  className="h-8 w-8 text-muted-foreground/50"
                  strokeWidth={1.25}
                />
              </div>
              <p className="text-[0.85rem] text-muted-foreground">
                Noch keine Ober-Themen verfügbar.
              </p>
            </div>
          )}
        </ViewFrame>
      </main>
    </div>
  );
}
