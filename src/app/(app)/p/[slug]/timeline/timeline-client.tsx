"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { TimelineView } from "@/components/views/timeline-view";
import type { SerializedEntryListItem } from "@/lib/queries";

export function TimelinePageClient({
  project,
  entries,
  projectSlug,
}: {
  project: { slug: string; name: string; icon: string };
  entries: SerializedEntryListItem[];
  projectSlug: string;
}) {
  const router = useRouter();

  return (
    <AppShell
      project={{ id: projectSlug, name: project.name, icon: project.icon }}
      entries={entries}
      totalCount={entries.length}
      viewMode="timeline"
    >
      <TimelineView
        entries={entries}
        onSelect={(id) => router.push(`/p/${projectSlug}?entry=${id}`)}
      />
    </AppShell>
  );
}
