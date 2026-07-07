export type DocumentAnalysis = {
  reply: string;
  evidence: string;
  suggestion: {
    fields: Record<string, string>;
    note?: string;
  };
};

export type EntryReviewSuggestion = {
  type: "relation" | "confidence" | "year" | "topic" | "note";
  title: string;
  text: string;
  detail?: string;
  payload?: Record<string, unknown>;
};

export type ProjectContext = {
  slug: string;
  name: string;
  topics?: string[];
};

export type EntryForReview = {
  id: string;
  title: string;
  type: string;
  yearStart: number;
  yearEnd: number;
  confidence: string;
  body?: string | null;
  summary?: string | null;
};

function isMockMode(): boolean {
  return (
    process.env.AI_MOCK_MODE === "true" ||
    !process.env.OPENAI_API_KEY?.trim()
  );
}

function mockAnalyzeDocument(
  text: string,
  filename: string,
  projectContext?: ProjectContext,
): DocumentAnalysis {
  const n = filename.toLowerCase();
  const ctx = projectContext?.slug ?? "bibel";

  if (/norwich|byzanz/.test(n)) {
    return {
      reply:
        "Ich habe das Dokument gelesen. Es handelt sich um ein Sachbuch (Sekundärliteratur).",
      evidence:
        'Titelseite/Inhaltsverzeichnis: „Byzanz" — John Julius Norwich, Band 1',
      suggestion: {
        fields: {
          type: "book",
          title: "Norwich — Byzanz: Der Aufstieg",
          yearStart: "1988",
          yearEnd: "2025",
          confidence: "verified",
          topic: ctx === "byzanz" ? "Quellen" : "Sonstige",
          summary: "Populärwissenschaft — Band 1, Aufstieg des Reichs",
          body: "Auf dem Dokument erkennbar: Norwich als Autor. Im Vorwort verweist er auf Prokop als Hauptquelle für die Justinian-Zeit. Nicht als Primärquelle behandeln.",
        },
        note: "Separaten Eintrag für Prokop anlegen und verknüpfen.",
      },
    };
  }

  if (/thomas|evangelium|nag|hammadi|codex/.test(n)) {
    return {
      reply: "Koptischer Text erkannt — vermutlich apokryphes Evangelium.",
      evidence: "Schriftbild / Dateiname deutet auf Nag-Hammadi-Material",
      suggestion: {
        fields: {
          type: "text",
          title: "Evangelium des Thomas (koptisch)",
          yearStart: "80",
          yearEnd: "140",
          confidence: "disputed",
          topic: "Apokryphen",
          placeName: "Nag Hammadi",
          body: "Koptische Überlieferung. Datierung unsicher — als disputed markieren.",
        },
      },
    };
  }

  if (/prokop|bellis|krieg/.test(n)) {
    return {
      reply: "Historiographischer Text — Primärquelle (griechisch, 6. Jh.).",
      evidence: "Prokop — De bellis / Kriegsgeschichte",
      suggestion: {
        fields: {
          type: "text",
          title: "Prokop — Geschichte der Kriege",
          yearStart: "545",
          yearEnd: "553",
          confidence: "verified",
          topic: ctx === "byzanz" ? "Quellen" : "Sonstige",
          body: "Primärquelle am Hof Justinians. Sekundärliteratur bezieht sich hierauf.",
        },
      },
    };
  }

  return {
    reply:
      "Dokument erhalten. Ich konnte den Inhalt nicht eindeutig zuordnen — bitte prüfe die Vorschläge manuell.",
    evidence: filename || text.slice(0, 120),
    suggestion: {
      fields: { confidence: "unknown", topic: "Sonstige" },
      note: "Bessere Scan-Qualität oder PDF mit Textschicht verbessert die Erkennung.",
    },
  };
}

