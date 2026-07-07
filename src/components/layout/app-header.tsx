"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Search, Trash2, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import type { SerializedNotification } from "@/lib/queries";

export type AppView =
  | "browse"
  | "dashboard"
  | "timeline"
  | "map"
  | "table"
  | "graph"
  | "discussions"
  | "notifications"
  | "team"
  | "form"
  | "export"
  | "compare";

export interface ProjectOption {
  id: string;
  dbId?: string;
  name: string;
  icon: string;
}

export const SYSTEM_PROJECT_ID = "__chronikon_system__";

export interface AppHeaderProps {
  projects?: ProjectOption[];
  currentProject?: ProjectOption;
  activeView?: AppView;
  userName?: string;
  userImage?: string;
  userInitials?: string;
  notifications?: SerializedNotification[];
  showTeamNav?: boolean;
  canCreateProject?: boolean;
  isAppAdmin?: boolean;
  isSystemView?: boolean;
  navDisabled?: boolean;
  createDialogOpen?: boolean;
  onCreateDialogOpenChange?: (open: boolean) => void;
  onViewChange?: (view: AppView) => void;
  onProjectChange?: (projectId: string) => void;
  onCommandPaletteOpen?: () => void;
  canDeleteCurrentProject?: boolean;
  currentProjectDbId?: string;
}

const BASE_NAV_ITEMS: { view: AppView; label: string }[] = [
  { view: "dashboard", label: "Dashboard" },
  { view: "browse", label: "Einträge" },
  { view: "discussions", label: "Diskussionen" },
  { view: "timeline", label: "Timeline" },
  { view: "map", label: "Karte" },
  { view: "table", label: "Tabelle" },
  { view: "graph", label: "Graph" },
  { view: "form", label: "+ Neu" },
];

const TEAM_NAV_ITEM = { view: "team" as const, label: "Team" };

const SYSTEM_NAV_ITEMS = [
  { href: "/app", label: "Übersicht" },
  { href: "/admin/users", label: "Nutzer verwalten" },
] as const;

function buildNavItems(showTeamNav: boolean) {
  if (!showTeamNav) return BASE_NAV_ITEMS;
  const items = [...BASE_NAV_ITEMS];
  const formIdx = items.findIndex((i) => i.view === "form");
  items.splice(formIdx, 0, TEAM_NAV_ITEM);
  return items;
}

