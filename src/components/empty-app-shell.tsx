"use client";

import * as React from "react";
import { FolderOpen, Plus } from "lucide-react";

import {
  AppHeader,
  type ProjectOption,
} from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import type { SerializedNotification } from "@/lib/queries";

export type EmptyAppShellProps = {
  projects: ProjectOption[];
  userName: string;
  userInitials: string;
  userImage?: string | null;
  notifications: SerializedNotification[];
  isAppAdmin: boolean;
};

export function EmptyAppShell({
  projects,
  userName,
  userInitials,
  userImage,
  notifications,
  isAppAdmin,
}: EmptyAppShellProps) {
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
        navDisabled
        createDialogOpen={createOpen}
        onCreateDialogOpenChange={setCreateOpen}
        onProjectChange={(slug) => {
          window.location.href = `/p/${slug}/dashboard`;
        }}
      />

      <main className="min-h-0 flex-1 overflow-hidden">
        <ViewFrame
          eyebrow="Willkommen"
          title="Chronikon"
          description="Noch kein Ober-Thema — die App ist bereit, du startest mit deinem ersten Forschungsbereich."
          maxWidth="lg"
        >
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface-2/50">
              <FolderOpen
                className="h-8 w-8 text-muted-foreground/50"
                strokeWidth={1.25}
              />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Leer, aber einsatzbereit</h2>
            <p className="mb-6 max-w-md text-[0.85rem] leading-relaxed text-muted-foreground">
              Lege dein erstes Ober-Thema an — z. B. „Frühes Christentum / Bibel“,
              „Byzantinisches Reich“ oder „Osmanisches Reich“. Danach kannst du
              Einträge, Timeline und Karte nutzen.
            </p>
            <Button
              className="gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Erstes Ober-Thema anlegen
            </Button>
            <p className="mt-4 text-[0.72rem] text-muted-foreground">
              Oder oben im Projekt-Menü: „+ Neues Ober-Thema…“
            </p>
          </div>
        </ViewFrame>
      </main>
    </div>
  );
}
