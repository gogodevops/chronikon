"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  OPEN_RELATIONS_EVENT,
  RELATIONS_SECTION_ID,
} from "@/components/entry/relations-section";
import {
  addAttachmentMetadata,
  addClaim,
  addRelation,
  addSource,
  searchLinkableEntries,
  deleteAttachment,
  deleteClaim,
  deleteEntry,
  deleteRelation,
  deleteSource,
  updateEntry,
} from "@/actions/entries";
import {
  addQuestion,
  answerQuestion,
  deleteQuestion,
} from "@/actions/discussions";
import type { RelationType } from "@prisma/client";
import type { Confidence } from "@prisma/client";
import { canDeleteProject, canDiscuss, canEditProject, runServerAction } from "@/lib/action-feedback";
import { CommandPalette, type CommandResult } from "@/components/command-palette";
import {
  AppHeader,
  type AppView,
  type ProjectOption,
} from "@/components/layout/app-header";
import { DetailPanel, type EntryDetail } from "@/components/layout/detail-panel";
import type { AttachmentUploadStatus } from "@/components/entry/attachments-section";
import { NavPanel, type EntryListItem } from "@/components/layout/nav-panel";
import type { EntryAction } from "@/components/entry/entry-action-bar";
import { useProject } from "@/context/project-context";
import { CONF_META, LIST_LIMIT, TYPE_META } from "@/lib/constants";
import type {
  EntryTitleIndex,
  LinkableEntryResult,
  SerializedEntryDetail,
  SerializedEntryListItem,
} from "@/lib/queries";
import { uploadAttachmentFile } from "@/lib/upload-api";

export type AppShellProps = {
  project: ProjectOption;
  entries: SerializedEntryListItem[];
  totalCount: number;
  selectedEntryId?: string | null;
  selectedEntry?: SerializedEntryDetail | null;
  entryIndex?: EntryTitleIndex[];
  viewMode: AppView;
  recentActivityEntryIds?: string[];
  children?: React.ReactNode;
};

const VIEW_ROUTES: Record<AppView, string> = {
  browse: "",
  dashboard: "/dashboard",
  timeline: "/timeline",
  map: "/map",
  table: "/table",
  graph: "/graph",
  discussions: "/discussions",
  notifications: "/notifications",
  team: "/team",
  form: "/new",
  export: "/export",
  compare: "/compare",
};

function toListItem(e: SerializedEntryListItem): EntryListItem {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    typeColor: e.typeColor,
    typeLabel: e.typeLabel,
    topic: e.topic,
    parentEntryId: e.parentEntryId,
    parentEntryTitle: e.parentEntryTitle,
  };
}

function toDetail(e: SerializedEntryDetail): EntryDetail {
  return {
    id: e.id,
    title: e.title,
    summary: e.summary ?? undefined,
    type: e.type,
    typeLabel: e.typeLabel,
    typeColor: e.typeColor,
    topics: e.topics,
    yearStart: e.yearStart,
    yearEnd: e.yearEnd,
    pageStart: e.pageStart,
    pageEnd: e.pageEnd,
    confidence: e.confidence,
    confidenceLabel: e.confidenceLabel,
    confidenceColor: e.confidenceColor,
    language: e.language ?? undefined,
    author: e.author ?? undefined,
    place: e.placeName ?? undefined,
    body: e.body ?? undefined,
    attachments: e.attachments.map((a) => ({
      id: a.id,
      filename: a.name,
      mimeType: a.mimeType,
      url: a.publicUrl ?? undefined,
      label: a.label,
      ocrStatus: a.ocrStatus,
      extractedText: a.extractedText,
    })),
    sourceCount: e.sourceCount,
    claimCount: e.claimCount,
    discussionCount: e.questionCount + e.commentCount,
    questionCount: e.questionCount,
    commentCount: e.commentCount,
    parentEntryId: e.parentEntryId,
    parentEntryTitle: e.parentEntryTitle,
    parentEntryType: e.parentEntryType,
    parentAttachments: e.parentAttachments.map((a) => ({
      name: a.name,
      label: a.label,
      mimeType: a.mimeType,
      ocrStatus: a.ocrStatus,
      extractedText: a.extractedText,
    })),
    childEntries: e.childEntries,
    sources: e.sources,
    claims: e.claims,
    questions: e.questions,
    comments: e.comments,
    relations: e.relations,
    versions: e.versions,
  };
}

