import JSZip from "jszip";

import { CONF_META, TYPE_META } from "@/lib/constants";
import { db } from "@/lib/db";

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, "_").slice(0, 80);
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} v.Chr.`;
  return `${year} n.Chr.`;
}

function entryMarkdown(
  entry: {
    title: string;
    type: keyof typeof TYPE_META;
    summary: string | null;
    body: string | null;
    yearStart: number;
    yearEnd: number;
    confidence: keyof typeof CONF_META;
    author: string | null;
    language: string | null;
    placeName: string | null;
    topics: { topic: { name: string } }[];
    parentEntry: { title: string } | null;
    sources: { title: string; ref: string | null }[];
  },
  projectName: string,
): string {
  const lines: string[] = [
    `# ${entry.title}`,
    "",
    `*Projekt: ${projectName}*`,
    "",
    `- **Typ:** ${TYPE_META[entry.type].label}`,
    `- **Zeitraum:** ${formatYear(entry.yearStart)} – ${formatYear(entry.yearEnd)}`,
    `- **Einordnung:** ${CONF_META[entry.confidence].label}`,
  ];

  if (entry.parentEntry) {
    lines.push(`- **Übergeordnet:** ${entry.parentEntry.title}`);
  }
  if (entry.author) lines.push(`- **Autor:** ${entry.author}`);
  if (entry.language) lines.push(`- **Sprache:** ${entry.language}`);
  if (entry.placeName) lines.push(`- **Ort:** ${entry.placeName}`);
  if (entry.topics.length) {
    lines.push(
      `- **Themen:** ${entry.topics.map((t) => t.topic.name).join(", ")}`,
    );
  }

  if (entry.summary) {
    lines.push("", "## Zusammenfassung", "", entry.summary);
  }
  if (entry.body) {
    lines.push("", "## Inhalt", "", entry.body);
  }
  if (entry.sources.length) {
    lines.push("", "## Quellen");
    for (const s of entry.sources) {
      lines.push(`- ${s.title}${s.ref ? ` (${s.ref})` : ""}`);
    }
  }

  return lines.join("\n");
}

const README = `Chronikon — Wissensexport
========================

Dieses ZIP enthält alle Einträge und extrahierten OCR-Texte eines Ober-Themas.

Struktur:
  manifest.json   — Übersicht aller Dateien
  entries/        — Ein Eintrag pro Markdown-Datei
  ocr/            — Extrahierter Text aus PDF-Anhängen (falls vorhanden)

So nutzen Sie es mit externer KI (ChatGPT, Claude, …):
  1. ZIP entpacken
  2. Relevante Dateien aus entries/ und ocr/ öffnen
  3. In Chronikon unter Export → KI-Vorlage kopieren
  4. Vorlage + Dateiinhalte in die Online-KI einfügen

Chronikon speichert kein KI-Gespräch — alles bleibt bei Ihnen.
`;

export async function buildProjectKnowledgeZip(projectId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      entries: {
        include: {
          topics: { include: { topic: true } },
          attachments: true,
          sources: true,
          parentEntry: { select: { title: true } },
        },
        orderBy: [{ parentEntryId: "asc" }, { title: "asc" }],
      },
    },
  });

  if (!project) throw new Error("Projekt nicht gefunden");

  const zip = new JSZip();
  const entryList: {
    id: string;
    title: string;
    type: string;
    file: string;
    yearStart: number;
    yearEnd: number;
    parentEntryId: string | null;
    ocrFiles: string[];
  }[] = [];

  const ocrFiles: { path: string; entryId: string; attachmentName: string }[] =
    [];

  for (const entry of project.entries) {
    const mdFile = `entries/${entry.id}-${safeFilename(entry.title)}.md`;
    zip.file(mdFile, entryMarkdown(entry, project.name));

    const entryOcr: string[] = [];
    for (const att of entry.attachments) {
      if (!att.extractedText?.trim()) continue;
      const ocrPath = `ocr/${entry.id}-${safeFilename(att.name)}.txt`;
      zip.file(ocrPath, att.extractedText);
      entryOcr.push(ocrPath);
      ocrFiles.push({
        path: ocrPath,
        entryId: entry.id,
        attachmentName: att.name,
      });
    }

    entryList.push({
      id: entry.id,
      title: entry.title,
      type: entry.type,
      file: mdFile,
      yearStart: entry.yearStart,
      yearEnd: entry.yearEnd,
      parentEntryId: entry.parentEntryId,
      ocrFiles: entryOcr,
    });
  }

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        projectName: project.name,
        slug: project.slug,
        exportedAt: new Date().toISOString(),
        entryCount: entryList.length,
        ocrFileCount: ocrFiles.length,
        entries: entryList,
        ocrFiles,
      },
      null,
      2,
    ),
  );

  zip.file("README.txt", README);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return {
    buffer,
    filename: `chronikon-${project.slug}-wissen.zip`,
  };
}
