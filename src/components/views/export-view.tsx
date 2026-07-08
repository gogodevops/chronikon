"use client";

import { Archive, FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ViewFrame } from "@/components/ui/chronikon-shell";

export function ExportView({
  projectId,
}: {
  projectId: string;
  projectName: string;
  projectSlug: string;
}) {
  return (
    <ViewFrame
      eyebrow="Export"
      title="Wissen exportieren"
      description="Projekt als ZIP oder Markdown herunterladen."
      maxWidth="md"
    >
      <section className="rounded-xl border border-border bg-surface-2/60 p-4">
        <h3 className="mb-1 text-[0.85rem] font-semibold">Projekt exportieren</h3>
        <p className="mb-3 text-[0.78rem] text-muted-foreground">
          Alle Einträge als Markdown-Dateien im ZIP-Archiv oder als einzelne
          Markdown-Datei.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-1.5"
            onClick={() =>
              window.open(`/api/export/zip?projectId=${projectId}`, "_blank")
            }
          >
            <Archive className="h-3.5 w-3.5" />
            Projekt als ZIP
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() =>
              window.open(`/api/export?projectId=${projectId}`, "_blank")
            }
          >
            <FileDown className="h-3.5 w-3.5" />
            Als Markdown
          </Button>
        </div>
      </section>
    </ViewFrame>
  );
}
