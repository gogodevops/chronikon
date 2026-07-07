"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { GraphView } from "@/components/views/graph-view";
import type { SerializedEntryListItem } from "@/lib/queries";

export function GraphPageClient({
  project,
  entries,
  relations,
  projectSlug,
}: {
  project: { slug: string; name: string; icon: string };
  entries: SerializedEntryListItem[];
  relations: { source: string; target: string }[];
  projectSlug: string;
}) {
  const router = useRouter();

  return (
    <AppShell
      project={{ id: projectSlug, name: project.name, icon: project.icon }}
      entries={entries}
      totalCount={entries.length}
      viewMode="graph"
    >
      <div className="h-[calc(100vh-var(--header-h))]">
        <GraphView
          entries={entries}
          relations={relations}
          onSelect={(id) => router.push(`/p/${projectSlug}?entry=${id}`)}
        />
      </div>
    </AppShell>
  );
}
