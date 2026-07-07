"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { EntryBody } from "@/components/entry/entry-body";
import { AttachmentsSection, type AttachmentItem } from "@/components/entry/attachments-section";
import { OpenPointsSection } from "@/components/entry/open-points-section";
import {
  ClaimsList,
  RelationsList,
  SourcesList,
  VersionsList,
} from "@/components/entry/entry-tab-content";
import { SourceComposer } from "@/components/entry/source-composer";
import { ClaimComposer } from "@/components/entry/claim-composer";
import { RelationComposer } from "@/components/entry/relation-composer";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { EntryTitleIndex, LinkableEntryResult } from "@/lib/queries";
import type {
  SerializedClaim,
  SerializedEntryVersion,
  SerializedQuestion,
  SerializedRelation,
  SerializedSource,
} from "@/lib/queries";

export interface EntryDetailSectionsProps {
  entryId: string;
  projectSlug: string;
  summary?: string;
  body?: string;
  attachments?: AttachmentItem[];
  questions?: SerializedQuestion[];
  sources?: SerializedSource[];
  claims?: SerializedClaim[];
  relations?: SerializedRelation[];
  versions?: SerializedEntryVersion[];
  entryIndex?: EntryTitleIndex[];
  relationSearchResults?: LinkableEntryResult[];
  onRelationSearch?: (query: string) => void;
  onNavigateEntry?: (entryId: string, projectSlug?: string) => void;
  onEditBody?: () => void;
  onAttachmentAdd?: () => void;
  onAttachmentDelete?: (attachmentId: string) => void;
  onOpenPointAdd?: (text: string) => void;
  onOpenPointAnswer?: (questionId: string, text: string) => void;
  onOpenPointDelete?: (questionId: string) => void;
  onSourceSubmit?: (data: unknown) => void;
  onSourceDelete?: (sourceId: string) => void;
  onClaimSubmit?: (data: unknown) => void;
  onClaimDelete?: (claimId: string) => void;
  onRelationSubmit?: (data: unknown) => void;
  onRelationDelete?: (relationId: string) => void;
  canEdit?: boolean;
  canDiscuss?: boolean;
  /** Rendered after Kern (e.g. child entries / Unterthemen). */
  afterKern?: React.ReactNode;
}

export function EntryDetailSections({
  entryId,
  projectSlug,
  summary,
  body,
  attachments = [],
  questions = [],
  sources = [],
  claims = [],
  relations = [],
  versions = [],
  entryIndex = [],
  relationSearchResults = [],
  onRelationSearch,
  onNavigateEntry,
  onEditBody,
  onAttachmentAdd,
  onAttachmentDelete,
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
  afterKern,
}: EntryDetailSectionsProps) {
  return (
    <div className="space-y-4">
      <CollapsibleSection title="Kern" defaultOpen>
        {summary && (
          <p className="mb-3 text-[0.82rem] leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}
        <EntryBody
          body={body}
          entryIndex={entryIndex}
          projectSlug={projectSlug}
        />
        <button
          type="button"
          onClick={onEditBody}
          disabled={!canEdit}
          className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[0.75rem] text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil className="h-3 w-3" />
          Inhalt bearbeiten
        </button>
      </CollapsibleSection>

      {afterKern}

      <CollapsibleSection title="Material" count={attachments.length} defaultOpen>
        <AttachmentsSection
          attachments={attachments}
          entryId={entryId}
          onAdd={onAttachmentAdd}
          onDelete={onAttachmentDelete}
          onOpen={(attachment) => {
            if (attachment.url) {
              window.open(attachment.url, "_blank", "noopener,noreferrer");
            }
          }}
          canEdit={canEdit}
          embedded
        />
      </CollapsibleSection>

      <div id="entry-section-offen">
        <OpenPointsSection
          questions={questions}
          onAdd={onOpenPointAdd}
          onAnswer={onOpenPointAnswer}
          onDelete={onOpenPointDelete}
          canDiscuss={canDiscuss}
        />
      </div>

      {(sources.length > 0 ||
        claims.length > 0 ||
        relations.length > 0 ||
        versions.length > 0 ||
        canEdit) && (
        <CollapsibleSection
          title="Weitere Bereiche"
          count={
            sources.length + claims.length + relations.length + versions.length
          }
        >
          <div className="space-y-4 pt-1">
            {(sources.length > 0 || canEdit) && (
              <div>
                <h4 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Quellen ({sources.length})
                </h4>
                <SourcesList
                  sources={sources}
                  onNavigate={onNavigateEntry}
                  onDelete={onSourceDelete}
                  canEdit={canEdit}
                />
                {canEdit && onSourceSubmit && (
                  <SourceComposer
                    entryId={entryId}
                    onSubmit={onSourceSubmit}
                  />
                )}
              </div>
            )}

            {(claims.length > 0 || canEdit) && (
              <div>
                <h4 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Behauptungen ({claims.length})
                </h4>
                <ClaimsList
                  claims={claims}
                  onDelete={onClaimDelete}
                  canEdit={canEdit}
                />
                {canEdit && onClaimSubmit && (
                  <ClaimComposer
                    entryId={entryId}
                    onSubmit={onClaimSubmit}
                  />
                )}
              </div>
            )}

            {(relations.length > 0 || canEdit) && (
              <div>
                <h4 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Verknüpfungen ({relations.length})
                </h4>
                <RelationsList
                  relations={relations}
                  onNavigate={onNavigateEntry}
                  onDelete={onRelationDelete}
                  canEdit={canEdit}
                />
                {canEdit && onRelationSubmit && (
                  <RelationComposer
                    entryId={entryId}
                    searchResults={relationSearchResults}
                    onSearch={onRelationSearch}
                    onSubmit={onRelationSubmit}
                  />
                )}
              </div>
            )}

            {versions.length > 0 && (
              <div>
                <h4 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Historie ({versions.length})
                </h4>
                <VersionsList versions={versions} />
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
