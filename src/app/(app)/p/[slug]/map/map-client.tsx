"use client";

import { AppShell } from "@/components/app-shell";
import { MapView } from "@/components/views/map-view";
import type { SerializedEntryListItem } from "@/lib/queries";

export function MapPageClient({
  project,
  entries,
  projectSlug,
}: {
  project: { slug: string; name: string; icon: string };
  entries: SerializedEntryListItem[];
  projectSlug: string;
}) {
  return (
    <AppShell
      project={{ id: projectSlug, name: project.name, icon: project.icon }}
      entries={entries}
      totalCount={entries.length}
      viewMode="map"
    >
      <div className="h-[calc(100vh-var(--header-h))]">
        <MapView entries={entries} />
      </div>
    </AppShell>
  );
}
