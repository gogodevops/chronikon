"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateProjectDialog } from "@/components/create-project-dialog";
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
  | "form";

export interface ProjectOption {
  id: string;
  name: string;
  icon: string;
}

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
  onViewChange?: (view: AppView) => void;
  onProjectChange?: (projectId: string) => void;
  onCommandPaletteOpen?: () => void;
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
  onViewChange,
  onProjectChange,
  onCommandPaletteOpen,
}: AppHeaderProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const activeProject = currentProject ?? projects[0] ?? {
    id: "",
    name: "Kein Projekt",
    icon: "✦",
  };

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
      <span className="min-w-[90px] bg-gradient-to-r from-accent to-[#e8d5a0] bg-clip-text text-base font-bold tracking-wide text-transparent">
        Chronikon
      </span>

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
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              className={cn(
                project.id === activeProject.id && "text-accent",
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
        </DropdownMenuContent>
      </DropdownMenu>

      {canCreateProject && (
        <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}

      <nav className="flex flex-1 gap-1 overflow-x-auto rounded-lg bg-surface-2/40 p-0.5">
        {navItems.map(({ view, label }) => (
          <button
            key={view}
            type="button"
            onClick={() => onViewChange?.(view)}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-[0.8rem] text-muted-foreground transition-all hover:text-foreground",
              activeView === view &&
                "bg-accent-dim font-medium text-accent shadow-[inset_0_0_0_1px_rgba(196,163,90,0.18)]",
              view === "form" &&
                activeView !== view &&
                "text-accent/80 hover:text-accent",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2.5">
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
          projectSlug={activeProject.id}
        />

        <Avatar title={userName} className="h-[30px] w-[30px] cursor-pointer">
          {userImage && <AvatarImage src={userImage} alt={userName} />}
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
