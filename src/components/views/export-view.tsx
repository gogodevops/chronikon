"use client";

import { Button } from "@/components/ui/button";

export function ExportView({ projectId }: { projectId: string }) {
  const handleExport = () => {
    window.open(`/api/export?projectId=${projectId}`, "_blank");
  };

  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold">Export</h2>
      <p className="mb-6 max-w-lg text-sm text-muted-foreground">
        Alle Einträge des Projekts als Markdown-Datei exportieren — inklusive
        Metadaten, Quellen und Verknüpfungen.
      </p>
      <Button onClick={handleExport}>Als Markdown exportieren</Button>
    </div>
  );
}
