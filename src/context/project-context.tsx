"use client";

import * as React from "react";

import type { SerializedNotification } from "@/lib/queries";

export type ProjectContextValue = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  topics: { id: string; name: string }[];
  savedViews: { id: string; label: string }[];
  userRole: string;
  userName: string;
  userInitials: string;
  userImage?: string | null;
  projects: { id: string; slug: string; name: string; icon: string }[];
  notifications: SerializedNotification[];
  isAppAdmin: boolean;
};

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  value,
  children,
}: {
  value: ProjectContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error("useProject muss innerhalb ProjectProvider stehen");
  return ctx;
}
