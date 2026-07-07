"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { EntryBody } from "@/components/entry/entry-body";
import { AttachmentsSection, type AttachmentItem, type AttachmentUploadStatus } from "@/components/entry/attachments-section";
import { OpenPointsSection } from "@/components/entry/open-points-section";
import { RelationsSection } from "@/components/entry/relations-section";
import {
  ClaimsList,
  SourcesList,
  VersionsList,
} from "@/components/entry/entry-tab-content";
import { SourceComposer } from "@/components/entry/source-composer";
import { ClaimComposer } from "@/components/entry/claim-composer";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { EntryTitleIndex, LinkableEntryResult } from "@/lib/queries";
import type {
  SerializedClaim,
  SerializedEntryVersion,
  SerializedQuestion,
  SerializedRelation,
  SerializedSource,
} from "@/lib/queries";
import {
  getSourceSectionConfig,
  shouldShowSourcesSection,
} from "@/lib/entry-hierarchy";

export interface EntryDetailSectionsProps {
  entryId: string;
  entryType: string;
  parentEntryType?: string | null;
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
  relationSearchError?: string | null;
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
  /** Rendered after Kern (e.g. child entries / Unterthemen). */
  afterKern?: React.ReactNode;
  uploadStatus?: AttachmentUploadStatus;
}

export function EntryDetailSections({
  entryId,
  entryType,
  parentEntryType,
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
  relationSearchError = null,
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
  uploadStatus,
}: EntryDetailSectionsProps) {
  const sourceConfig = getSourceSectionConfig(entryType, parentEntryType);
  const showSources = shouldShowSourcesSection(
    entryType,
    sources.length,
    canEdit,
    parentEntryType,
  );
  const showWeitere =
    showSources ||
    claims.length > 0 ||
    versions.length > 0 ||
    (canEdit && claims.length === 0);

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Kern">
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

      <CollapsibleSection title="Material" count={attachments.length}>
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
          uploadStatus={uploadStatus}
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

      {(relations.length > 0 || canEdit) && (
        <RelationsSection
          entryId={entryId}
          relations={relations}
          relationSearchResults={relationSearchResults}
          relationSearchError={relationSearchError}
          onRelationSearch={onRelationSearch}
          onNavigateEntry={onNavigateEntry}
          onRelationSubmit={onRelationSubmit}
          onRelationDelete={onRelationDelete}
          canEdit={canEdit}
        />
      )}

      {showWeitere && (
        <CollapsibleSection
          title="Weitere Bereiche"
          count={
            (showSources ? sources.length : 0) +
            claims.length +
            versions.length
          }
        >
          <div id="entry-section-weitere" className="space-y-4 pt-1">
            {showSources && (
              <div>
                <h4 className="mb-1 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {sourceConfig.sectionTitle} ({sources.length})
                </h4>
                <p className="mb-2 text-[0.72rem] leading-relaxed text-muted-foreground">
                  {sourceConfig.meaning}
                </p>
                <SourcesList
                  sources={sources}
                  emptyHint={sourceConfig.emptyHint}
                  onNavigate={onNavigateEntry}
                  onDelete={onSourceDelete}
                  canEdit={canEdit}
                />
                {canEdit && onSourceSubmit && (
                  <SourceComposer
                    entryId={entryId}
                    titlePlaceholder={sourceConfig.titlePlaceholder}
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
