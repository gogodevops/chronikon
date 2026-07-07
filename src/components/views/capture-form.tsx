"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createEntry, updateEntry } from "@/actions/entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPE_META } from "@/lib/constants";
import {
  getEntryFormConfig,
  parseEntryYears,
} from "@/lib/entry-form-config";
import { cn } from "@/lib/utils";
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
    language: normalizeEntryLanguage(
      initialFields?.language || DEFAULT_ENTRY_LANGUAGE,
    ),
    author: initialFields?.author ?? "",
    placeName: initialFields?.placeName ?? "",
  });

  const config = getEntryFormConfig(fields.type);
  const showTopic = topics.length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const pageStart = fields.pageStart
        ? parseInt(fields.pageStart, 10)
        : undefined;
      const pageEnd = fields.pageEnd
        ? parseInt(fields.pageEnd, 10)
        : undefined;

      const { yearStart, yearEnd } = parseEntryYears(
        fields.yearStart,
        fields.yearEnd,
        config.yearEndOptional,
      );

      const payload = {
        projectId,
        type: fields.type as "text",
        title: fields.title,
        yearStart,
        yearEnd,
        pageStart: pageStart && pageStart > 0 ? pageStart : undefined,
        pageEnd: pageEnd && pageEnd > 0 ? pageEnd : undefined,
        confidence: fields.confidence as "likely",
        language: fields.language || DEFAULT_ENTRY_LANGUAGE,
        author: config.showAuthor ? fields.author || undefined : undefined,
        placeName: config.showPlaceName
          ? fields.placeName || undefined
          : undefined,
        topicNames: showTopic && fields.topic ? [fields.topic] : [],
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

  const yearFields = config.showYears ? (
    <div className="grid grid-cols-2 gap-4">
      <Field label={config.yearStartLabel}>
        <Input
          value={fields.yearStart}
          onChange={(e) =>
            setFields((f) => ({ ...f, yearStart: e.target.value }))
          }
          placeholder={
            fields.type === "book" ? "z. B. 1973" : "z. B. 1453"
          }
        />
      </Field>
      <Field
        label={config.yearEndLabel}
        emphasized={fields.type === "book" && !config.yearEndOptional}
      >
        <Input
          value={fields.yearEnd}
          onChange={(e) =>
            setFields((f) => ({ ...f, yearEnd: e.target.value }))
          }
        />
      </Field>
    </div>
  ) : null;

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

        <Field
          label={config.titleLabel}
          emphasized={config.titleEmphasized}
        >
          <Input
            value={fields.title}
            onChange={(e) =>
              setFields((f) => ({ ...f, title: e.target.value }))
            }
            placeholder={config.titlePlaceholder}
          />
        </Field>

        {config.bookMetadataBox && !isBookChild && (
          <div className="space-y-3 rounded-xl border border-accent/25 bg-accent-dim/25 p-3">
            <p className="text-[0.72rem] font-medium text-accent">
              Wichtige Buch-Metadaten — PDF danach unter Material hochladen
            </p>
            {config.showAuthor && (
              <Field label={config.authorLabel ?? "Autor"} emphasized>
                <Input
                  value={fields.author}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, author: e.target.value }))
                  }
                  placeholder="z. B. Halil İnalcık"
                />
              </Field>
            )}
            {yearFields}
          </div>
        )}

        {config.showPlaceName && !isBookChild && (
          <Field label={config.placeNameLabel ?? "Ort"}>
            <Input
              value={fields.placeName}
              onChange={(e) =>
                setFields((f) => ({ ...f, placeName: e.target.value }))
              }
              placeholder="z. B. Ägypten, Nag Hammadi"
            />
          </Field>
        )}

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
          !config.bookMetadataBox && yearFields
        )}

        {config.showLanguage && (
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
        )}

        {showTopic && (
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
        )}

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
  emphasized = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div>
      <label
        className={cn(
          "mb-1 block text-[0.72rem] uppercase tracking-wide",
          emphasized ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
