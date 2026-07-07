"use client";

import * as React from "react";
import type { EntryType } from "@prisma/client";

import {
  EntryTypeTemplateCard,
  KiTemplateCardFromDefinition,
  KiTemplateFullPreview,
} from "@/components/entry/ki-template-card";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import {
  buildEntryKiVars,
  getEntryKiTemplates,
  getEntryTypeKiTemplate,
  hasOcrContent,
  KI_WORKFLOW_HINT,
  PROJECT_KI_TEMPLATES,
  renderEntryKiPrompt,
  renderProjectKiPrompt,
  type KiAttachmentInput,
  type KiChildEntryInput,
} from "@/lib/ki-templates";
import { ENTRY_TYPE_HINTS } from "@/lib/ki-templates";
import { TYPE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function EntryKiTemplatePicker({
  type,
  projectName,
  entryTitle,
  entryMarkdown,
  language,
  pageStart,
  pageEnd,
  author,
  yearStart,
  yearEnd,
  parentEntryType,
  attachments = [],
  parentAttachments = [],
  childEntries = [],
  hasBody = false,
  className,
}: {
  type: EntryType;
  projectName: string;
  entryTitle: string;
  entryMarkdown: string;
  language?: string | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  author?: string | null;
  yearStart?: number | null;
  yearEnd?: number | null;
  parentEntryType?: string | null;
  attachments?: KiAttachmentInput[];
  parentAttachments?: KiAttachmentInput[];
  childEntries?: KiChildEntryInput[];
  hasBody?: boolean;
  className?: string;
}) {
  const templateContext = { parentEntryType };
  const templates = getEntryKiTemplates(type, language, templateContext);
  const [selectedId, setSelectedId] = React.useState(templates[0]?.id ?? "");

  React.useEffect(() => {
    if (!templates.some((template) => template.id === selectedId)) {
      setSelectedId(templates[0]?.id ?? "");
    }
  }, [type, language, selectedId, templates]);

  const selected = templates.find((template) => template.id === selectedId);
  const vars = buildEntryKiVars({
    project: projectName,
    entryTitle,
    entryMarkdown,
    language,
    author,
    yearStart,
    yearEnd,
    pageStart,
    pageEnd,
    attachments,
    parentAttachments,
    childEntries,
  });
  const promptText = selected
    ? renderEntryKiPrompt(type, selected.id, vars, language, templateContext)
    : "";
  const ocrAvailable = hasOcrContent(attachments);
  const parentOcrAvailable = hasOcrContent(parentAttachments);
  const needsOcr = selected?.requiresOcr && !ocrAvailable && !parentOcrAvailable;
  const needsBody = selected?.requiresBody && !hasBody;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="rounded-md border border-border/60 bg-surface-2/50 px-2.5 py-2 text-[0.72rem] leading-relaxed text-muted-foreground">
        {KI_WORKFLOW_HINT}
      </p>

      <div className="space-y-1.5">
        <label
          htmlFor="entry-ki-template"
          className="text-[0.72rem] font-medium text-muted-foreground"
        >
          Vorlage wählen
        </label>
        <select
          id="entry-ki-template"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.82rem]"
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          <p className="text-[0.75rem] text-muted-foreground">
            {selected.description}
          </p>
          {needsOcr && (
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-[0.72rem] text-amber-700 dark:text-amber-300">
              Diese Vorlage benötigt extrahierten PDF-Text — zuerst unter{" "}
              <strong>Material</strong> ein digitales PDF hochladen.
            </p>
          )}
          {needsBody && (
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-[0.72rem] text-amber-700 dark:text-amber-300">
              Diese Vorlage benötigt ausgefüllten Kern (Zusammenfassung oder
              Inhalt).
            </p>
          )}
          {ocrAvailable && !needsOcr && (
            <p className="rounded-md border border-green/20 bg-green/10 px-2.5 py-1.5 text-[0.72rem] text-green">
              Extrahierter PDF-Text wird automatisch eingefügt.
            </p>
          )}
          {!ocrAvailable && !needsOcr && (
            <p className="text-[0.72rem] text-muted-foreground">
              Noch kein PDF-Text — bei Bedarf digitales PDF unter Material
              hochladen.
            </p>
          )}
          <details className="rounded-lg border border-border/60 bg-surface/50">
            <summary className="cursor-pointer px-3 py-2 text-[0.75rem] font-medium text-accent">
              Vorschau anzeigen
            </summary>
            <div className="border-t border-border/50 p-3">
              {getEntryTypeKiTemplate(type, selected.id, language, templateContext) && (
                <KiTemplateFullPreview
                  template={getEntryTypeKiTemplate(type, selected.id, language, templateContext)!}
                />
              )}
            </div>
          </details>
          <div className="flex flex-wrap gap-2">
            <CopyTextButton label="Text kopieren" text={entryMarkdown} />
            <CopyTextButton label="Vorlage kopieren" text={promptText} />
          </div>
        </>
      )}
    </div>
  );
}

