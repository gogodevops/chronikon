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
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [extractedText, setExtractedText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [fields, setFields] = React.useState({
    type: initialFields?.type ?? "text",
    title: initialFields?.title ?? "",
    yearStart: initialFields?.yearStart ?? "",
    yearEnd: initialFields?.yearEnd ?? "",
    confidence: initialFields?.confidence ?? "likely",
    topic: initialFields?.topic ?? topics[0] ?? "",
    summary: initialFields?.summary ?? "",
    body: initialFields?.body ?? "",
    language: initialFields?.language ?? "",
    author: initialFields?.author ?? "",
    placeName: initialFields?.placeName ?? "",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) {
        setExtractedText(data.text);
        setUploadOpen(true);
      }
    } finally {
      setUploading(false);
    }
  };

  const insertExtractedText = () => {
    if (!extractedText) return;
    setFields((prev) => ({
      ...prev,
      body: prev.body
        ? `${prev.body}\n\n${extractedText}`
        : extractedText,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        projectId,
        type: fields.type as "text",
        title: fields.title,
        summary: fields.summary || undefined,
        body: fields.body || undefined,
        yearStart: parseInt(fields.yearStart, 10) || 0,
        yearEnd: parseInt(fields.yearEnd, 10) || 2025,
        confidence: fields.confidence as "likely",
        language: fields.language || undefined,
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
            : "Felder ausfüllen — Quelle optional hochladen"
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {parentEntryTitle && !isEdit && (
          <p className="rounded-lg border border-accent/25 bg-accent-dim/40 px-3 py-2 text-[0.78rem] text-accent">
            Untereintrag von <strong>{parentEntryTitle}</strong>
          </p>
        )}
        {!isEdit && (
          <details
            open={uploadOpen}
            onToggle={(e) => setUploadOpen((e.target as HTMLDetailsElement).open)}
            className="rounded-lg border border-border/80 bg-surface-2/40"
          >
            <summary className="cursor-pointer px-4 py-3 text-[0.82rem] font-medium text-foreground select-none">
              Quelle hochladen (optional)
            </summary>
            <div className="space-y-3 border-t border-border/60 px-4 py-3">
              <p className="text-[0.78rem] text-muted-foreground">
                PDF oder Bild hochladen — bei PDFs wird Text per OCR extrahiert
                und kann in den Inhalt übernommen werden.
              </p>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={handleUpload}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-muted-foreground">Wird hochgeladen…</p>
              )}
              {extractedText && (
                <div className="space-y-2">
                  <Textarea
                    value={extractedText.slice(0, 2000)}
                    readOnly
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={insertExtractedText}>
                    Text in Inhalt übernehmen
                  </Button>
                </div>
              )}
            </div>
          </details>
        )}

        <Field label="Typ">
          <Select
            value={fields.type}
            onValueChange={(v) => setFields((f) => ({ ...f, type: v }))}
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
        </Field>

        <Field label="Titel">
          <Input
            value={fields.title}
            onChange={(e) =>
              setFields((f) => ({ ...f, title: e.target.value }))
            }
          />
        </Field>

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
