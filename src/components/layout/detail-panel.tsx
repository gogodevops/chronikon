"use client";

import * as React from "react";
import { FileSearch, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildEntriesSection } from "@/components/entry/child-entries-section";
import { OnlineKiSection } from "@/components/entry/online-ki-section";
import { EntryActionBar, type EntryAction } from "@/components/entry/entry-action-bar";
import { AttachmentsSection, type AttachmentItem } from "@/components/entry/attachments-section";
import { EntryTabs } from "@/components/entry/entry-tabs";
import { ChMetaPill } from "@/components/ui/chronikon-shell";
import type { EntryTitleIndex, LinkableEntryResult, SerializedChildEntry } from "@/lib/queries";
import type {
  SerializedClaim,
  SerializedComment,
  SerializedEntryVersion,
  SerializedQuestion,
  SerializedRelation,
  SerializedSource,
} from "@/lib/queries";

export interface EntryDetail {
  id: string;
  title: string;
  summary?: string;
  type: string;
  typeLabel: string;
  typeColor: string;
  topics?: string[];
  yearStart?: number | null;
  yearEnd?: number | null;
  confidence?: string;
  confidenceLabel?: string;
  confidenceColor?: string;
  language?: string;
  author?: string;
  place?: string;
  body?: string;
  attachments?: AttachmentItem[];
  sourceCount?: number;
  claimCount?: number;
  discussionCount?: number;
  questionCount?: number;
  commentCount?: number;
  parentEntryId?: string | null;
  parentEntryTitle?: string | null;
  childEntries?: SerializedChildEntry[];
  sources?: SerializedSource[];
  claims?: SerializedClaim[];
  questions?: SerializedQuestion[];
  comments?: SerializedComment[];
  relations?: SerializedRelation[];
  versions?: SerializedEntryVersion[];
}

