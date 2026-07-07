"use client";

import * as React from "react";
import Link from "next/link";
import { Archive, FileDown } from "lucide-react";

import {
  ProjectKiTemplatePicker,
  ProjectTypeKiTemplatePicker,
} from "@/components/entry/ki-template-picker";
import { Button } from "@/components/ui/button";
import { ViewFrame } from "@/components/ui/chronikon-shell";

export function ExportView({
  projectId,
  projectName,
  projectSlug,
}: {
  projectId: string;
  projectName: string;
  projectSlug: string;
}) {
  return (
    <ViewFrame
      eyebrow="Export & externe KI"
      title="Wissen exportieren"
      description="ZIP herunterladen, dann Vorlagen in ChatGPT, Claude o.ä. einfügen. Chronikon hat keine eingebaute KI."
      maxWidth="md"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-surface-2/60 p-4">
          <h3 className="mb-1 text-[0.85rem] font-semibold">Projekt als ZIP</h3>
          <p className="mb-3 text-[0.78rem] text-muted-foreground">
            Alle Einträge (Markdown) und OCR-Texte aus PDF-Anhängen — strukturiert
            für externe KI im Ordner <strong>ocr/</strong>.
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

        <section className="rounded-xl border border-border bg-surface-2/60 p-4">
          <h3 className="mb-1 text-[0.85rem] font-semibold">
            KI-Vorlage (ganzes Projekt)
          </h3>
          <p className="mb-3 text-[0.78rem] text-muted-foreground">
            Zuerst ZIP exportieren, dann Inhalte + Vorlage in externe KI einfügen.
          </p>
          <ProjectKiTemplatePicker projectName={projectName} />
        </section>

        <section className="rounded-xl border border-border bg-surface-2/60 p-4">
          <h3 className="mb-1 text-[0.85rem] font-semibold">
            KI-Vorlage (nach Eintragstyp)
          </h3>
          <p className="mb-3 text-[0.78rem] text-muted-foreground">
            Typ und Vorlage wählen — für Bulk-Analyse aller Einträge eines Typs
            aus dem ZIP-Export.
          </p>
          <ProjectTypeKiTemplatePicker projectName={projectName} />
        </section>

        <p className="text-[0.75rem] text-muted-foreground">
          Pro Eintrag: In der{" "}
          <Link
            href={`/p/${projectSlug}`}
            className="text-accent hover:underline"
          >
            Detailansicht
          </Link>{" "}
          unter „Für externe KI" — Vorlage wählen, OCR wird automatisch
          eingefügt.
        </p>
      </div>
    </ViewFrame>
  );
}