async function openAiAnalyzeDocument(
  text: string,
  filename: string,
  projectContext?: ProjectContext,
): Promise<DocumentAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const excerpt = text.slice(0, 8000);
  const prompt = `Analysiere dieses historisches Dokument für das Projekt "${projectContext?.name ?? "Chronikon"}".
Dateiname: ${filename}
Inhalt (Auszug):
${excerpt}

Antworte als JSON mit keys: reply, evidence, suggestion (fields als key-value, optional note).
Felder: type (book|text|person|place|discovery|note), title, yearStart, yearEnd, confidence, topic, placeName, summary, body.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI-Anfrage fehlgeschlagen: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Leere OpenAI-Antwort");

  return JSON.parse(content) as DocumentAnalysis;
}

function mockReviewEntry(
  entry: EntryForReview,
  projectEntries: EntryForReview[],
): EntryReviewSuggestion[] {
  const suggestions: EntryReviewSuggestion[] = [];
  const title = entry.title.toLowerCase();

  const norwich = projectEntries.find((e) => /norwich.*byzanz/i.test(e.title));
  const prokop = projectEntries.find((e) => /prokop/i.test(e.title));

  if (/prokop/i.test(entry.title) && norwich) {
    suggestions.push({
      type: "relation",
      title: "Verknüpfung anlegen",
      text: `„${norwich.title}" basiert vermutlich auf Primärquellen. Soll „${entry.title}" verknüpft werden?`,
      detail: "Relation: basiert auf",
      payload: {
        fromEntryId: norwich.id,
        toEntryId: entry.id,
        relationType: "based_on",
      },
    });
  }

  if (/norwich|byzanz/i.test(entry.title) && prokop) {
    suggestions.push({
      type: "relation",
      title: "Quellenkette ergänzen",
      text: `„${prokop.title}" existiert bereits. Explizite Verknüpfung fehlt möglicherweise.`,
      payload: {
        fromEntryId: entry.id,
        toEntryId: prokop.id,
        relationType: "based_on",
      },
    });
  }

  if (/thomas|evangelium/i.test(entry.title)) {
    const nag = projectEntries.find((e) => /nag hammadi/i.test(e.title));
    if (nag) {
      suggestions.push({
        type: "relation",
        title: "Fundort verknüpfen",
        text: `Text „${entry.title}" — Verknüpfung mit „${nag.title}" vorschlagen?`,
        payload: {
          fromEntryId: entry.id,
          toEntryId: nag.id,
          relationType: "found_at",
        },
      });
    }
  }

  if (entry.yearStart > entry.yearEnd) {
    suggestions.push({
      type: "year",
      title: "Zeitraum korrigieren",
      text: '„Von" ist größer als „bis" — möglicher Tippfehler.',
      payload: {
        yearStart: entry.yearEnd,
        yearEnd: entry.yearStart,
      },
    });
  }

  if (entry.confidence === "verified" && !entry.summary?.trim()) {
    suggestions.push({
      type: "confidence",
      title: "Confidence anpassen",
      text: 'Als „gesichert" markiert, aber wenig Kontext — prüfen ob Quellen vorliegen.',
      payload: { confidence: "likely" },
    });
  }

  return suggestions;
}

async function openAiReviewEntry(
  entry: EntryForReview,
  projectEntries: EntryForReview[],
): Promise<EntryReviewSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const context = projectEntries
    .slice(0, 30)
    .map((e) => `- ${e.id}: ${e.title} (${e.type}, ${e.yearStart}–${e.yearEnd})`)
    .join("\n");

  const prompt = `Prüfe diesen historischen Eintrag und schlage Verbesserungen vor.
Eintrag: ${JSON.stringify(entry)}
Andere Projekt-Einträge:
${context}

Antworte als JSON-Array mit Objekten: type (relation|confidence|year|topic|note), title, text, detail?, payload?`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI-Anfrage fehlgeschlagen: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content) as
    | EntryReviewSuggestion[]
    | { suggestions: EntryReviewSuggestion[] };
  return Array.isArray(parsed) ? parsed : (parsed.suggestions ?? []);
}

export async function analyzeDocument(
  text: string,
  filename: string,
  projectContext?: ProjectContext,
): Promise<DocumentAnalysis> {
  if (isMockMode()) {
    return mockAnalyzeDocument(text, filename, projectContext);
  }
  return openAiAnalyzeDocument(text, filename, projectContext);
}

export async function reviewEntry(
  entry: EntryForReview,
  projectEntries: EntryForReview[],
): Promise<EntryReviewSuggestion[]> {
  if (isMockMode()) {
    return mockReviewEntry(entry, projectEntries);
  }
  return openAiReviewEntry(entry, projectEntries);
}