export function ProjectKiTemplatePicker({
  projectName,
  className,
}: {
  projectName: string;
  className?: string;
}) {
  const [selectedId, setSelectedId] = React.useState(
    PROJECT_KI_TEMPLATES[0]?.id ?? "",
  );
  const selected = PROJECT_KI_TEMPLATES.find(
    (template) => template.id === selectedId,
  );
  const promptText = selected
    ? renderProjectKiPrompt(selected, {
        PROJECT: projectName,
        ENTRIES:
          "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren; Ordner ocr/ enthält OCR-Volltexte)",
      })
    : "";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1.5">
        <label
          htmlFor="project-ki-template"
          className="text-[0.72rem] font-medium text-muted-foreground"
        >
          Projekt-Vorlage wählen
        </label>
        <select
          id="project-ki-template"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.82rem]"
        >
          {PROJECT_KI_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.category}: {template.title}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          <p className="text-[0.75rem] text-muted-foreground">
            {selected.description}
          </p>
          <p className="rounded-md border border-accent/20 bg-accent-dim/30 px-2.5 py-1.5 text-[0.72rem] text-muted-foreground">
            Zuerst „Projekt als ZIP" exportieren — der Ordner{" "}
            <strong className="text-foreground">ocr/</strong> enthält alle
            OCR-Volltexte für die Vorlage.
          </p>
          <details className="rounded-lg border border-border/60 bg-surface/50">
            <summary className="cursor-pointer px-3 py-2 text-[0.75rem] font-medium text-accent">
              Vorschau anzeigen
            </summary>
            <div className="border-t border-border/50 p-3">
              <KiTemplateFullPreview template={selected.template} />
            </div>
          </details>
          <CopyTextButton label="Vorlage kopieren" text={promptText} />
        </>
      )}
    </div>
  );
}

export function ProjectTypeKiTemplatePicker({
  projectName,
  className,
}: {
  projectName: string;
  className?: string;
}) {
  const [selectedType, setSelectedType] = React.useState<EntryType>("book");
  const templates = getEntryKiTemplates(selectedType);
  const [selectedId, setSelectedId] = React.useState(templates[0]?.id ?? "");

  React.useEffect(() => {
    const next = getEntryKiTemplates(selectedType);
    setSelectedId(next[0]?.id ?? "");
  }, [selectedType]);

  const selected = templates.find((template) => template.id === selectedId);
  const vars = buildEntryKiVars({
    project: projectName,
    entryTitle: `(alle ${TYPE_META[selectedType].label}-Einträge)`,
    entryMarkdown:
      "(Einzel-Einträge aus ZIP-Ordner entries/ hier zusammenfassen oder ZIP gesamt einfügen)",
    entriesPlaceholder:
      "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren; Ordner ocr/ enthält OCR-Volltexte)",
  });
  const promptText = selected
    ? renderEntryKiPrompt(selectedType, selected.id, vars)
    : "";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="project-type-ki-type"
            className="text-[0.72rem] font-medium text-muted-foreground"
          >
            Eintragstyp
          </label>
          <select
            id="project-type-ki-type"
            value={selectedType}
            onChange={(event) =>
              setSelectedType(event.target.value as EntryType)
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.82rem]"
          >
            {(Object.keys(TYPE_META) as EntryType[]).map((type) => (
              <option key={type} value={type}>
                {TYPE_META[type].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="project-type-ki-template"
            className="text-[0.72rem] font-medium text-muted-foreground"
          >
            Vorlage
          </label>
          <select
            id="project-type-ki-template"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.82rem]"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-[0.75rem] text-muted-foreground">
        {ENTRY_TYPE_HINTS[selectedType]}
      </p>

      {selected && (
        <>
          <p className="text-[0.75rem] text-muted-foreground">
            {selected.description}
          </p>
          <details className="rounded-lg border border-border/60 bg-surface/50">
            <summary className="cursor-pointer px-3 py-2 text-[0.75rem] font-medium text-accent">
              Vorschau anzeigen
            </summary>
            <div className="border-t border-border/50 p-3">
              <KiTemplateFullPreview template={selected.template} />
            </div>
          </details>
          <CopyTextButton label="Vorlage kopieren" text={promptText} />
        </>
      )}
    </div>
  );
}

export function ProjectKiTemplateCards({
  projectName,
  selectedId,
  onSelect,
}: {
  projectName: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PROJECT_KI_TEMPLATES.map((template) => (
        <KiTemplateCardFromDefinition
          key={template.id}
          definition={template}
          selected={selectedId === template.id}
          onSelect={() => onSelect(template.id)}
          promptText={renderProjectKiPrompt(template, {
            PROJECT: projectName,
            ENTRIES:
              "(ZIP-Inhalt hier einfügen — zuerst 'Projekt als ZIP' exportieren)",
          })}
        />
      ))}
    </div>
  );
}

export function EntryTypeKiTemplateCards({
  type,
  projectName,
  entryTitle,
  entryMarkdown,
  attachments = [],
  childEntries = [],
  selectedId,
  onSelect,
}: {
  type: EntryType;
  projectName: string;
  entryTitle: string;
  entryMarkdown: string;
  attachments?: KiAttachmentInput[];
  childEntries?: KiChildEntryInput[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const vars = buildEntryKiVars({
    project: projectName,
    entryTitle,
    entryMarkdown,
    attachments,
    childEntries,
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {getEntryKiTemplates(type).map((template) => (
        <EntryTypeTemplateCard
          key={template.id}
          type={type}
          typeLabel={TYPE_META[type].label}
          hint={template.description}
          template={template.template}
          selected={selectedId === template.id}
          onSelect={() => onSelect(template.id)}
          promptText={renderEntryKiPrompt(type, template.id, vars)}
        />
      ))}
    </div>
  );
}
