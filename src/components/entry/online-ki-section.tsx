"use client";

import type { EntryType } from "@prisma/client";

import { EntryKiTemplatePicker } from "@/components/entry/ki-template-picker";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { entryToMarkdown } from "@/lib/entry-markdown";
import { ENTRY_TYPE_HINTS, hasEntryContent } from "@/lib/ki-templates";
import type { EntryDetail } from "@/components/layout/detail-panel";

export function OnlineKiSection({
  entry,
  projectName,
}: {
  entry: EntryDetail;
  projectName: string;
}) {
  const type = entry.type as EntryType;
  const hint = ENTRY_TYPE_HINTS[type];

  const entryMarkdown = entryToMarkdown(
    {
      title: entry.title,
      type: entry.type,
      summary: entry.summary,
      body: entry.body,
      yearStart: entry.yearStart,
      yearEnd: entry.yearEnd,
      pageStart: entry.pageStart,
      pageEnd: entry.pageEnd,
      confidence: entry.confidence,
      language: entry.language,
      author: entry.author,
      placeName: entry.place,
      topics: entry.topics,
      parentEntryTitle: entry.parentEntryTitle,
      sources: entry.sources?.map((s) => ({ title: s.title, ref: s.ref })),
    },
    projectName,
  );

  const attachments =
    entry.attachments?.map((attachment) => ({
      name: attachment.filename,
      label: attachment.label,
      mimeType: attachment.mimeType,
      ocrStatus: attachment.ocrStatus,
      extractedText: attachment.extractedText,
    })) ?? [];

  const parentAttachments =
    entry.parentAttachments?.map((attachment) => ({
      name: attachment.name,
      label: attachment.label,
      mimeType: attachment.mimeType,
      ocrStatus: attachment.ocrStatus,
      extractedText: attachment.extractedText,
    })) ?? [];

  const childEntries =
    entry.childEntries?.map((child) => ({
      title: child.title,
      typeLabel: child.typeLabel,
      yearStart: child.yearStart,
      yearEnd: child.yearEnd,
      pageStart: child.pageStart,
      pageEnd: child.pageEnd,
    })) ?? [];

  const hasBody = hasEntryContent({
    body: entry.body,
    summary: entry.summary,
  });

  return (
    <CollapsibleSection
      title="Für externe KI"
      defaultOpen={false}
      className="mb-4"
    >
      <p
        className="mb-2 text-[0.68rem] leading-snug text-muted-foreground"
        title={hint}
      >
        {hint}
      </p>
      <EntryKiTemplatePicker
        type={type}
        projectName={projectName}
        entryTitle={entry.title}
        entryMarkdown={entryMarkdown}
        language={entry.language}
        author={entry.author}
        yearStart={entry.yearStart}
        yearEnd={entry.yearEnd}
        pageStart={entry.pageStart}
        pageEnd={entry.pageEnd}
        parentEntryType={entry.parentEntryType}
        attachments={attachments}
        parentAttachments={parentAttachments}
        childEntries={childEntries}
        hasBody={hasBody}
      />
      <p className="mt-2 text-[0.62rem] text-muted-foreground">
        In ChatGPT, Claude o.ä. einfügen — Chronikon hat keine eingebaute KI.
      </p>
    </CollapsibleSection>
  );
}
