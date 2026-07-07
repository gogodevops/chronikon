"use client";

import * as React from "react";
import Link from "next/link";
import { Archive, FileDown } from "lucide-react";
import type { EntryType } from "@prisma/client";

import { CopyTextButton } from "@/components/ui/copy-text-button";
import { Button } from "@/components/ui/button";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import { TYPE_META } from "@/lib/constants";
import {
  ENTRY_TYPE_HINTS,
  fillKiTemplate,
  getProjectTypeKiPrompt,
  PROJECT_KI_TEMPLATES,
} from "@/lib/ki-templates";

export function ExportView({
  projectId,
  projectName,
  projectSlug,
}: {
  projectId: string;
  projectName: string;
  projectSlug: string;
}) {
  const [selectedTemplate, setSelectedTemplate] = React.useState(
    PROJECT_KI_TEMPLATES[0]?.id ?? "",
  );
  const [selectedType, setSelectedType] = React.useState<EntryType>("text");

  const template = PROJECT_KI_TEMPLATES.find((t) => t.id === selectedTemplate);

  const projectPrompt = template
    ? fillKiTemplate(template.prompt, {
        PROJECT: projectName,
        ENTRIES:
          "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren)",
      })
    : "";

  const typePrompt = getProjectTypeKiPrompt(selectedType, projectName);

  return (
    <ViewFrame
      eyebrow="Export & Online-KI"
      title="Wissen exportieren"
      description="ZIP herunterladen, dann Vorlagen in ChatGPT, Claude o.ä. einfügen. Chronikon hat keine eingebaute KI."
      maxWidth="md"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-surface-2/60 p-4">
          <h3 className="mb-1 text-[0.85rem] font-semibold">Projekt als ZIP</h3>
          <p className="mb-3 text-[0.78rem] text-muted-foreground">
            Alle Einträge (Markdown) und OCR-Texte aus PDF-Anhängen — strukturiert
            für externe KI.
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
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.82rem]"
          >
            {PROJECT_KI_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.category}: {t.title}
              </option>
            ))}
          </select>
          {template && (
            <>
              <p className="mb-2 text-[0.75rem] text-muted-foreground">
                {template.description}
              </p>
              <pre className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-border/60 bg-surface p-3 text-[0.72rem] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {projectPrompt}
              </pre>
              <CopyTextButton label="KI-Vorlage kopieren" text={projectPrompt} />
            </>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-2/60 p-4">
          <h3 className="mb-1 text-[0.85rem] font-semibold">
            KI-Vorlage (nach Eintragstyp)
          </h3>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as EntryType)}
            className="mb-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.82rem]"
          >
            {(Object.keys(TYPE_META) as EntryType[]).map((type) => (
              <option key={type} value={type}>
                {TYPE_META[type].label}
              </option>
            ))}
          </select>
          <p className="mb-3 text-[0.75rem] text-muted-foreground">
            {ENTRY_TYPE_HINTS[selectedType]}
          </p>
          <CopyTextButton label="KI-Vorlage kopieren" text={typePrompt} />
        </section>

        <p className="text-[0.75rem] text-muted-foreground">
          Pro Eintrag: In der{" "}
          <Link
            href={`/p/${projectSlug}`}
            className="text-accent hover:underline"
          >
            Detailansicht
          </Link>{" "}
          unter „Für Online-KI" — Text und Vorlage einzeln kopieren.
        </p>
      </div>
    </ViewFrame>
  );
}
