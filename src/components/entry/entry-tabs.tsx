"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EntryBody } from "@/components/entry/entry-body";
import {
  ClaimsList,
  DiscussionFeed,
  RelationsList,
  SourcesList,
  VersionsList,
} from "@/components/entry/entry-tab-content";
import { SourceComposer } from "@/components/entry/source-composer";
import { ClaimComposer } from "@/components/entry/claim-composer";
import { DiscussionComposer } from "@/components/entry/discussion-composer";
import { RelationComposer } from "@/components/entry/relation-composer";
import type { EntryTitleIndex, LinkableEntryResult } from "@/lib/queries";
import type {
  SerializedClaim,
  SerializedComment,
  SerializedEntryVersion,
  SerializedQuestion,
  SerializedRelation,
  SerializedSource,
} from "@/lib/queries";

export interface EntryTabsProps {
  entryId: string;
  projectSlug: string;
  body?: string;
  sourceCount?: number;
  claimCount?: number;
  discussionCount?: number;
  sources?: SerializedSource[];
  claims?: SerializedClaim[];
  questions?: SerializedQuestion[];
  comments?: SerializedComment[];
  relations?: SerializedRelation[];
  versions?: SerializedEntryVersion[];
  entryIndex?: EntryTitleIndex[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  relationCount?: number;
  relationSearchResults?: LinkableEntryResult[];
  onRelationSearch?: (query: string) => void;
  onNavigateEntry?: (entryId: string, projectSlug?: string) => void;
  onAction?: (tab: string, action: string, data?: unknown) => void;
  canEdit?: boolean;
  canDiscuss?: boolean;
}

export function EntryTabs({
  entryId,
  projectSlug,
  body,
  sourceCount = 0,
  claimCount = 0,
  discussionCount = 0,
  sources = [],
  claims = [],
  questions = [],
  comments = [],
  relations = [],
  versions = [],
  entryIndex = [],
  activeTab = "inhalt",
  onTabChange,
  relationCount,
  relationSearchResults = [],
  onRelationSearch,
  onNavigateEntry,
  onAction,
  canEdit = true,
  canDiscuss = true,
}: EntryTabsProps) {
  const effectiveDiscussionCount =
    discussionCount > 0
      ? discussionCount
      : questions.length + comments.length;
  const effectiveRelationCount = relationCount ?? relations.length;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mt-2">
      <TabsList className="overflow-x-auto">
        <TabsTrigger value="inhalt">Inhalt</TabsTrigger>
        <TabsTrigger value="quellen">Quellen ({sourceCount})</TabsTrigger>
        <TabsTrigger value="behauptungen">
          Behauptungen ({claimCount})
        </TabsTrigger>
        <TabsTrigger value="diskussion">
          Offene Punkte ({effectiveDiscussionCount})
        </TabsTrigger>
        <TabsTrigger value="verknuepfungen">
          Verknüpfungen ({effectiveRelationCount})
        </TabsTrigger>
        <TabsTrigger value="historie">Historie ({versions.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="inhalt">
        <EntryBody
          body={body}
          entryIndex={entryIndex}
          projectSlug={projectSlug}
        />
        <button
          type="button"
          onClick={() => onAction?.("inhalt", "edit")}
          disabled={!canEdit}
          className="cursor-pointer text-[0.75rem] text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✎ Inhalt bearbeiten
        </button>
      </TabsContent>

      <TabsContent value="quellen">
        <SourcesList
          sources={sources}
          onNavigate={onNavigateEntry}
          onDelete={(id) => onAction?.("quellen", "delete", { id })}
          canEdit={canEdit}
        />
        {canEdit && (
          <SourceComposer
            entryId={entryId}
            onSubmit={(data) => onAction?.("quellen", "submit", data)}
          />
        )}
      </TabsContent>

      <TabsContent value="behauptungen">
        <ClaimsList
          claims={claims}
          onDelete={(id) => onAction?.("behauptungen", "delete", { id })}
          canEdit={canEdit}
        />
        {canEdit && (
          <ClaimComposer
            entryId={entryId}
            onSubmit={(data) => onAction?.("behauptungen", "submit", data)}
          />
        )}
      </TabsContent>

      <TabsContent value="diskussion">
        <DiscussionFeed
          questions={questions}
          comments={comments}
          onAnswer={(questionId, text) =>
            onAction?.("diskussion", "answer", { questionId, text })
          }
          onDeleteQuestion={(id) =>
            onAction?.("diskussion", "deleteQuestion", { id })
          }
          onDeleteComment={(id) =>
            onAction?.("diskussion", "deleteComment", { id })
          }
          canDiscuss={canDiscuss}
        />
        {canDiscuss && (
          <DiscussionComposer
            entryId={entryId}
            onSubmit={(data) => onAction?.("diskussion", "submit", data)}
          />
        )}
      </TabsContent>

      <TabsContent value="verknuepfungen">
        <RelationsList
          relations={relations}
          onNavigate={onNavigateEntry}
          onDelete={(id) => onAction?.("verknuepfungen", "delete", { id })}
          canEdit={canEdit}
        />
        {canEdit && (
          <RelationComposer
            entryId={entryId}
            searchResults={relationSearchResults}
            onSearch={onRelationSearch}
            onSubmit={(data) => onAction?.("verknuepfungen", "submit", data)}
          />
        )}
      </TabsContent>

      <TabsContent value="historie">
        <VersionsList versions={versions} />
      </TabsContent>
    </Tabs>
  );
}
