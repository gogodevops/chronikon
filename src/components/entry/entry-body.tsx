"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { renderMarkdown, type WikiLinkTarget } from "@/lib/markdown";
import type { EntryTitleIndex } from "@/lib/queries";

export function EntryBody({
  body,
  entryIndex,
  projectSlug,
}: {
  body?: string | null;
  entryIndex: EntryTitleIndex[];
  projectSlug: string;
}) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const resolveLink = React.useCallback(
    (label: string): WikiLinkTarget | null => {
      const q = label.toLowerCase();
      const match = entryIndex.find(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          q.includes(e.title.toLowerCase()) ||
          e.id === q,
      );
      return match ? { id: match.id, title: match.title } : null;
    },
    [entryIndex],
  );

  const html = React.useMemo(
    () => renderMarkdown(body, resolveLink),
    [body, resolveLink],
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = (ev: MouseEvent) => {
      const target = (ev.target as HTMLElement).closest("[data-entry-id]");
      if (!target) return;
      ev.preventDefault();
      const entryId = target.getAttribute("data-entry-id");
      if (entryId) {
        router.push(`/p/${projectSlug}?entry=${entryId}`);
      }
    };

    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, [html, projectSlug, router]);

  if (!body) {
    return (
      <p className="my-3 text-[0.82rem] leading-relaxed text-muted-foreground">
        Noch kein Inhalt — Markdown mit [[Verknüpfungen]] möglich.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="prose-block md-rendered serif my-3 rounded-xl border border-border/50 border-l-[3px] border-l-accent bg-surface-2/50 p-4 text-[0.85rem] leading-relaxed text-[#ccc] shadow-sm [&_.wiki-link]:cursor-pointer [&_.wiki-link]:text-accent [&_.wiki-link]:underline [&_.wiki-link-missing]:text-muted-foreground [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_li]:ml-4 [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
