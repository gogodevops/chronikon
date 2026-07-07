"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createEntry, updateEntry } from "@/actions/entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPE_META } from "@/lib/constants";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import { ENTRY_TYPE_HINTS } from "@/lib/ki-templates";
import {
  DEFAULT_ENTRY_LANGUAGE,
  ENTRY_LANGUAGES,
  normalizeEntryLanguage,
  type EntryLanguageCode,
} from "@/lib/languages";

export function CaptureForm({
  projectId,
  projectSlug,
  topics,
  editEntryId,
  parentEntryId,
  parentEntryTitle,
  initialFields,
}: {
  projectId: string;
  projectSlug: string;
  topics: string[];
  editEntryId?: string;
  parentEntryId?: string;
  parentEntryTitle?: string;
  initialFields?: Partial<{
    type: string;
    title: string;
    yearStart: string;
    yearEnd: string;
    pageStart: string;
    pageEnd: string;
    confidence: string;
    topic: string;
    summary: string;
    body: string;
    language: string;
    author: string;
    placeName: string;
  }>;
}) {
  const router = useRouter();
  const isEdit = !!editEntryId;
  const isBookChild = !!parentEntryId;
  const [saving, setSaving] = React.useState(false);

  const [fields, setFields] = React.useState({
    type: initialFields?.type ?? (isBookChild ? "text" : "text"),
    title: initialFields?.title ?? "",
    yearStart: initialFields?.yearStart ?? "",
    yearEnd: initialFields?.yearEnd ?? "",
    pageStart: initialFields?.pageStart ?? "",
    pageEnd: initialFields?.pageEnd ?? "",
    confidence: initialFields?.confidence ?? "likely",
    topic: initialFields?.topic ?? topics[0] ?? "",
    summary: initialFields?.summary ?? "",
    body: initialFields?.body ?? "",
    language: normalizeEntryLanguage(
      initialFields?.language || DEFAULT_ENTRY_LANGUAGE,
    ),
    author: initialFields?.author ?? "",
    placeName: initialFields?.placeName ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const pageStart = fields.pageStart
        ? parseInt(fields.pageStart, 10)
        : undefined;
      const pageEnd = fields.pageEnd
        ? parseInt(fields.pageEnd, 10)
        : undefined;

      const payload = {
        projectId,
        type: fields.type as "text",
        title: fields.title,
        summary: fields.summary || undefined,
        body: fields.body || undefined,
        yearStart: parseInt(fields.yearStart, 10) || 0,
        yearEnd: parseInt(fields.yearEnd, 10) || 2025,
        pageStart: pageStart && pageStart > 0 ? pageStart : undefined,
        pageEnd: pageEnd && pageEnd > 0 ? pageEnd : undefined,
        confidence: fields.confidence as "likely",
        language: fields.language || DEFAULT_ENTRY_LANGUAGE,
        author: fields.author || undefined,
        placeName: fields.placeName || undefined,
        topicNames: fields.topic ? [fields.topic] : [],
        parentEntryId: parentEntryId || undefined,
      };

      const result = isEdit
        ? await updateEntry({ ...payload, id: editEntryId! })
        : await createEntry(payload);

      if (!result.success) {
        window.alert(result.error ?? "Speichern fehlgeschlagen");
        return;
      }

      const entryId = isEdit ? editEntryId! : result.data!.id;
      router.push(`/p/${projectSlug}?entry=${entryId}`);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ViewFrame
      title={
        isEdit
          ? "Eintrag bearbeiten"
          : parentEntryTitle
            ? "Untereintrag anlegen"
            : "Neuer Eintrag"
      }
      description={
        isEdit
          ? "Felder anpassen und speichern"
          : parentEntryTitle
            ? `Kapitel, Seite oder Abschnitt für „${parentEntryTitle}"`
            : fields.type === "book"
              ? "Buch anlegen — PDF kann danach in der Detailansicht unter Material hinzugefügt werden"
              : "Felder ausfüllen und speichern"
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {parentEntryTitle && !isEdit && (
          <p className="rounded-lg border border-accent/25 bg-accent-dim/40 px-3 py-2 text-[0.78rem] text-accent">
            Untereintrag von <strong>{parentEntryTitle}</strong>
          </p>
        )}

        <Field label="Typ">
          <Select
            value={fields.type}
            onValueChange={(v) => setFields((f) => ({ ...f, type: v }))}
            disabled={isEdit || isBookChild}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 rounded-lg border border-border/50 bg-surface-2/50 px-2.5 py-2 text-[0.75rem] leading-relaxed text-muted-foreground">
            {ENTRY_TYPE_HINTS[fields.type as keyof typeof ENTRY_TYPE_HINTS]}
          </p>
        </Field>

        <Field label="Titel">
          <Input
            value={fields.title}
            onChange={(e) =>
              setFields((f) => ({ ...f, title: e.target.value }))
            }
          />
        </Field>

        {isBookChild ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Seite von">
              <Input
                type="number"
                min={1}
                value={fields.pageStart}
                onChange={(e) =>
                  setFields((f) => ({ ...f, pageStart: e.target.value }))
                }
              />
            </Field>
            <Field label="Seite bis">
              <Input
                type="number"
                min={1}
                value={fields.pageEnd}
                onChange={(e) =>
                  setFields((f) => ({ ...f, pageEnd: e.target.value }))
                }
              />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Von (Jahr)">
              <Input
                value={fields.yearStart}
                onChange={(e) =>
                  setFields((f) => ({ ...f, yearStart: e.target.value }))
                }
              />
            </Field>
            <Field label="Bis (Jahr)">
              <Input
                value={fields.yearEnd}
                onChange={(e) =>
                  setFields((f) => ({ ...f, yearEnd: e.target.value }))
                }
              />
            </Field>
          </div>
        )}

        <Field label="Sprache">
          <Select
            value={fields.language}
            onValueChange={(v) =>
              setFields((f) => ({
                ...f,
                language: normalizeEntryLanguage(v) as EntryLanguageCode,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTRY_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Thema">
          <Select
            value={fields.topic}
            onValueChange={(v) => setFields((f) => ({ ...f, topic: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Zusammenfassung">
          <Textarea
            value={fields.summary}
            onChange={(e) =>
              setFields((f) => ({ ...f, summary: e.target.value }))
            }
            rows={2}
          />
        </Field>

        <Field label="Inhalt (Markdown)">
          <Textarea
            value={fields.body}
            onChange={(e) =>
              setFields((f) => ({ ...f, body: e.target.value }))
            }
            rows={8}
            className="font-mono text-sm"
          />
        </Field>

        <Button onClick={handleSave} disabled={saving || !fields.title}>
          {saving ? "Speichern…" : isEdit ? "Änderungen speichern" : "Eintrag speichern"}
        </Button>
      </div>
    </ViewFrame>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
