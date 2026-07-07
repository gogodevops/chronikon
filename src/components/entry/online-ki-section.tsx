"use client";

import type { EntryType } from "@prisma/client";

import { CopyTextButton } from "@/components/ui/copy-text-button";
import { entryToMarkdown } from "@/lib/entry-markdown";
import {
  ENTRY_TYPE_HINTS,
  getEntryTypeKiPrompt,
} from "@/lib/ki-templates";
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

  const kiPrompt = getEntryTypeKiPrompt(type, {
    project: projectName,
    entryTitle: entry.title,
    entryMarkdown,
  });

  return (
    <section className="mb-4 rounded-xl border border-accent/20 bg-accent-dim/20 p-3">
      <h3 className="mb-1 text-[0.72rem] font-semibold uppercase tracking-wide text-accent">
        Für Online-KI
      </h3>
      <p className="mb-2.5 text-[0.78rem] leading-relaxed text-muted-foreground">
        {hint}
      </p>
      <div className="flex flex-wrap gap-2">
        <CopyTextButton label="Text kopieren" text={entryMarkdown} />
        <CopyTextButton label="KI-Vorlage kopieren" text={kiPrompt} />
      </div>
      <p className="mt-2 text-[0.65rem] text-muted-foreground">
        In ChatGPT, Claude o.ä. einfügen — Chronikon hat keine eingebaute KI.
      </p>
    </section>
  );
}
