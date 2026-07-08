"use client";

import * as React from "react";

import { KernSection } from "@/components/entry/kern-section";
import {
  AttachmentsSection,
  type AttachmentItem,
  type AttachmentUploadStatus,
} from "@/components/entry/attachments-section";
import { OpenPointsSection } from "@/components/entry/open-points-section";
import { RelationsSection } from "@/components/entry/relations-section";
import { EntryRelationsMiniGraph } from "@/components/entry/entry-relations-mini-graph";
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
import {
  OPEN_SECTION_KERN,
  OPEN_SECTION_MATERIAL,
  OPEN_SECTION_OFFEN,
  OPEN_SECTION_BEHUAPTUNGEN,
  OPEN_SECTION_QUELLEN,
} from "@/lib/entry-section-events";
import {
  getSectionHints,
  SOURCES_WORKFLOW_HINT,
} from "@/lib/entry-section-hints";

export interface EntryDetailSectionsProps {
  entryId: string;
  entryTitle: string;
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
  onSaveBody?: (body: string) => Promise<void> | void;
  onAttachmentAdd?: () => void;
  onAttachmentDelete?: (attachmentId: string) => void;
  onOpenPointAdd?: (text: string) => void;
  onOpenPointAnswer?: (questionId: string, text: string) => void;
  onOpenPointDelete?: (questionId: string) => void;
  onSourceSubmit?: (data: unknown) => void;
  onSourceDelete?: (sourceId: string) => void;
  onClaimSubmit?: (data: unknown) => void;
  onClaimUpdate?: (claimId: string, data: unknown) => void;
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
  currentUserId?: string;
  afterKern?: React.ReactNode;
  uploadStatus?: AttachmentUploadStatus;
}