export function AppHeader({
  projects = [],
  currentProject,
  activeView = "dashboard",
  userName = "Max Forscher",
  userImage,
  userInitials = "MF",
  notifications = [],
  showTeamNav = false,
  canCreateProject = false,
  isAppAdmin = false,
  isSystemView = false,
  navDisabled = false,
  createDialogOpen: createDialogOpenProp,
  onCreateDialogOpenChange,
  onViewChange,
  onProjectChange,
  onCommandPaletteOpen,
  canDeleteCurrentProject = false,
  currentProjectDbId,
}: AppHeaderProps) {
  const [createOpenInternal, setCreateOpenInternal] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const createOpen = createDialogOpenProp ?? createOpenInternal;
  const setCreateOpen = onCreateDialogOpenChange ?? setCreateOpenInternal;

  const systemProject: ProjectOption = {
    id: SYSTEM_PROJECT_ID,
    name: "Chronikon",
    icon: "✦",
  };

  const activeProject = isSystemView
    ? systemProject
    : (currentProject ?? projects[0] ?? {
        id: "",
        name: "Kein Projekt",
        icon: "✦",
      });

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onCommandPaletteOpen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCommandPaletteOpen]);

  const navItems = buildNavItems(showTeamNav);

  return (
    <header className="flex h-[var(--header-h)] shrink-0 items-center gap-3 border-b border-border/80 bg-surface/95 px-4 backdrop-blur-sm">
      <div className="flex min-w-[90px] items-center gap-2">
        {isAppAdmin ? (
          <Link
            href="/app"
            className="bg-gradient-to-r from-accent to-[#e8d5a0] bg-clip-text text-base font-bold tracking-wide text-transparent transition-opacity hover:opacity-80"
          >
            Chronikon
          </Link>
        ) : (
          <span className="bg-gradient-to-r from-accent to-[#e8d5a0] bg-clip-text text-base font-bold tracking-wide text-transparent">
            Chronikon
          </span>
        )}
        {isAppAdmin && !isSystemView && (
          <Link
            href="/app"
            className="rounded-md border border-border/70 bg-surface-2/80 px-1.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
          >
            System
          </Link>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex min-w-[200px] cursor-pointer items-center gap-2 rounded-lg border border-border/80 bg-surface-2/80 px-3 py-1.5 text-[0.82rem] transition-colors hover:border-accent/30 hover:bg-surface-3"
          >
            <span>{activeProject.icon}</span>
            <span className="truncate">{activeProject.name}</span>
            <span className="ml-auto text-muted">▾</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[240px]">
          {isAppAdmin && (
            <>
              <DropdownMenuItem
                className={cn(
                  isSystemView && "text-accent",
                )}
                onClick={() => {
                  window.location.href = "/app";
                }}
              >
                <span>✦</span>
                Chronikon
                <span className="ml-auto text-[0.65rem] text-muted-foreground">
                  System
                </span>
              </DropdownMenuItem>
              {projects.length > 0 && <DropdownMenuSeparator />}
            </>
          )}
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              className={cn(
                !isSystemView && project.id === activeProject.id && "text-accent",
              )}
              onClick={() => onProjectChange?.(project.id)}
            >
              <span>{project.icon}</span>
              {project.name}
            </DropdownMenuItem>
          ))}
          {canCreateProject && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                <span className="text-accent">+</span>
                Neues Ober-Thema…
              </DropdownMenuItem>
            </>
          )}
          {canDeleteCurrentProject && currentProjectDbId && !isSystemView && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Ober-Thema löschen…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canCreateProject && (
        <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}

      {canDeleteCurrentProject && currentProjectDbId && !isSystemView && (
        <DeleteProjectDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          projectId={currentProjectDbId}
          projectName={activeProject.name}
        />
      )}

      <nav className="flex flex-1 gap-1 overflow-x-auto rounded-lg bg-surface-2/40 p-0.5">
        {isSystemView
          ? SYSTEM_NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[0.8rem] text-muted-foreground transition-all",
                  "cursor-pointer hover:text-foreground",
                  href === "/app" &&
                    "bg-accent-dim font-medium text-accent shadow-[inset_0_0_0_1px_rgba(196,163,90,0.18)]",
                )}
              >
                {label}
              </Link>
            ))
          : navItems.map(({ view, label }) => (
              <button
                key={view}
                type="button"
                disabled={navDisabled}
                title={navDisabled ? "Zuerst ein Ober-Thema anlegen" : undefined}
                onClick={() => !navDisabled && onViewChange?.(view)}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[0.8rem] text-muted-foreground transition-all",
                  navDisabled
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:text-foreground",
                  activeView === view &&
                    !navDisabled &&
                    "bg-accent-dim font-medium text-accent shadow-[inset_0_0_0_1px_rgba(196,163,90,0.18)]",
                  view === "form" &&
                    activeView !== view &&
                    !navDisabled &&
                    "text-accent/80 hover:text-accent",
                )}
              >
                {label}
              </button>
            ))}
      </nav>

      <div className="flex items-center gap-2.5">
        {isAppAdmin && (
          <Link
            href="/admin/users"
            title="Nutzer verwalten"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/80 bg-surface-2/80 text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
          >
            <Users className="h-3.5 w-3.5" />
          </Link>
        )}
        <button
          type="button"
          onClick={onCommandPaletteOpen}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/80 bg-surface-2/80 px-3 py-1.5 text-[0.8rem] text-muted-foreground transition-colors hover:border-accent/25 hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Suchen</span>
          <kbd className="rounded border border-border bg-surface-3 px-1.5 py-0.5 text-[0.7rem]">
            ⌘K
          </kbd>
        </button>

        <NotificationBell
          notifications={notifications}
          projectSlug={
            isSystemView ? projects[0]?.id : activeProject.id || undefined
          }
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={userName}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Avatar className="h-[30px] w-[30px] cursor-pointer">
                {userImage && <AvatarImage src={userImage} alt={userName} />}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem disabled className="text-muted-foreground">
              {userName}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
