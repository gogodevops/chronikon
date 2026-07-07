"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
  addComment,
  answerQuestion,
  deleteComment,
  deleteQuestion,
} from "@/actions/discussions";
import type { RelationType } from "@prisma/client";
import type { Confidence } from "@prisma/client";
import { canDeleteProject, canDiscuss, canEditProject, canSeeTeamNav, runServerAction } from "@/lib/action-feedback";
import { CommandPalette, type CommandResult } from "@/components/command-palette";
import {
  AppHeader,
  type AppView,
  type ProjectOption,
} from "@/components/layout/app-header";
import { DetailPanel, type EntryDetail } from "@/components/layout/detail-panel";
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
    })),
    sourceCount: e.sourceCount,
    claimCount: e.claimCount,
    discussionCount: e.questionCount + e.commentCount,
    questionCount: e.questionCount,
    commentCount: e.commentCount,
    parentEntryId: e.parentEntryId,
    parentEntryTitle: e.parentEntryTitle,
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
  const [searchResults, setSearchResults] = React.useState<CommandResult[]>([]);
  const [activeTab, setActiveTab] = React.useState("inhalt");
  const [relationSearchResults, setRelationSearchResults] = React.useState<
    LinkableEntryResult[]
  >([]);
  const relationSearchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const basePath = `/p/${ctx.slug}`;

  React.useEffect(() => {
    const tab = searchParams.get("tab");
    const validTabs = [
      "inhalt",
      "quellen",
      "behauptungen",
      "diskussion",
      "verknuepfungen",
      "historie",
    ];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab("inhalt");
    }
  }, [selectedEntryId, searchParams]);

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
    if (view === "team" && !canSeeTeamNav(ctx.userRole)) return;
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

  const handleRelationSearch = React.useCallback(
    (query: string) => {
      if (relationSearchTimer.current) {
        clearTimeout(relationSearchTimer.current);
      }
      const q = query.trim();
      if (!q || !selectedEntry) {
        setRelationSearchResults([]);
        return;
      }
      relationSearchTimer.current = setTimeout(async () => {
        const result = await searchLinkableEntries(ctx.id, q, selectedEntry.id);
        if (result.success) {
          setRelationSearchResults(result.data);
        } else {
          setRelationSearchResults([]);
        }
      }, 200);
    },
    [ctx.id, selectedEntry],
  );

  const handleEntryAction = async (action: EntryAction) => {
    if (!selectedEntry) return;

    switch (action) {
      case "discussion":
        setActiveTab("diskussion");
        break;
      case "claim":
        setActiveTab("behauptungen");
        break;
      case "source":
        setActiveTab("quellen");
        break;
      case "relation":
        setActiveTab("verknuepfungen");
        break;
      case "attachment":
        document
          .querySelector<HTMLInputElement>(
            `input[type="file"][accept*=".pdf"]`,
          )
          ?.click();
        break;
      case "edit":
        router.push(`${basePath}/new?edit=${selectedEntry.id}`);
        break;
      case "delete":
        if (
          window.confirm(
            `Eintrag „${selectedEntry.title}" wirklich löschen?`,
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
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(err.error ?? "Upload fehlgeschlagen");
        return;
      }
      const data = (await res.json()) as {
        storageKey: string;
        url?: string;
        mimeType: string;
        name: string;
        text?: string;
      };
      const ok = await runServerAction(() =>
        addAttachmentMetadata({
          projectId: ctx.id,
          entryId: selectedEntry.id,
          name: data.name,
          mimeType: data.mimeType,
          storageKey: data.storageKey,
          publicUrl: data.url,
          label: "Später hinzugefügt",
          extractedText: data.text,
        }),
      );
      if (ok) refreshAfterAction();
    } catch {
      window.alert("Upload fehlgeschlagen");
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

  const handleTabAction = async (
    tab: string,
    action: string,
    data?: unknown,
  ) => {
    if (!selectedEntry) return;
    const payload = data as Record<string, string> | undefined;

    if (tab === "inhalt" && action === "edit") {
      if (!canEdit) return;
      router.push(`${basePath}/new?edit=${selectedEntry.id}`);
      return;
    }

    if (tab === "quellen" && action === "submit" && payload && canEdit) {
      const ok = await runServerAction(() =>
        addSource({
          projectId: ctx.id,
          entryId: selectedEntry.id,
          title: payload.title ?? "",
          type: (payload.type as "primary" | "secondary" | "tertiary") ?? "secondary",
          note: payload.note,
          ref: payload.year,
        }),
      );
      if (ok) {
        setActiveTab("quellen");
        refreshAfterAction();
      }
      return;
    }

    if (tab === "quellen" && action === "delete" && payload?.id && canEdit) {
      if (!window.confirm("Quelle wirklich löschen?")) return;
      const ok = await runServerAction(() =>
        deleteSource(ctx.id, payload.id),
      );
      if (ok) refreshAfterAction();
      return;
    }

    if (tab === "behauptungen" && action === "submit" && payload && canEdit) {
      const ok = await runServerAction(() =>
        addClaim({
          projectId: ctx.id,
          entryId: selectedEntry.id,
          text: payload.text ?? "",
          confidence: (payload.confidence as Confidence) ?? "likely",
        }),
      );
      if (ok) {
        setActiveTab("behauptungen");
        refreshAfterAction();
      }
      return;
    }

    if (tab === "behauptungen" && action === "delete" && payload?.id && canEdit) {
      if (!window.confirm("Behauptung wirklich löschen?")) return;
      const ok = await runServerAction(() =>
        deleteClaim(ctx.id, payload.id),
      );
      if (ok) refreshAfterAction();
      return;
    }

    if (tab === "verknuepfungen" && action === "submit" && payload && canEdit) {
      if (!payload.targetEntryId) {
        window.alert("Bitte Ziel-Eintrag wählen");
        return;
      }
      const ok = await runServerAction(() =>
        addRelation({
          projectId: ctx.id,
          fromEntryId: selectedEntry.id,
          toEntryId: payload.targetEntryId ?? "",
          type: payload.relationType as RelationType,
        }),
      );
      if (ok) {
        setActiveTab("verknuepfungen");
        refreshAfterAction();
      }
      return;
    }

    if (tab === "verknuepfungen" && action === "delete" && payload?.id && canEdit) {
      if (!window.confirm("Verknüpfung wirklich löschen?")) return;
      const ok = await runServerAction(() =>
        deleteRelation(ctx.id, payload.id),
      );
      if (ok) refreshAfterAction();
      return;
    }

    if (tab === "diskussion" && action === "submit" && payload && canDiscussRole) {
      const ok = await runServerAction(() =>
        addComment({
          projectId: ctx.id,
          entryId: selectedEntry.id,
          text: payload.text ?? "",
        }),
      );
      if (ok) {
        setActiveTab("diskussion");
        refreshAfterAction();
      }
      return;
    }

    if (tab === "diskussion" && action === "answer" && payload && canDiscussRole) {
      const ok = await runServerAction(() =>
        answerQuestion({
          projectId: ctx.id,
          questionId: payload.questionId ?? "",
          text: payload.text ?? "",
        }),
      );
      if (ok) refreshAfterAction();
      return;
    }

    if (tab === "diskussion" && action === "deleteQuestion" && payload?.id) {
      if (!window.confirm("Frage wirklich löschen?")) return;
      const ok = await runServerAction(() =>
        deleteQuestion(ctx.id, payload.id),
      );
      if (ok) refreshAfterAction();
      return;
    }

    if (tab === "diskussion" && action === "deleteComment" && payload?.id) {
      if (!window.confirm("Kommentar wirklich löschen?")) return;
      const ok = await runServerAction(() =>
        deleteComment(ctx.id, payload.id),
      );
      if (ok) refreshAfterAction();
    }
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
        showTeamNav={canSeeTeamNav(ctx.userRole)}
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
            expanded
            entry={selectedEntry ? toDetail(selectedEntry) : null}
            projectSlug={ctx.slug}
            entryIndex={entryIndex}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            relationSearchResults={relationSearchResults}
            onRelationSearch={handleRelationSearch}
            onAction={handleEntryAction}
            onTabAction={handleTabAction}
            onNavigateEntry={handleNavigateEntry}
            onAttachmentUpload={handleAttachmentUpload}
            onAttachmentDelete={handleAttachmentDelete}
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