export function AppShell({
  project,
  entries,
  totalCount,
  selectedEntryId,
  selectedEntry,
  entryIndex = [],
  viewMode,
  recentActivityEntryIds = [],
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ctx = useProject();
  const canEdit = canEditProject(ctx.userRole);
  const canDiscussRole = canDiscuss(ctx.userRole);

  const refreshAfterAction = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [listLimit, setListLimit] = React.useState(LIST_LIMIT);
  const [attachmentUploadStatus, setAttachmentUploadStatus] =
    React.useState<AttachmentUploadStatus>({ state: "idle" });
  const uploadStatusTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [searchResults, setSearchResults] = React.useState<CommandResult[]>([]);
  const [relationSearchResults, setRelationSearchResults] = React.useState<
    LinkableEntryResult[]
  >([]);
  const [relationSearchError, setRelationSearchError] = React.useState<
    string | null
  >(null);
  const relationSearchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const relationSearchRequest = React.useRef(0);

  const basePath = `/p/${ctx.slug}`;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const projects: ProjectOption[] = ctx.projects.map((p) => ({
    id: p.slug,
    name: p.name,
    icon: p.icon,
  }));

  const topics = ctx.topics.map((t) => ({
    id: t.name,
    label: t.name,
  }));

  const types = Object.entries(TYPE_META).map(([id, meta]) => ({
    id,
    label: meta.label,
    color: meta.color,
  }));

  const confidenceLevels = Object.entries(CONF_META).map(([id, meta]) => ({
    id,
    label: meta.label,
    color: meta.color,
  }));

  const activeTopics = new Set(
    searchParams.getAll("topic").length
      ? searchParams.getAll("topic")
      : searchParams.get("topic")
        ? [searchParams.get("topic")!]
        : [],
  );
  const activeTypes = new Set(
    searchParams.getAll("type").length
      ? searchParams.getAll("type")
      : searchParams.get("type")
        ? [searchParams.get("type")!]
        : [],
  );
  const activeConfidence = new Set(
    searchParams.getAll("confidence").length
      ? searchParams.getAll("confidence")
      : searchParams.get("confidence")
        ? [searchParams.get("confidence")!]
        : [],
  );

  const searchQuery = searchParams.get("q") ?? "";
  const activeSavedView = searchParams.get("savedView");

  const updateParams = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const handleViewChange = (view: AppView) => {
    if (view === "team" && !ctx.isAppAdmin) return;
    const suffix = VIEW_ROUTES[view];
    router.push(`${basePath}${suffix}`);
  };

  const handleProjectChange = (slug: string) => {
    router.push(`/p/${slug}/dashboard`);
  };

  const handleEntrySelect = (id: string) => {
    updateParams((params) => {
      params.set("entry", id);
    });
  };

  const handleNavigateEntry = (entryId: string, projectSlug?: string) => {
    if (projectSlug && projectSlug !== ctx.slug) {
      router.push(`/p/${projectSlug}?entry=${entryId}`);
      return;
    }
    handleEntrySelect(entryId);
  };

  const handleSearchChange = (q: string) => {
    updateParams((params) => {
      if (q) params.set("q", q);
      else params.delete("q");
    });
  };

  const toggleSetParam = (
    key: string,
    value: string,
    active: Set<string>,
  ) => {
    updateParams((params) => {
      params.delete(key);
      const next = new Set(active);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      next.forEach((v) => params.append(key, v));
    });
  };

  const handleClearFilters = () => {
    updateParams((params) => {
      params.delete("q");
      params.delete("topic");
      params.delete("type");
      params.delete("confidence");
      params.delete("savedView");
    });
  };

  const handlePaletteSearch = React.useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const res = await fetch(
        `/api/search?projectId=${ctx.id}&q=${encodeURIComponent(query)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as CommandResult[];
        setSearchResults(data);
      }
    },
    [ctx.id],
  );

  const handlePaletteSelect = (result: CommandResult) => {
    setPaletteOpen(false);
    if (result.type === "action") {
      if (result.id === "new-entry") router.push(`${basePath}/new`);
      if (result.id === "discussions") router.push(`${basePath}/discussions`);
      return;
    }
    if (result.type === "question" && result.entryId) {
      router.push(`${basePath}?entry=${result.entryId}`);
      return;
    }
    router.push(`${basePath}?entry=${result.id}`);
  };

  const selectedEntryIdForSearch = selectedEntry?.id ?? null;

  React.useEffect(() => {
    relationSearchRequest.current += 1;
    setRelationSearchResults([]);
    setRelationSearchError(null);
  }, [selectedEntryIdForSearch]);

  const handleRelationSearch = React.useCallback(
    (query: string) => {
      if (relationSearchTimer.current) {
        clearTimeout(relationSearchTimer.current);
      }
      if (!selectedEntryIdForSearch) {
        setRelationSearchResults([]);
        setRelationSearchError(null);
        return;
      }
      const requestId = ++relationSearchRequest.current;
      relationSearchTimer.current = setTimeout(async () => {
        const result = await searchLinkableEntries(
          ctx.id,
          query.trim(),
          selectedEntryIdForSearch,
        );
        if (requestId !== relationSearchRequest.current) return;
        if (result.success) {
          setRelationSearchResults(result.data);
          setRelationSearchError(null);
        } else {
          setRelationSearchResults([]);
          setRelationSearchError(result.error ?? "Suche fehlgeschlagen");
        }
      }, 200);
    },
    [ctx.id, selectedEntryIdForSearch],
  );

  const handleEntryAction = async (action: EntryAction) => {
    if (!selectedEntry) return;

    switch (action) {
      case "discussion":
        scrollToSection("entry-section-offen");
        break;
      case "claim":
      case "source":
        scrollToSection("entry-section-weitere");
        break;
      case "relation":
        window.dispatchEvent(new Event(OPEN_RELATIONS_EVENT));
        scrollToSection(RELATIONS_SECTION_ID);
        break;
      case "attachment":
        document.getElementById("entry-attachment-input")?.click();
        break;
      case "edit":
        router.push(`${basePath}/new?edit=${selectedEntry.id}`);
        break;
      case "delete":
        if (
          window.confirm(
            `Eintrag „${selectedEntry.title}" wirklich löschen?\n\nAlle zugehörigen Quellen, Behauptungen, Verknüpfungen, Diskussionen, Versionen, Anhänge (inkl. Dateien) und Untereinträge werden dabei entfernt.`,
          )
        ) {
          const ok = await runServerAction(
            () => deleteEntry(ctx.id, selectedEntry.id),
            () => {
              updateParams((params) => {
                params.delete("entry");
              });
            },
          );
          if (ok) refreshAfterAction();
        }
        break;
    }
  };

  const handleAttachmentUpload = async (file: File) => {
    if (!selectedEntry || !canEdit) return;

    if (uploadStatusTimer.current) {
      clearTimeout(uploadStatusTimer.current);
      uploadStatusTimer.current = null;
    }

    setAttachmentUploadStatus({ state: "uploading", filename: file.name });

    try {
      const data = await uploadAttachmentFile(file);

      const result = await addAttachmentMetadata({
        projectId: ctx.id,
        entryId: selectedEntry.id,
        name: data.name,
        mimeType: data.mimeType,
        storageKey: data.storageKey,
        publicUrl: data.url,
        label: "Später hinzugefügt",
        extractedText: data.text,
      });

      if (!result.success) {
        setAttachmentUploadStatus({
          state: "error",
          filename: file.name,
          message: result.error ?? "Metadaten konnten nicht gespeichert werden",
        });
        return;
      }

      setAttachmentUploadStatus({ state: "success", filename: file.name });
      uploadStatusTimer.current = setTimeout(() => {
        setAttachmentUploadStatus({ state: "idle" });
      }, 5000);

      refreshAfterAction();
    } catch (error) {
      setAttachmentUploadStatus({
        state: "error",
        filename: file.name,
        message:
          error instanceof Error ? error.message : "Upload fehlgeschlagen",
      });
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    if (!canEdit) return;
    if (!window.confirm("Anhang wirklich löschen?")) return;
    const ok = await runServerAction(() =>
      deleteAttachment(ctx.id, attachmentId),
    );
    if (ok) refreshAfterAction();
  };

  const handleEditBody = () => {
    if (!selectedEntry || !canEdit) return;
    router.push(`${basePath}/new?edit=${selectedEntry.id}`);
  };

  const handleOpenPointAdd = async (text: string) => {
    if (!selectedEntry || !canDiscussRole) return;
    const ok = await runServerAction(() =>
      addQuestion({
        projectId: ctx.id,
        entryId: selectedEntry.id,
        category: "Allgemein",
        text,
      }),
    );
    if (ok) refreshAfterAction();
  };

  const handleOpenPointAnswer = async (questionId: string, text: string) => {
    if (!selectedEntry || !canDiscussRole) return;
    const ok = await runServerAction(() =>
      answerQuestion({
        projectId: ctx.id,
        questionId,
        text,
      }),
    );
    if (ok) refreshAfterAction();
  };

  const handleOpenPointDelete = async (questionId: string) => {
    if (!window.confirm("Offenen Punkt wirklich löschen?")) return;
    const ok = await runServerAction(() =>
      deleteQuestion(ctx.id, questionId),
    );
    if (ok) refreshAfterAction();
  };

  const handleSourceSubmit = async (data: unknown) => {
    if (!selectedEntry || !canEdit) return;
    const payload = data as Record<string, string>;
    const refParts = [payload.author, payload.year].filter(Boolean);
    const ok = await runServerAction(() =>
      addSource({
        projectId: ctx.id,
        entryId: selectedEntry.id,
        title: payload.title ?? "",
        type: (payload.type as "primary" | "secondary" | "tertiary") ?? "secondary",
        note: payload.note,
        ref: refParts.length > 0 ? refParts.join(", ") : undefined,
      }),
    );
    if (ok) refreshAfterAction();
  };

  const handleSourceDelete = async (sourceId: string) => {
    if (!canEdit) return;
    if (!window.confirm("Quelle wirklich löschen?")) return;
    const ok = await runServerAction(() => deleteSource(ctx.id, sourceId));
    if (ok) refreshAfterAction();
  };

  const handleClaimSubmit = async (data: unknown) => {
    if (!selectedEntry || !canEdit) return;
    const payload = data as Record<string, string>;
    const ok = await runServerAction(() =>
      addClaim({
        projectId: ctx.id,
        entryId: selectedEntry.id,
        text: payload.text ?? "",
        confidence: (payload.confidence as Confidence) ?? "likely",
      }),
    );
    if (ok) refreshAfterAction();
  };

  const handleClaimDelete = async (claimId: string) => {
    if (!canEdit) return;
    if (!window.confirm("Behauptung wirklich löschen?")) return;
    const ok = await runServerAction(() => deleteClaim(ctx.id, claimId));
    if (ok) refreshAfterAction();
  };

  const handleRelationSubmit = async (data: unknown) => {
    if (!selectedEntry || !canEdit) return false;
    const payload = data as Record<string, string>;
    if (!payload.targetEntryId) {
      window.alert("Bitte Ziel-Eintrag wählen");
      return false;
    }
    const ok = await runServerAction(() =>
      addRelation({
        projectId: ctx.id,
        fromEntryId: selectedEntry.id,
        toEntryId: payload.targetEntryId ?? "",
        type: payload.relationType as RelationType,
      }),
    );
    if (ok) refreshAfterAction();
    return ok;
  };

  const handleRelationDelete = async (
    relationId: string,
    otherEntryTitle?: string,
    typeLabel?: string,
  ) => {
    if (!canEdit) return;
    const label =
      otherEntryTitle && typeLabel
        ? `„${typeLabel}: ${otherEntryTitle}"`
        : otherEntryTitle
          ? `„${otherEntryTitle}"`
          : "diese Verknüpfung";
    if (!window.confirm(`Verknüpfung zu ${label} wirklich entfernen?`)) return;
    const ok = await runServerAction(() => deleteRelation(ctx.id, relationId));
    if (ok) refreshAfterAction();
  };

  const recentActivitySet = React.useMemo(
    () => new Set(recentActivityEntryIds),
    [recentActivityEntryIds],
  );

  const visibleEntries = entries.slice(0, listLimit);
  const pinnedNote =
    !!selectedEntryId &&
    !visibleEntries.some((e) => e.id === selectedEntryId) &&
    !!selectedEntry;

  const listItems = pinnedNote && selectedEntry
    ? [toListItem(selectedEntry), ...visibleEntries.map(toListItem)]
    : visibleEntries.map(toListItem);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <AppHeader
        projects={projects}
        currentProject={project}
        activeView={viewMode}
        userName={ctx.userName}
        userImage={ctx.userImage ?? undefined}
        userInitials={ctx.userInitials}
        notifications={ctx.notifications}
        showTeamNav={ctx.isAppAdmin}
        canCreateProject
        isAppAdmin={ctx.isAppAdmin}
        canDeleteCurrentProject={canDeleteProject(ctx.userRole, ctx.isAppAdmin)}
        currentProjectDbId={ctx.id}
        onViewChange={handleViewChange}
        onProjectChange={handleProjectChange}
        onCommandPaletteOpen={() => setPaletteOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {viewMode === "browse" && (
          <NavPanel
            className="max-[900px]:w-full max-[900px]:border-r-0"
            topics={topics}
            types={types}
            confidenceLevels={confidenceLevels}
            savedViews={ctx.savedViews}
            entries={listItems}
            totalCount={totalCount}
            listLimit={listLimit}
            selectedEntryId={selectedEntryId}
            searchQuery={searchQuery}
            activeTopics={activeTopics}
            activeTypes={activeTypes}
            activeConfidence={activeConfidence}
            activeSavedView={activeSavedView}
            pinnedNote={pinnedNote}
            recentActivityEntryIds={recentActivitySet}
            onSearchChange={handleSearchChange}
            onTopicToggle={(id) => toggleSetParam("topic", id, activeTopics)}
            onTypeToggle={(id) => toggleSetParam("type", id, activeTypes)}
            onConfidenceToggle={(id) =>
              toggleSetParam("confidence", id, activeConfidence)
            }
            onSavedViewSelect={(id) =>
              updateParams((params) => {
                if (id) params.set("savedView", id);
                else params.delete("savedView");
              })
            }
            onEntrySelect={handleEntrySelect}
            onExpandList={() => setListLimit((l) => l + LIST_LIMIT)}
            onCommandPaletteOpen={() => setPaletteOpen(true)}
            onClearFilters={handleClearFilters}
            canCreateEntry={canEdit}
            onNewEntry={() => router.push(`${basePath}/new`)}
          />
        )}

        {viewMode !== "browse" && (
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        )}

        {viewMode === "browse" && (
          <DetailPanel
            key={selectedEntryId ?? "none"}
            expanded
            entry={selectedEntry ? toDetail(selectedEntry) : null}
            projectSlug={ctx.slug}
            entryIndex={entryIndex}
            relationSearchResults={relationSearchResults}
            relationSearchError={relationSearchError}
            onRelationSearch={handleRelationSearch}
            onAction={handleEntryAction}
            onNavigateEntry={handleNavigateEntry}
            onAttachmentUpload={handleAttachmentUpload}
            attachmentUploadStatus={attachmentUploadStatus}
            onAttachmentDelete={handleAttachmentDelete}
            onEditBody={handleEditBody}
            onOpenPointAdd={handleOpenPointAdd}
            onOpenPointAnswer={handleOpenPointAnswer}
            onOpenPointDelete={handleOpenPointDelete}
            onSourceSubmit={handleSourceSubmit}
            onSourceDelete={handleSourceDelete}
            onClaimSubmit={handleClaimSubmit}
            onClaimDelete={handleClaimDelete}
            onRelationSubmit={handleRelationSubmit}
            onRelationDelete={handleRelationDelete}
            canEdit={canEdit}
            canDiscuss={canDiscussRole}
            canCreateEntry={canEdit}
            onNewEntry={() => router.push(`${basePath}/new`)}
            onCreateChildEntry={
              selectedEntry?.type === "book"
                ? () =>
                    router.push(
                      `${basePath}/new?parent=${selectedEntry.id}`,
                    )
                : undefined
            }
            projectName={ctx.name}
            className="max-[900px]:hidden"
          />
        )}
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        results={searchResults}
        onSearch={handlePaletteSearch}
        onSelect={handlePaletteSelect}
      />

    </div>
  );
}
