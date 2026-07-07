"use client";

import type { EntryType } from "@prisma/client";

import { CopyTextButton } from "@/components/ui/copy-text-button";
import type { KiTemplate, UnifiedKiTemplate } from "@/lib/ki-templates";
import { renderKiTemplate } from "@/lib/ki-templates";
import { cn } from "@/lib/utils";

function TemplateSectionsPreview({
  template,
  compact = false,
}: {
  template: UnifiedKiTemplate;
  compact?: boolean;
}) {
  const sections = [
    { label: "Ziel", content: template.ziel },
    { label: "Kontext", content: template.kontext },
    {
      label: "Aufgabe",
      content: template.aufgabe.map((step, i) => `${i + 1}. ${step}`).join("\n"),
    },
    { label: "Ausgabeformat", content: template.ausgabeformat },
  ];

  return (
    <dl className="space-y-2">
      {sections.map((section) => (
        <div key={section.label}>
          <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
            {section.label}
          </dt>
          <dd
            className={cn(
              "mt-0.5 whitespace-pre-wrap text-[0.72rem] leading-relaxed text-muted-foreground",
              compact && "line-clamp-3",
            )}
          >
            {section.content}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function KiTemplateCard({
  category,
  title,
  description,
  template,
  promptText,
  selected = false,
  onSelect,
}: {
  category: string;
  title: string;
  description: string;
  template: UnifiedKiTemplate;
  promptText: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border bg-surface-2/60 p-4 transition-colors",
        selected
          ? "border-accent/50 ring-1 ring-accent/20"
          : "border-border/70 hover:border-border",
        onSelect && "cursor-pointer",
      )}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </p>
          <h4 className="text-[0.85rem] font-semibold">{title}</h4>
        </div>
      </div>
      <p className="mb-3 text-[0.75rem] text-muted-foreground">{description}</p>
      <TemplateSectionsPreview template={template} compact />
      <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        <CopyTextButton label="KI-Vorlage kopieren" text={promptText} />
      </div>
    </article>
  );
}

export function KiTemplateCardFromDefinition({
  definition,
  promptText,
  selected,
  onSelect,
}: {
  definition: KiTemplate;
  promptText: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <KiTemplateCard
      category={definition.category}
      title={definition.title}
      description={definition.description}
      template={definition.template}
      promptText={promptText}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

export function EntryTypeTemplateCard({
  type,
  typeLabel,
  hint,
  template,
  promptText,
  selected,
  onSelect,
}: {
  type: EntryType;
  typeLabel: string;
  hint: string;
  template: UnifiedKiTemplate;
  promptText: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <KiTemplateCard
      category="Eintragstyp"
      title={typeLabel}
      description={hint}
      template={template}
      promptText={promptText}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

export function KiTemplateFullPreview({
  template,
}: {
  template: UnifiedKiTemplate;
}) {
  return (
    <pre className="max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-surface p-3 text-[0.72rem] leading-relaxed whitespace-pre-wrap text-muted-foreground">
      {renderKiTemplate(template)}
    </pre>
  );
}