export interface DetailPanelProps {
  entry?: EntryDetail | null;
  expanded?: boolean;
  projectSlug?: string;
  entryIndex?: EntryTitleIndex[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  relationSearchResults?: LinkableEntryResult[];
  onRelationSearch?: (query: string) => void;
  className?: string;
  onAction?: (action: EntryAction) => void;
  onTabAction?: (tab: string, action: string, data?: unknown) => void;
  onNavigateEntry?: (entryId: string, projectSlug?: string) => void;
  onAttachmentUpload?: (file: File) => void;
  onAttachmentDelete?: (attachmentId: string) => void;
  canEdit?: boolean;
  canDiscuss?: boolean;
  canCreateEntry?: boolean;
  onNewEntry?: () => void;
  onCreateChildEntry?: () => void;
  projectName?: string;
}

function yearLabel(year?: number | null) {
  if (year == null) return "—";
  if (year < 0) return `${Math.abs(year)} v.Chr.`;
  return `${year} n.Chr.`;
}

export function DetailPanel({
  entry,
  expanded = false,
  projectSlug = "",
  entryIndex = [],
  activeTab = "inhalt",
  onTabChange,
  relationSearchResults = [],
  onRelationSearch,
  className,
  onAction,
  onTabAction,
  onNavigateEntry,
  onAttachmentUpload,
  onAttachmentDelete,
  canEdit = true,
  canDiscuss = true,
  canCreateEntry = false,
  onNewEntry,
  onCreateChildEntry,
  projectName = "",
}: DetailPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const panelClass = cn(
    "flex flex-col border-l border-border/80 bg-surface min-h-0",
    expanded ? "min-w-0 flex-1" : "w-[var(--detail-w)] shrink-0",
    className,
  );

  if (!entry) {
    return (
      <aside className={panelClass}>
        <header className="shrink-0 border-b border-border/80 bg-surface-2/30 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-dim text-[0.65rem] font-bold text-accent">
              3
            </span>
            <span className="text-[0.8rem] font-semibold text-foreground">
              Detailansicht
            </span>
          </div>
          <p className="mt-1 pl-7 text-[0.68rem] text-muted-foreground">
            Wähle links einen Eintrag aus der Liste.
          </p>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <FileSearch
            className="mb-3 h-10 w-10 text-muted-foreground/40"
            strokeWidth={1.25}
          />
          <p className="text-sm font-medium text-foreground">Noch kein Eintrag gewählt</p>
          <p className="mt-1 max-w-[240px] text-[0.78rem] text-muted-foreground">
            Schritt 2 links: Eintrag anklicken — hier erscheinen Inhalt, Quellen
            und Diskussion.
          </p>
          {canCreateEntry && onNewEntry && (
            <Button
              size="sm"
              className="mt-4 gap-1.5"
              onClick={onNewEntry}
            >
              <Plus className="h-3.5 w-3.5" />
              Neuer Eintrag
            </Button>
          )}
        </div>
      </aside>
    );
  }

  const handleAttachmentAdd = () => {
    if (onAttachmentUpload) {
      fileInputRef.current?.click();
    } else {
      onAction?.("attachment");
    }
  };

  return (
    <aside className={panelClass}>
      <header className="shrink-0 border-b border-border/80 bg-surface-2/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-dim text-[0.65rem] font-bold text-accent">
            3
          </span>
          <span className="text-[0.8rem] font-semibold text-foreground">
            Detailansicht
          </span>
        </div>
        <p className="mt-0.5 truncate pl-7 text-[0.68rem] text-muted-foreground">
          {entry.title}
        </p>
      </header>
      <ScrollArea className="flex-1">
        <div className="border-b border-border/80 bg-surface-2/30 px-5 py-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              className="border-0 font-medium"
              style={{
                background: `${entry.typeColor}18`,
                color: entry.typeColor,
              }}
            >
              {entry.typeLabel}
            </Badge>
            {entry.confidenceLabel && (
              <Badge
                variant="outline"
                className="border-0 font-medium"
                style={{
                  background: `${entry.confidenceColor ?? "#7a756a"}14`,
                  color: entry.confidenceColor ?? "#7a756a",
                }}
              >
                {entry.confidenceLabel}
              </Badge>
            )}
          </div>

          <h2 className="text-[1.1rem] font-semibold leading-snug tracking-tight">
            {entry.title}
          </h2>

          {entry.parentEntryId && entry.parentEntryTitle && (
            <p className="mt-1 text-[0.72rem] text-muted-foreground">
              Untereintrag von{" "}
              <button
                type="button"
                onClick={() => onNavigateEntry?.(entry.parentEntryId!)}
                className="cursor-pointer text-accent hover:underline"
              >
                {entry.parentEntryTitle}
              </button>
            </p>
          )}

          {entry.summary && (
            <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
              {entry.summary}
            </p>
          )}

          {entry.topics && entry.topics.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {entry.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-surface-3/80 px-2 py-0.5 text-[0.68rem] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <EntryActionBar
            onAction={onAction}
            canEdit={canEdit}
            canDiscuss={canDiscuss}
            discussionCount={
              entry.discussionCount ??
              (entry.questionCount ?? entry.questions?.length ?? 0) +
                (entry.commentCount ?? entry.comments?.length ?? 0)
            }
          />

        </div>

        <div className="px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <ChMetaPill
              label="Zeitraum"
              value={`${yearLabel(entry.yearStart)} – ${yearLabel(entry.yearEnd)}`}
            />
            {entry.language && (
              <ChMetaPill label="Sprache" value={entry.language} />
            )}
            {entry.author && <ChMetaPill label="Autor" value={entry.author} />}
            {entry.place && <ChMetaPill label="Ort" value={entry.place} />}
          </div>

          {projectName && (
            <OnlineKiSection entry={entry} projectName={projectName} />
          )}

          {entry.type === "book" && (
            <ChildEntriesSection
              children={entry.childEntries ?? []}
              onNavigate={onNavigateEntry}
              onCreateChild={onCreateChildEntry}
              canEdit={canEdit}
            />
          )}

          <AttachmentsSection
            attachments={entry.attachments ?? []}
            entryId={entry.id}
            onAdd={handleAttachmentAdd}
            onDelete={onAttachmentDelete}
            canEdit={canEdit}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAttachmentUpload?.(file);
              e.target.value = "";
            }}
          />

          <EntryTabs
            entryId={entry.id}
            projectSlug={projectSlug}
            body={entry.body}
            sourceCount={entry.sourceCount ?? 0}
            claimCount={entry.claimCount ?? 0}
            discussionCount={
              entry.discussionCount ??
              (entry.questionCount ?? entry.questions?.length ?? 0) +
                (entry.commentCount ?? entry.comments?.length ?? 0)
            }
            sources={entry.sources}
            claims={entry.claims}
            questions={entry.questions}
            comments={entry.comments}
            relations={entry.relations}
            relationCount={entry.relations?.length ?? 0}
            versions={entry.versions}
            entryIndex={entryIndex}
            activeTab={activeTab}
            onTabChange={onTabChange}
            relationSearchResults={relationSearchResults}
            onRelationSearch={onRelationSearch}
            onNavigateEntry={onNavigateEntry}
            onAction={onTabAction}
            canEdit={canEdit}
            canDiscuss={canDiscuss}
          />
        </div>
      </ScrollArea>
    </aside>
  );
}
