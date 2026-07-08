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
  ALLOWED_CHILD_TYPES,
  getBookChildTypeLabel,
} from "@/lib/entry-hierarchy";
import {
  getEntryFormConfig,
  getMissingRequiredLabels,
  isEntryFormComplete,
} from "@/lib/entry-form-config";
import {
  bookFormInitialFromEntry,
  inputFromSignedYear,
  parseHistoricalYearRange,
  parsePublicationYear,
  type YearEra,
} from "@/lib/historical-year-fields";
import {
  dayToInput,
  monthToInput,
  parseOptionalDay,
  parseOptionalMonth,
} from "@/lib/person-date-fields";
import { HistoricalYearRangeFields } from "@/components/ui/historical-year-input";
import { PersonLifeDateFields } from "@/components/ui/person-life-date-fields";
import { cn } from "@/lib/utils";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import { ENTRY_TYPE_HINTS } from "@/lib/ki-templates";

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
    eraStart: YearEra;
    eraEnd: YearEra;
    publishedYearStart: string;
    publishedYearEnd: string;
    birthMonth: string;
    birthDay: string;
    deathMonth: string;
    deathDay: string;
    pageStart: string;
    pageEnd: string;
    confidence: string;
    topic: string;
    author: string;
    placeName: string;
  }>;
}) {
  const router = useRouter();
  const isEdit = !!editEntryId;
  const isBookChild = !!parentEntryId;
  const [saving, setSaving] = React.useState(false);

  const defaultEraStart = initialFields?.eraStart ?? "ad";
  const defaultEraEnd = initialFields?.eraEnd ?? "ad";

  const [fields, setFields] = React.useState({
    type: initialFields?.type ?? (isBookChild ? "text" : "text"),
    title: initialFields?.title ?? "",
    yearStart: initialFields?.yearStart ?? "",
    yearEnd: initialFields?.yearEnd ?? "",
    eraStart: defaultEraStart,
    eraEnd: defaultEraEnd,
    publishedYearStart: initialFields?.publishedYearStart ?? "",
    publishedYearEnd: initialFields?.publishedYearEnd ?? "",
    birthMonth: initialFields?.birthMonth ?? "",
    birthDay: initialFields?.birthDay ?? "",
    deathMonth: initialFields?.deathMonth ?? "",
    deathDay: initialFields?.deathDay ?? "",
    pageStart: initialFields?.pageStart ?? "",
    pageEnd: initialFields?.pageEnd ?? "",
    confidence: initialFields?.confidence ?? "likely",
    topic: initialFields?.topic ?? topics[0] ?? "",
    author: initialFields?.author ?? "",
    placeName: initialFields?.placeName ?? "",
  });

  const config = getEntryFormConfig(fields.type);
  const showTopic = topics.length > 0;
  const selectableTypes = isBookChild
    ? (ALLOWED_CHILD_TYPES.book ?? [])
    : (Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]);

  const formComplete = isEntryFormComplete(fields.type, isBookChild, {
    title: fields.title,
    author: fields.author,
    placeName: fields.placeName,
    pageStart: fields.pageStart,
  });
  const missingLabels = getMissingRequiredLabels(fields.type, isBookChild, {
    title: fields.title,
    author: fields.author,
    placeName: fields.placeName,
    pageStart: fields.pageStart,
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

      const { yearStart, yearEnd } = parseHistoricalYearRange(
        fields.yearStart,
        fields.yearEnd,
        fields.eraStart,
        fields.eraEnd,
        config.yearEndOptional,
      );

      const publishedYearStart =
        fields.type === "book" && config.showPublishedYears
          ? parsePublicationYear(fields.publishedYearStart)
          : undefined;
      const publishedYearEnd =
        fields.type === "book" && config.showPublishedYears
          ? parsePublicationYear(fields.publishedYearEnd)
          : undefined;

      const dateStartMonth =
        fields.type === "person" && config.showDateParts
          ? parseOptionalMonth(fields.birthMonth)
          : undefined;
      let dateStartDay =
        fields.type === "person" && config.showDateParts
          ? parseOptionalDay(fields.birthDay)
          : undefined;
      if (dateStartDay != null && dateStartMonth == null) dateStartDay = null;

      const dateEndMonth =
        fields.type === "person" && config.showDateParts
          ? parseOptionalMonth(fields.deathMonth)
          : undefined;
      let dateEndDay =
        fields.type === "person" && config.showDateParts
          ? parseOptionalDay(fields.deathDay)
          : undefined;
      if (dateEndDay != null && dateEndMonth == null) dateEndDay = null;

      const payload = {
        projectId,
        type: fields.type as "text",
        title: fields.title,
        yearStart,
        yearEnd,
        publishedYearStart:
          fields.type === "book" && config.showPublishedYears
            ? publishedYearStart && publishedYearStart > 0
              ? publishedYearStart
              : null
            : undefined,
        publishedYearEnd:
          fields.type === "book" && config.showPublishedYears
            ? publishedYearEnd && publishedYearEnd > 0
              ? publishedYearEnd
              : null
            : undefined,
        dateStartMonth:
          fields.type === "person" && config.showDateParts
            ? dateStartMonth
            : undefined,
        dateStartDay:
          fields.type === "person" && config.showDateParts
            ? dateStartDay
            : undefined,
        dateEndMonth:
          fields.type === "person" && config.showDateParts
            ? dateEndMonth
            : undefined,
        dateEndDay:
          fields.type === "person" && config.showDateParts
            ? dateEndDay
            : undefined,
        pageStart: pageStart && pageStart > 0 ? pageStart : undefined,
        pageEnd: pageEnd && pageEnd > 0 ? pageEnd : undefined,
        confidence: fields.confidence as "likely",
        author: config.showAuthor ? fields.author || undefined : undefined,
        placeName: config.showPlaceName
          ? fields.placeName || undefined
          : undefined,
        topicNames: showTopic && fields.topic ? [fields.topic] : [],
        parentEntryId: !isEdit && parentEntryId ? parentEntryId : undefined,
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

  const historicalYearFields = config.showYears ? (
    <HistoricalYearRangeFields
      startLabel={config.yearStartLabel}
      endLabel={config.yearEndLabel}
      startYear={fields.yearStart}
      endYear={fields.yearEnd}
      startEra={fields.eraStart}
      endEra={fields.eraEnd}
      onStartYearChange={(value) =>
        setFields((f) => ({ ...f, yearStart: value }))
      }
      onEndYearChange={(value) =>
        setFields((f) => ({ ...f, yearEnd: value }))
      }
      onStartEraChange={(value) =>
        setFields((f) => ({ ...f, eraStart: value }))
      }
      onEndEraChange={(value) =>
        setFields((f) => ({ ...f, eraEnd: value }))
      }
      startPlaceholder={
        fields.type === "book" ? "z. B. 330" : "z. B. 1453"
      }
      endPlaceholder={
        fields.type === "book" ? "z. B. 1453" : "z. B. 1500"
      }
    />
  ) : null;

  const publicationYearFields =
    config.showPublishedYears && !isBookChild ? (
      <div className="grid grid-cols-2 gap-4">
        <Field label={config.publishedYearStartLabel ?? "Erscheinungsjahr"}>
          <Input
            value={fields.publishedYearStart}
            onChange={(e) =>
              setFields((f) => ({ ...f, publishedYearStart: e.target.value }))
            }
            placeholder="z. B. 1973"
            inputMode="numeric"
          />
        </Field>
        <Field label={config.publishedYearEndLabel ?? "Bis (optional)"}>
          <Input
            value={fields.publishedYearEnd}
            onChange={(e) =>
              setFields((f) => ({ ...f, publishedYearEnd: e.target.value }))
            }
            placeholder="z. B. 1993"
            inputMode="numeric"
          />
        </Field>
      </div>
    ) : null;

  return (
    <ViewFrame
      title={
        isEdit && parentEntryTitle
          ? "Untereintrag bearbeiten"
          : isEdit
            ? "Eintrag bearbeiten"
            : parentEntryTitle
              ? "Untereintrag anlegen"
              : "Neuer Eintrag"
      }
      description={
        isEdit && parentEntryTitle
          ? `Kapitel oder Abschnitt von „${parentEntryTitle}" — Felder anpassen und speichern`
          : isEdit
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
        {parentEntryTitle && (
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
              {selectableTypes.map((k) => {
                const m = TYPE_META[k];
                const label =
                  isBookChild && k === "text"
                    ? getBookChildTypeLabel()
                    : m.label;
                return (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                );
              })}
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
            {publicationYearFields}
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              Wann das Buch gedruckt wurde — immer n. Chr. (z. B. 1988). Nicht
              verwechseln mit dem historischen Zeitraum unten.
            </p>
          </div>
        )}

        {config.bookMetadataBox && !isBookChild && config.showYears && (
          <div className="space-y-2 rounded-xl border border-border/60 bg-surface-2/30 p-3">
            <p className="text-[0.72rem] font-medium text-muted-foreground">
              Historischer Zeitraum — in welcher Epoche das Buch spielt
            </p>
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              Von und Bis mit v. Chr. oder n. Chr. wählen — z. B. 330 n. Chr.
              bis 1453 n. Chr.
            </p>
            {historicalYearFields}
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
        ) : config.showDateParts && fields.type === "person" ? (
          <PersonLifeDateFields
            birthYear={fields.yearStart}
            birthMonth={fields.birthMonth}
            birthDay={fields.birthDay}
            birthEra={fields.eraStart}
            deathYear={fields.yearEnd}
            deathMonth={fields.deathMonth}
            deathDay={fields.deathDay}
            deathEra={fields.eraEnd}
            onBirthYearChange={(value) =>
              setFields((f) => ({ ...f, yearStart: value }))
            }
            onBirthMonthChange={(value) =>
              setFields((f) => ({ ...f, birthMonth: value }))
            }
            onBirthDayChange={(value) =>
              setFields((f) => ({ ...f, birthDay: value }))
            }
            onBirthEraChange={(value) =>
              setFields((f) => ({ ...f, eraStart: value }))
            }
            onDeathYearChange={(value) =>
              setFields((f) => ({ ...f, yearEnd: value }))
            }
            onDeathMonthChange={(value) =>
              setFields((f) => ({ ...f, deathMonth: value }))
            }
            onDeathDayChange={(value) =>
              setFields((f) => ({ ...f, deathDay: value }))
            }
            onDeathEraChange={(value) =>
              setFields((f) => ({ ...f, eraEnd: value }))
            }
          />
        ) : (
          !config.bookMetadataBox && historicalYearFields
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

        <Button onClick={handleSave} disabled={saving || !formComplete}>
          {saving ? "Speichern…" : isEdit ? "Änderungen speichern" : "Eintrag speichern"}
        </Button>
        {!formComplete && missingLabels.length > 0 && (
          <p className="text-[0.75rem] text-muted-foreground">
            Noch ausfüllen: {missingLabels.join(", ")}
          </p>
        )}
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
