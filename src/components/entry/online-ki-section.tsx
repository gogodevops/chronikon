"use client";

import type { EntryType } from "@prisma/client";

import { EntryKiTemplatePicker } from "@/components/entry/ki-template-picker";
import { entryToMarkdown } from "@/lib/entry-markdown";
import { ENTRY_TYPE_HINTS } from "@/lib/ki-templates";
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

  const childEntries =
    entry.childEntries?.map((child) => ({
      title: child.title,
      typeLabel: child.typeLabel,
      yearStart: child.yearStart,
      yearEnd: child.yearEnd,
    })) ?? [];

  return (
    <section className="mb-4 rounded-xl border border-accent/20 bg-accent-dim/20 p-3">
      <h3 className="mb-1 text-[0.72rem] font-semibold uppercase tracking-wide text-accent">
        Für Online-KI
      </h3>
      <p className="mb-3 text-[0.78rem] leading-relaxed text-muted-foreground">
        {hint}
      </p>
      <EntryKiTemplatePicker
        type={type}
        projectName={projectName}
        entryTitle={entry.title}
        entryMarkdown={entryMarkdown}
        attachments={attachments}
        childEntries={childEntries}
      />
      <p className="mt-3 text-[0.65rem] text-muted-foreground">
        In ChatGPT, Claude o.ä. einfügen — Chronikon hat keine eingebaute KI.
      </p>
    </section>
  );
}
