"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { TableView } from "@/components/views/table-view";
import type { SerializedEntryListItem } from "@/lib/queries";

export function TablePageClient({
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
      viewMode="table"
    >
      <TableView
        entries={entries}
        onSelect={(id) => router.push(`/p/${projectSlug}?entry=${id}`)}
      />
    </AppShell>
  );
}
