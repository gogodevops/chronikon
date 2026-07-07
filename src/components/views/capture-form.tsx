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
import type { DocumentAnalysis } from "@/lib/ai";

type Step = 1 | 2 | 3;

export function CaptureForm({
  projectId,
  projectSlug,
  topics,
  editEntryId,
  initialFields,
}: {
  projectId: string;
  projectSlug: string;
  topics: string[];
  editEntryId?: string;
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
  const [step, setStep] = React.useState<Step>(3);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<DocumentAnalysis | null>(null);
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
      if (data.text) setExtractedText(data.text);
      setUploadOpen(true);
      setStep(3);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractedText,
          filename: "upload",
          projectSlug,
        }),
      });
      const data = (await res.json()) as DocumentAnalysis;
      setAnalysis(data);
      const f = data.suggestion.fields;
      setFields((prev) => ({
        ...prev,
        type: f.type ?? prev.type,
        title: f.title ?? prev.title,
        yearStart: f.yearStart ?? prev.yearStart,
        yearEnd: f.yearEnd ?? prev.yearEnd,
        confidence: f.confidence ?? prev.confidence,
        topic: f.topic ?? prev.topic,
        summary: f.summary ?? prev.summary,
        body: f.body ?? prev.body,
        language: f.language ?? prev.language,
        author: f.author ?? prev.author,
        placeName: f.placeName ?? prev.placeName,
      }));
      setStep(3);
    } finally {
      setAnalyzing(false);
    }
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
      };

      const result = isEdit
        ? await updateEntry({ ...payload, id: editEntryId! })
        : await createEntry(payload);

      if (!result.success) {
        window.alert(result.error ?? "Speichern fehlgeschlagen");
        return;
      }

      const entryId = isEdit ? editEntryId! : result.data!.id;
      if (!isEdit) {
        await fetch("/api/ai/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, projectId }),
        });
      }
      router.push(
        `/p/${projectSlug}?entry=${entryId}${isEdit ? "" : "&kiReview=1"}`,
      );
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
      title={isEdit ? "Eintrag bearbeiten" : "Neuer Eintrag"}
      description={
        isEdit
          ? "Felder anpassen und speichern"
          : "Felder ausfüllen — Quelle optional hochladen"
      }
      maxWidth="md"
    >
      {!isEdit && step === 2 && (
        <div className="space-y-4">
          {extractedText && (
            <Textarea
              value={extractedText.slice(0, 2000)}
              readOnly
              rows={8}
              className="font-mono text-xs"
            />
          )}
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "Analysiere…" : "KI-Analyse starten"}
          </Button>
          <Button variant="outline" onClick={() => setStep(3)}>
            Überspringen
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
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
                  PDF oder Bild hochladen (OCR für PDFs), optional mit KI-Analyse
                  vorausfüllen.
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
                {extractedText && step === 3 && (
                  <div className="space-y-2">
                    <Textarea
                      value={extractedText.slice(0, 2000)}
                      readOnly
                      rows={6}
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={handleAnalyze}
                      disabled={analyzing}
                    >
                      {analyzing ? "Analysiere…" : "KI-Analyse starten"}
                    </Button>
                  </div>
                )}
              </div>
            </details>
          )}

          {analysis && (
            <div className="rounded-lg border border-accent/30 bg-accent-dim p-3 text-sm">
              <p>{analysis.reply}</p>
              {analysis.evidence && (
                <p className="mt-1 text-muted-foreground">{analysis.evidence}</p>
              )}
            </div>
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
      )}
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
