"use client";

import * as React from "react";
import { FileSearch, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChildEntriesSection } from "@/components/entry/child-entries-section";
import { EntryDetailSections } from "@/components/entry/entry-detail-sections";
import { OnlineKiSection } from "@/components/entry/online-ki-section";
import { EntryActionBar, type EntryAction } from "@/components/entry/entry-action-bar";
import type { AttachmentItem, AttachmentUploadStatus } from "@/components/entry/attachments-section";
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
import { getEntryYearMetas } from "@/lib/entry-form-config";

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
  publishedYearStart?: number | null;
  publishedYearEnd?: number | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  parentEntryType?: string | null;
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
  parentAttachments?: Array<{
    name: string;
    label?: string | null;
    mimeType?: string;
    ocrStatus?: string;
    extractedText?: string | null;
  }>;
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
  relationSearchResults?: LinkableEntryResult[];
  relationSearchError?: string | null;
  onRelationSearch?: (query: string) => void;
  className?: string;
  onAction?: (action: EntryAction) => void;
  onNavigateEntry?: (entryId: string, projectSlug?: string) => void;
  onAttachmentUpload?: (file: File) => void;
  onAttachmentDelete?: (attachmentId: string) => void;
  attachmentUploadStatus?: AttachmentUploadStatus;
  onEditBody?: () => void;
  onOpenPointAdd?: (text: string) => void;
  onOpenPointAnswer?: (questionId: string, text: string) => void;
  onOpenPointDelete?: (questionId: string) => void;
  onSourceSubmit?: (data: unknown) => void;
  onSourceDelete?: (sourceId: string) => void;
  onClaimSubmit?: (data: unknown) => void;
  onClaimDelete?: (claimId: string) => void;
  onRelationSubmit?: (
    data: unknown,
  ) => boolean | void | Promise<boolean | void>;
  onRelationDelete?: (
    relationId: string,
    otherEntryTitle?: string,
    typeLabel?: string,
  ) => void;
  canEdit?: boolean;
  canDiscuss?: boolean;
  canCreateEntry?: boolean;
  onNewEntry?: () => void;
  onCreateChildEntry?: () => void;
  projectName?: string;
}

function pageLabel(page?: number | null) {
  if (page == null) return "—";
  return `S. ${page}`;
}

function discoveryPlaceLabel(type: string, place?: string) {
  if (!place) return null;
  return type === "discovery" ? "Fundort" : "Ort";
}

export function DetailPanel({
  entry,
  expanded = false,
  projectSlug = "",
  entryIndex = [],
  relationSearchResults = [],
  relationSearchError = null,
  onRelationSearch,
  className,
  onAction,
  onNavigateEntry,
  onAttachmentUpload,
  onAttachmentDelete,
  attachmentUploadStatus,
  onEditBody,
  onOpenPointAdd,
  onOpenPointAnswer,
  onOpenPointDelete,
  onSourceSubmit,
  onSourceDelete,
  onClaimSubmit,
  onClaimDelete,
  onRelationSubmit,
  onRelationDelete,
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
            Schritt 2 links: Eintrag anklicken — hier erscheinen Kern, Material
            und offene Punkte.
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

  const openQuestionCount = entry.questions?.filter((q) => q.status === "open").length ?? 0;
  const isBookChild = entry.parentEntryType === "book";
  const yearMetas = getEntryYearMetas(
    entry.type,
    entry.yearStart,
    entry.yearEnd,
    entry.publishedYearStart,
    entry.publishedYearEnd,
  );
  const placePillLabel = discoveryPlaceLabel(entry.type, entry.place);

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
            discussionCount={openQuestionCount}
          />
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {isBookChild ? (
              <ChMetaPill
                label="Seiten"
                value={`${pageLabel(entry.pageStart)} – ${pageLabel(entry.pageEnd)}`}
              />
            ) : yearMetas.length > 0 ? (
              yearMetas.map((meta) => (
                <ChMetaPill
                  key={meta.pillLabel}
                  label={meta.pillLabel}
                  value={meta.value}
                />
              ))
            ) : null}
            {entry.author && entry.type === "book" && (
              <ChMetaPill label="Autor" value={entry.author} />
            )}
            {entry.place && placePillLabel && (
              <ChMetaPill label={placePillLabel} value={entry.place} />
            )}
          </div>

          <div key={entry.id} className="contents">
            <EntryDetailSections
              entryId={entry.id}
              entryTitle={entry.title}
              entryType={entry.type}
              parentEntryType={entry.parentEntryType}
              projectSlug={projectSlug}
              summary={entry.summary}
              body={entry.body}
              attachments={entry.attachments ?? []}
              questions={entry.questions ?? []}
              sources={entry.sources}
              claims={entry.claims}
              relations={entry.relations}
              versions={entry.versions}
              entryIndex={entryIndex}
              relationSearchResults={relationSearchResults}
              relationSearchError={relationSearchError}
              onRelationSearch={onRelationSearch}
              onNavigateEntry={onNavigateEntry}
              onEditBody={onEditBody}
              onAttachmentAdd={handleAttachmentAdd}
              onAttachmentDelete={onAttachmentDelete}
              onOpenPointAdd={onOpenPointAdd}
              onOpenPointAnswer={onOpenPointAnswer}
              onOpenPointDelete={onOpenPointDelete}
              onSourceSubmit={onSourceSubmit}
              onSourceDelete={onSourceDelete}
              onClaimSubmit={onClaimSubmit}
              onClaimDelete={onClaimDelete}
              onRelationSubmit={onRelationSubmit}
              onRelationDelete={onRelationDelete}
              canEdit={canEdit}
              canDiscuss={canDiscuss}
              uploadStatus={attachmentUploadStatus}
              afterKern={
                entry.type === "book" || (entry.childEntries?.length ?? 0) > 0 ? (
                  <ChildEntriesSection
                    children={entry.childEntries ?? []}
                    onNavigate={onNavigateEntry}
                    onCreateChild={onCreateChildEntry}
                    canEdit={canEdit}
                  />
                ) : undefined
              }
            />

            {projectName && (
              <div className="mt-4">
                <OnlineKiSection entry={entry} projectName={projectName} />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            id="entry-attachment-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAttachmentUpload?.(file);
              e.target.value = "";
            }}
          />
        </div>
      </ScrollArea>
    </aside>
  );
}