export function EntryDetailSections({
  entryId,
  entryTitle,
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
  onSaveBody,
  onAttachmentAdd,
  onAttachmentDelete,
  onOpenPointAdd,
  onOpenPointAnswer,
  onOpenPointDelete,
  onSourceSubmit,
  onSourceDelete,
  onClaimSubmit,
  onClaimUpdate,
  onClaimDelete,
  onRelationSubmit,
  onRelationDelete,
  canEdit = true,
  canDiscuss = true,
  currentUserId,
  afterKern,
  uploadStatus,
}: EntryDetailSectionsProps) {
  const hints = getSectionHints(entryType, parentEntryType);
  const sourceConfig = getSourceSectionConfig(entryType, parentEntryType);
  const showSources = shouldShowSourcesSection(
    entryType,
    sources.length,
    canEdit,
    parentEntryType,
  );
  const showClaims = claims.length > 0 || canEdit;
  const showHistorie = versions.length > 0;

  const [kernOpen, setKernOpen] = React.useState(false);
  const [materialOpen, setMaterialOpen] = React.useState(false);
  const [offenOpen, setOffenOpen] = React.useState(false);
  const [quellenOpen, setQuellenOpen] = React.useState(false);
  const [behauptungenOpen, setBehauptungenOpen] = React.useState(false);
  const [historieOpen, setHistorieOpen] = React.useState(false);
  const [showClaimComposer, setShowClaimComposer] = React.useState(false);
  const [showSourceComposer, setShowSourceComposer] = React.useState(false);

  React.useEffect(() => {
    const openKern = () => setKernOpen(true);
    const openOffen = () => setOffenOpen(true);
    const openMaterial = () => setMaterialOpen(true);
    const openClaim = () => {
      setBehauptungenOpen(true);
      setShowClaimComposer(true);
    };
    const openSource = () => {
      setQuellenOpen(true);
      setShowSourceComposer(true);
    };

    window.addEventListener(OPEN_SECTION_KERN, openKern);
    window.addEventListener(OPEN_SECTION_OFFEN, openOffen);
    window.addEventListener(OPEN_SECTION_MATERIAL, openMaterial);
    window.addEventListener(OPEN_SECTION_BEHUAPTUNGEN, openClaim);
    window.addEventListener(OPEN_SECTION_QUELLEN, openSource);

    return () => {
      window.removeEventListener(OPEN_SECTION_KERN, openKern);
      window.removeEventListener(OPEN_SECTION_OFFEN, openOffen);
      window.removeEventListener(OPEN_SECTION_MATERIAL, openMaterial);
      window.removeEventListener(OPEN_SECTION_BEHUAPTUNGEN, openClaim);
      window.removeEventListener(OPEN_SECTION_QUELLEN, openSource);
    };
  }, []);

  return (
    <div className="space-y-4">
      <KernSection
        body={body}
        summary={summary}
        hint={hints.kern}
        entryIndex={entryIndex}
        projectSlug={projectSlug}
        canEdit={canEdit}
        open={kernOpen}
        onOpenChange={setKernOpen}
        onSaveBody={onSaveBody}
      />

      {afterKern}

      <CollapsibleSection
        title="Material"
        count={attachments.length}
        hint={hints.material}
        open={materialOpen}
        onOpenChange={setMaterialOpen}
      >
        <div id="entry-section-material">
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
        </div>
      </CollapsibleSection>

      <div id="entry-section-offen">
        <OpenPointsSection
          questions={questions}
          onAdd={onOpenPointAdd}
          onAnswer={onOpenPointAnswer}
          onDelete={onOpenPointDelete}
          canDiscuss={canDiscuss}
          hint={hints.offen}
          open={offenOpen}
          onOpenChange={setOffenOpen}
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
          hint={hints.relations}
        />
      )}

      {(relations.length > 0 || canEdit) && (
        <div className="space-y-2">
          <h4 className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Verknüpfungs-Überblick
          </h4>
          <EntryRelationsMiniGraph
            entryId={entryId}
            entryTitle={entryTitle}
            entryType={entryType}
            relations={relations}
            onSelect={(id) => onNavigateEntry?.(id)}
          />
        </div>
      )}

      {showSources && (
        <CollapsibleSection
          title={sourceConfig.sectionTitle}
          count={sources.length}
          hint={
            hints.sourcesExtra
              ? `${hints.quellen ?? ""} ${hints.sourcesExtra}`.trim()
              : hints.quellen
          }
          open={quellenOpen}
          onOpenChange={setQuellenOpen}
        >
          <div id="entry-section-quellen">
            {entryType === "book" && (
              <p className="mb-3 rounded-md border border-border/50 bg-surface/50 px-2.5 py-2 text-[0.72rem] leading-relaxed text-muted-foreground">
                {SOURCES_WORKFLOW_HINT}
              </p>
            )}
            <SourcesList
              sources={sources}
              emptyHint={sourceConfig.emptyHint}
              onNavigate={onNavigateEntry}
              onDelete={onSourceDelete}
              canEdit={canEdit}
            />
            {canEdit && onSourceSubmit && showSourceComposer && (
                <SourceComposer
                  entryId={entryId}
                  titlePlaceholder={sourceConfig.titlePlaceholder}
                  autoFocus
                  onSubmit={(data) => {
                  onSourceSubmit(data);
                  setShowSourceComposer(false);
                }}
              />
            )}
            {canEdit && onSourceSubmit && !showSourceComposer && (
              <button
                type="button"
                onClick={() => setShowSourceComposer(true)}
                className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[0.78rem] text-accent hover:underline"
              >
                Quelle hinzufügen
              </button>
            )}
          </div>
        </CollapsibleSection>
      )}

      {showClaims && (
        <CollapsibleSection
          title="Behauptungen"
          count={claims.length}
          hint={hints.behauptungen}
          open={behauptungenOpen}
          onOpenChange={setBehauptungenOpen}
        >
          <div id="entry-section-behauptungen">
            <ClaimsList
              claims={claims}
              currentUserId={currentUserId}
              onDelete={onClaimDelete}
              onUpdate={
                onClaimUpdate
                  ? (claimId, data) => onClaimUpdate(claimId, data)
                  : undefined
              }
              canEdit={canEdit}
            />
            {canEdit && onClaimSubmit && showClaimComposer && (
                <ClaimComposer
                  entryId={entryId}
                  autoFocus
                  onSubmit={(data) => {
                  onClaimSubmit(data);
                  setShowClaimComposer(false);
                }}
              />
            )}
            {canEdit && onClaimSubmit && !showClaimComposer && (
              <button
                type="button"
                onClick={() => setShowClaimComposer(true)}
                className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[0.78rem] text-accent hover:underline"
              >
                Behauptung hinzufügen
              </button>
            )}
          </div>
        </CollapsibleSection>
      )}

      {showHistorie && (
        <CollapsibleSection
          title="Historie"
          count={versions.length}
          open={historieOpen}
          onOpenChange={setHistorieOpen}
        >
          <VersionsList versions={versions} />
        </CollapsibleSection>
      )}
    </div>
  );
}
