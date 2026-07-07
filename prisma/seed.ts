import "dotenv/config";

import bcrypt from "bcryptjs";
import type {
  Confidence,
  EntryType,
  RelationType,
  SourceType,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { TOPICS } from "../src/lib/constants";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const PASSWORD = "demo123";

const USERS = [
  { email: "max@chronikon.dev", name: "Max F.", avatarInitials: "MF", role: "owner" as const },
  { email: "sarah@chronikon.dev", name: "Sarah K.", avatarInitials: "SK", role: "editor" as const },
  { email: "thomas@chronikon.dev", name: "Thomas R.", avatarInitials: "TR", role: "commenter" as const },
];

const PROJECTS = [
  { slug: "bibel", name: "Frühes Christentum / Bibel", icon: "✦" },
  { slug: "byzanz", name: "Byzantinisches Reich", icon: "◆" },
  { slug: "osmanen", name: "Osmanisches Reich", icon: "☪" },
];

type MockEntry = {
  id: string;
  project: string;
  type: EntryType;
  title: string;
  topics: string[];
  yearStart: number;
  yearEnd: number;
  confidence: Confidence;
  language?: string;
  author?: string;
  place?: string;
  lat?: number;
  lng?: number;
  summary: string;
  body?: string;
  sourceList?: Array<{
    title: string;
    type: SourceType;
    ref?: string;
    note?: string;
    entryId?: string;
  }>;
  claims?: Array<{
    text: string;
    confidence: Confidence;
    basedOn?: string[];
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    label?: string;
  }>;
};

const MOCK_ENTRIES: MockEntry[] = [
  { id: "e1", project: "bibel", type: "text", title: "Evangelium des Thomas", topics: ["Apokryphen"], yearStart: 80, yearEnd: 140, confidence: "disputed", language: "Koptisch (Sahidisch)", author: "Unbekannt", place: "Nag Hammadi", lat: 26.0, lng: 32.7, summary: "Sammlung von 114 Logien — apokryphes Evangelium in koptischer Überlieferung.", attachments: [{ id: "att-e1-1", name: "Codex II — Thomas (Foto).jpg", type: "image", label: "Originalbild" }] },
  { id: "e2", project: "bibel", type: "discovery", title: "Fund Nag Hammadi 1945", topics: ["Funde & Editionen"], yearStart: 1945, yearEnd: 1945, confidence: "verified", place: "Nag Hammadi", lat: 26.0, lng: 32.7, summary: "Bauer fand 13 codices in einer Tonvase nahe Nag Hammadi." },
  { id: "e3", project: "bibel", type: "place", title: "Nag Hammadi", topics: ["Personen & Orte"], yearStart: -500, yearEnd: 2025, confidence: "verified", place: "Nag Hammadi", lat: 26.0, lng: 32.7, summary: "Stadt in Oberägypten am Nil — Fundort der Nag-Hammadi-Bibliothek." },
  { id: "e4", project: "bibel", type: "book", title: "Robinson — The Nag Hammadi Library", topics: ["Funde & Editionen"], yearStart: 1977, yearEnd: 2025, confidence: "verified", author: "James M. Robinson", summary: "Standard-Edition der koptischen Texte aus Nag Hammadi." },
  { id: "e5", project: "bibel", type: "text", title: "Evangelium der Wahrheit", topics: ["Apokryphen"], yearStart: 140, yearEnd: 180, confidence: "likely", language: "Koptisch", place: "Nag Hammadi", lat: 26.0, lng: 32.7, summary: "Valentinianisches Evangelium aus Codex I." },
  { id: "e6", project: "bibel", type: "text", title: "Evangelium des Philippus", topics: ["Apokryphen"], yearStart: 150, yearEnd: 300, confidence: "disputed", language: "Koptisch", place: "Nag Hammadi", lat: 26.0, lng: 32.7, summary: "Apokryphes Evangelium — Datierung umstritten." },
  { id: "e7", project: "bibel", type: "text", title: "Evangelium des Judas", topics: ["Apokryphen"], yearStart: 130, yearEnd: 170, confidence: "likely", language: "Koptisch", place: "El Minya", lat: 28.1, lng: 30.75, summary: "2006 publizierter Codex Tchacos — gnostisches Evangelium." },
  { id: "e8", project: "bibel", type: "text", title: "Brief des Paulus an die Römer", topics: ["Kanon"], yearStart: 55, yearEnd: 58, confidence: "verified", language: "Griechisch", place: "Rom", lat: 41.9, lng: 12.5, summary: "Kanonischer Brief — frühe christliche Theologie." },
  { id: "e9", project: "bibel", type: "text", title: "Evangelium nach Markus", topics: ["Kanon"], yearStart: 65, yearEnd: 75, confidence: "likely", language: "Griechisch", place: "Rom", lat: 41.9, lng: 12.5, summary: "Frühestes synoptisches Evangelium (Mehrheitsposition)." },
  {
    id: "e10", project: "bibel", type: "text", title: "Evangelium nach Johannes", topics: ["Kanon"], yearStart: 90, yearEnd: 110, confidence: "disputed", language: "Griechisch", place: "Ephesus", lat: 37.94, lng: 27.34, summary: "Johanneisches Evangelium — Datierung und Autorschaft umstritten.",
    body: `Das Johannesevangelium unterscheidet sich deutlich von den synoptischen Evangelien — längere Reden, Logos-Theologie, andere Chronologie der Passionsgeschichte.

Meine Einschätzung: Es entstand nicht isoliert, sondern in einer johanneischen Gemeinde, wahrscheinlich in Kleinasien (Ephesus wird am häufigsten genannt — aber das ist nicht gesichert).

Was ich noch klären will: Wie passt die johanneische Theologie zu den Paulusbriefen? Und welche griechischen Handschriften sind für den kritischen Text am wichtigsten?`,
    sourceList: [
      { title: "Papyrus P66", type: "primary", ref: "ca. 200 n.Chr.", note: "Frühe griechische Handschrift, Bodmer-Bibliothek" },
      { title: "Papyrus P75", type: "primary", ref: "ca. 175–225 n.Chr.", note: "Enge Verwandtschaft mit Codex Vaticanus" },
      { title: "Bauckham — Jesus and the Eyewitnesses", type: "secondary", ref: "2007, S. 390–411", note: "Argument für johanneische Gemeinde als Urheber" },
      { title: "Schnelle — Einleitung in das Neue Testament", type: "secondary", ref: "8. Aufl., § 42", note: "Standardwerk Datierung 90–110 n.Chr." },
    ],
    claims: [
      { text: "Entstehung in einer johanneischen Gemeinde in Kleinasien", confidence: "likely" },
      { text: 'Einzelner Autor „Johannes"', confidence: "disputed" },
      { text: "Abhängigkeit von den Synoptikern", confidence: "disputed" },
    ],
  },
  { id: "e11", project: "bibel", type: "person", title: "Paulus von Tarsus", topics: ["Personen & Orte"], yearStart: 5, yearEnd: 67, confidence: "verified", place: "Tarsus", lat: 36.92, lng: 34.85, summary: "Apostel — zentral für frühchristliche Briefliteratur." },
  { id: "e12", project: "bibel", type: "person", title: "James M. Robinson", topics: ["Funde & Editionen"], yearStart: 1924, yearEnd: 2016, confidence: "verified", summary: "Herausgeber der Nag-Hammadi-Bibliothek." },
  { id: "e13", project: "bibel", type: "place", title: "Alexandria", topics: ["Personen & Orte"], yearStart: -331, yearEnd: 2025, confidence: "verified", lat: 31.2, lng: 29.9, summary: "Antikes Zentrum — Theologie, Philo, koptische Kirche." },
  { id: "e14", project: "bibel", type: "place", title: "Jerusalem", topics: ["Personen & Orte"], yearStart: -1000, yearEnd: 2025, confidence: "verified", lat: 31.77, lng: 35.21, summary: "Zentrum des frühen Christentums und der Urgemeinde." },
  { id: "e15", project: "bibel", type: "note", title: "Logion 114 — Übersetzungsvergleich", topics: ["Übersetzungen"], yearStart: 80, yearEnd: 140, confidence: "disputed", language: "Koptisch", summary: "Vergleich Robinson (1988) vs. Plisch (2007) — mehrdeutiger koptischer Text." },
  { id: "e16", project: "bibel", type: "book", title: "Plisch — Das Thomasevangelium", topics: ["Übersetzungen"], yearStart: 2007, yearEnd: 2025, confidence: "verified", author: "Uwe-Karsten Plisch", summary: "Deutsche Übersetzung und Kommentar zum Thomas-Evangelium." },
  { id: "e17", project: "bibel", type: "discovery", title: "Codex Tchacos (Judas-Evangelium)", topics: ["Funde & Editionen"], yearStart: 1970, yearEnd: 1970, confidence: "verified", place: "El Minya", lat: 28.1, lng: 30.75, summary: "1970er Fund in Ägypten — erst 2006 publiziert." },
  { id: "e18", project: "bibel", type: "text", title: "Apostolisches Vater: Didache", topics: ["Kanon"], yearStart: 50, yearEnd: 120, confidence: "likely", language: "Griechisch", place: "Syrien", lat: 35.0, lng: 38.0, summary: 'Frühchristliche Weisungschrift — „Zwei Wege"-Lehre.' },
  { id: "e19", project: "bibel", type: "text", title: "Shepherd of Hermas", topics: ["Apokryphen"], yearStart: 100, yearEnd: 160, confidence: "likely", language: "Griechisch", place: "Rom", lat: 41.9, lng: 12.5, summary: "Apokryphe Schrift — in Codex Sinaiticus enthalten." },
  { id: "e20", project: "bibel", type: "text", title: "Evangelium der Hebräer", topics: ["Apokryphen"], yearStart: 80, yearEnd: 100, confidence: "unknown", language: "Aramäisch (?)", place: "Jerusalem", lat: 31.77, lng: 35.21, summary: "Nur Fragmente und Zitate — Original verloren." },
  { id: "b1", project: "byzanz", type: "person", title: "Konstantin I.", topics: ["Kaiser"], yearStart: 272, yearEnd: 337, confidence: "verified", place: "Konstantinopel", lat: 41.01, lng: 28.98, summary: "Gründete Konstantinopel 330 — Christentum legalisiert." },
  { id: "b2", project: "byzanz", type: "place", title: "Konstantinopel", topics: ["Orte"], yearStart: 330, yearEnd: 1453, confidence: "verified", lat: 41.01, lng: 28.98, summary: "Hauptstadt des Byzantinischen Reiches." },
  {
    id: "b3", project: "byzanz", type: "book", title: "Norwich — Byzanz: Der Aufstieg", topics: ["Quellen"], yearStart: 1988, yearEnd: 2025, confidence: "verified", author: "John Julius Norwich", summary: "Populärwissenschaftliche Darstellung — Band 1.",
    body: `Das ist mein Einstiegsbuch für Byzanz. Norwich schreibt unterhaltsam und erzählerisch — aber man muss wissen, woher seine Geschichten kommen.

Norwichs Erzählungen über die Zeit Justinians (Gotenkriege, Perserkriege, Nika-Aufstand) basieren vor allem auf Prokop von Caesarea — das ist die wichtigste Primärquelle für diese Epoche. Für Konstantin und die frühen Kaiser nutzt er Eusebius, Ammianus Marcellinus und spätere Byzantinisten wie Agathias.

Wichtig: Norwich interpretiert und verdichtet. Er ist Sekundärliteratur — wenn ich etwas als „gesichert" markieren will, muss ich bei Prokop & Co. nachschauen, nicht nur bei Norwich stehen bleiben.`,
    sourceList: [
      { title: "Norwich — Byzanz: Der Aufstieg", type: "secondary", ref: "Band 1, 1988", note: "Das Buch selbst — Ausgangspunkt meiner Lektüre" },
      { title: "Prokop — Geschichte der Kriege", type: "primary", entryId: "b5", note: "Norwichs Hauptquelle für Justinian-Epoche; Kriegsschilderungen fast durchgehend von hier" },
      { title: "Eusebius — Kirchengeschichte", type: "primary", ref: "Buch X", note: "Konstantin-Darstellung bei Norwich" },
      { title: "Agathias — Geschichte", type: "primary", ref: "5. Jh.", note: "Spätere byzantinische Historiographie, von Norwich zitiert" },
      { title: "Ammianus Marcellinus — Res gestae", type: "primary", ref: "4. Jh.", note: "Spätantike, Übergang zu Byzanz" },
      { title: "Browning — The Byzantine Empire", type: "secondary", ref: "1980", note: "Akademischere Alternative zu Norwich — zum Gegenchecken" },
    ],
    claims: [
      { text: "Norwichs Schilderung der Gotenkriege basiert auf Prokop", confidence: "verified", basedOn: ["b5"] },
      { text: "Norwich interpretiert Prokop teilweise dramatischer als im Original", confidence: "likely", basedOn: ["b5"] },
      { text: "Konstantin-Darstellung stützt sich auf Eusebius", confidence: "likely" },
    ],
    attachments: [
      { id: "att-b3-1", name: "Norwich — Byzanz Band 1.pdf", type: "pdf", label: "Haupt-PDF" },
      { id: "att-b3-2", name: "Inhaltsverzeichnis — Scan.jpg", type: "image", label: "Später hinzugefügt" },
    ],
  },
  { id: "b4", project: "byzanz", type: "person", title: "Justinian I.", topics: ["Kaiser"], yearStart: 482, yearEnd: 565, confidence: "verified", place: "Konstantinopel", lat: 41.01, lng: 28.98, summary: "Kaiser — Corpus iuris civilis, Hagia Sophia." },
  {
    id: "b5", project: "byzanz", type: "text", title: "Prokop — Geschichte der Kriege", topics: ["Quellen"], yearStart: 545, yearEnd: 553, confidence: "verified", language: "Griechisch", place: "Konstantinopel", lat: 41.01, lng: 28.98, summary: "Primärquelle — Perser- und Gotenkriege.",
    body: `Prokop von Caesarea war ein zeitgenössischer Historiker am Hof Justinians. Seine „Geschichte der Kriege" (De bellis) ist die wichtigste Quelle für die Feldzüge des Belisar.

Norwich liest Prokop und erzählt daraus — wer Norwich liest, sollte wissen, dass die eigentliche Quelle Prokop ist. Direkt hier kann ich die Originalpassagen mit Norwichs Wiedergabe vergleichen.`,
    sourceList: [
      { title: "Prokop — De bellis (Griechisch)", type: "primary", ref: "8 Bücher", note: "Original — Loeb Classical Library Edition" },
      { title: "Prokop — Kriegsgeschichte (Dewing Übers.)", type: "secondary", ref: "Loeb, 1914–1940", note: "Englische Standardübersetzung" },
    ],
    claims: [
      { text: "Prokop war Augenzeuge bzw. Hofhistoriker Justinians", confidence: "verified" },
      { text: "Gotenkriege und Perserkriege sind hier aus erster Hand dokumentiert", confidence: "verified" },
    ],
  },
  { id: "b6", project: "byzanz", type: "discovery", title: "Fund der Hagia Sophia Inschriften", topics: ["Quellen"], yearStart: 1935, yearEnd: 1935, confidence: "verified", place: "Konstantinopel", lat: 41.01, lng: 28.98, summary: "Restaurierungsarbeiten brachten frühbyzantinische Inschriften zutage." },
  { id: "o1", project: "osmanen", type: "person", title: "Mehmed II.", topics: ["Sultane"], yearStart: 1432, yearEnd: 1481, confidence: "verified", place: "Konstantinopel", lat: 41.01, lng: 28.98, summary: "Eroberte Konstantinopel 1453 — Ende des Byzantinischen Reiches." },
  { id: "o2", project: "osmanen", type: "place", title: "Istanbul", topics: ["Orte"], yearStart: 1453, yearEnd: 2025, confidence: "verified", lat: 41.01, lng: 28.98, summary: "Ehemaliges Konstantinopel — Hauptstadt des Osmanischen Reichs." },
  { id: "o3", project: "osmanen", type: "text", title: "Eroberung von Konstantinopel (1453)", topics: ["Eroberungen"], yearStart: 1453, yearEnd: 1453, confidence: "verified", language: "Osmantürkisch / Arabisch", summary: "Belagerung und Fall der byzantinischen Hauptstadt unter Mehmed II." },
];

const MOCK_RELATIONS: { from: string; to: string; type: RelationType }[] = [
  { from: "e1", to: "e3", type: "found_at" },
  { from: "e1", to: "e2", type: "discovered_in" },
  { from: "e1", to: "e4", type: "edited_in" },
  { from: "e1", to: "e15", type: "discussed_in" },
  { from: "e1", to: "e16", type: "translated_in" },
  { from: "e2", to: "e3", type: "located_at" },
  { from: "e5", to: "e3", type: "found_at" },
  { from: "e6", to: "e3", type: "found_at" },
  { from: "e7", to: "e17", type: "discovered_in" },
  { from: "e11", to: "e8", type: "authored" },
  { from: "e12", to: "e4", type: "authored" },
  { from: "e10", to: "e13", type: "associated_with" },
  { from: "b1", to: "b2", type: "founded" },
  { from: "b4", to: "b2", type: "ruled_in" },
  { from: "b5", to: "b4", type: "contemporary" },
  { from: "b3", to: "b5", type: "based_on" },
  { from: "b3", to: "b1", type: "discusses" },
  { from: "b3", to: "b4", type: "discusses" },
  { from: "b5", to: "b3", type: "cited_in" },
  { from: "b2", to: "o3", type: "contemporary" },
  { from: "o1", to: "o3", type: "associated_with" },
  { from: "o3", to: "b2", type: "discusses" },
];

const MOCK_QUESTIONS = [
  { id: "q1", entryId: "e1", author: "Sarah K.", status: "open" as const, category: "Übersetzung", text: "Stimmt die deutsche Übersetzung von Logion 114 mit Robinson (1988) überein?", passage: "Logion 114" },
  { id: "q2", entryId: "e1", author: "Max F.", status: "resolved" as const, category: "Datierung", text: "Ist die Datierung 80–140 n.Chr. noch aktuell?", answer: "Plisch (2007) tendiert zu früher Datierung — als likely markiert." },
  { id: "q3", entryId: "e10", author: "Thomas R.", status: "open" as const, category: "Autorschaft", text: "Johanneische Schule vs. einzelner Autor — welche Position bevorzugen wir?" },
  { id: "q4", entryId: "e6", author: "Sarah K.", status: "open" as const, category: "Datierung", text: "Späte Datierung (3. Jh.) vs. frühe (2. Jh.) — was sagt die Sekundärliteratur?" },
  { id: "q5", entryId: "e20", author: "Max F.", status: "open" as const, category: "Authentizität", text: "Gibt es neue Fragmente zum Hebräerevangelium seit 2010?" },
  { id: "q6", entryId: "e15", author: "Sarah K.", status: "open" as const, category: "Übersetzung", text: "Robinson vs. Plisch bei Logion 114 — welche Version für unser Projekt?", passage: "Logion 114" },
  { id: "q7", entryId: "b3", author: "Max F.", status: "open" as const, category: "Quellenkritik", text: "Wo weicht Norwichs Darstellung des Nika-Aufstands von Prokop ab?", passage: "Kap. Justinian" },
];

const MOCK_COMMENTS = [
  { id: "c1", entryId: "e1", author: "Sarah K.", text: 'Der koptische Text bei Logion 114 ist mehrdeutig — Robinson interpretiert „Weib" als metaphorisch.' },
  { id: "c2", entryId: "e1", author: "Max F.", text: "Plisch (2007), S. 452 — konservativere Wiedergabe. Quelle verlinkt." },
  { id: "c3", entryId: "e10", author: "Thomas R.", text: "Bauckham (2007) argumentiert für johanneische Gemeinde als Autor." },
];

const SAVED_VIEWS = [
  { id: "sv1", label: "Offene Fragen", filter: { hasQuestions: true } },
  { id: "sv2", label: "Unsichere Datierungen", filter: { confidence: ["disputed", "unknown"] } },
  { id: "sv3", label: "Apokryphen 1.–3. Jh.", filter: { topic: "Apokryphen", yearMax: 300 } },
  { id: "sv4", label: "Funde in Ägypten", filter: { type: "discovery" } },
  { id: "sv5", label: "Ohne Primärquelle", filter: { sourcesMax: 1 } },
];

async function main() {
  console.log("Seeding Chronikon…");

  await db.comment.deleteMany();
  await db.answer.deleteMany();
  await db.question.deleteMany();
  await db.entryRelation.deleteMany();
  await db.claim.deleteMany();
  await db.source.deleteMany();
  await db.attachment.deleteMany();
  await db.entryTopic.deleteMany();
  await db.entryVersion.deleteMany();
  await db.compareItem.deleteMany();
  await db.compareSet.deleteMany();
  await db.entry.deleteMany();
  await db.savedView.deleteMany();
  await db.topic.deleteMany();
  await db.projectMember.deleteMany();
  await db.projectInvite.deleteMany();
  await db.project.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.notification.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const userMap = new Map<string, string>();

  for (const u of USERS) {
    const user = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        avatarInitials: u.avatarInitials,
      },
    });
    userMap.set(u.name, user.id);
  }

  const projectMap = new Map<string, string>();

  for (const p of PROJECTS) {
    const project = await db.project.create({ data: p });
    projectMap.set(p.slug, project.id);

    for (const topicName of TOPICS[p.slug] ?? []) {
      await db.topic.create({
        data: { projectId: project.id, name: topicName },
      });
    }

    for (const u of USERS) {
      await db.projectMember.create({
        data: {
          projectId: project.id,
          userId: userMap.get(u.name)!,
          role: u.role,
        },
      });
    }
  }

  const bibelId = projectMap.get("bibel")!;
  for (const sv of SAVED_VIEWS) {
    await db.savedView.create({
      data: {
        projectId: bibelId,
        label: sv.label,
        filter: sv.filter,
        createdBy: userMap.get("Max F."),
      },
    });
  }

  const entryMap = new Map<string, string>();
  const maxUserId = userMap.get("Max F.")!;

  for (const mock of MOCK_ENTRIES) {
    const projectId = projectMap.get(mock.project)!;
    const entry = await db.entry.create({
      data: {
        projectId,
        legacyId: mock.id,
        type: mock.type,
        title: mock.title,
        summary: mock.summary,
        body: mock.body,
        yearStart: mock.yearStart,
        yearEnd: mock.yearEnd,
        confidence: mock.confidence,
        language: mock.language,
        author: mock.author,
        placeName: mock.place,
        lat: mock.lat,
        lng: mock.lng,
        createdById: maxUserId,
      },
    });
    entryMap.set(mock.id, entry.id);

    for (const topicName of mock.topics) {
      const topic = await db.topic.findUnique({
        where: { projectId_name: { projectId, name: topicName } },
      });
      if (topic) {
        await db.entryTopic.create({
          data: { entryId: entry.id, topicId: topic.id },
        });
      }
    }

    if (mock.sourceList) {
      for (const src of mock.sourceList) {
        await db.source.create({
          data: {
            entryId: entry.id,
            type: src.type,
            title: src.title,
            ref: src.ref,
            note: src.note,
            linkedEntryId: src.entryId ? entryMap.get(src.entryId) : undefined,
          },
        });
      }
    }

    if (mock.claims) {
      for (const claim of mock.claims) {
        await db.claim.create({
          data: {
            entryId: entry.id,
            text: claim.text,
            confidence: claim.confidence,
            basedOnIds: [],
            authorId: maxUserId,
          },
        });
      }
    }

    if (mock.attachments) {
      for (const att of mock.attachments) {
        const mime = att.type === "pdf" ? "application/pdf" : "image/jpeg";
        await db.attachment.create({
          data: {
            entryId: entry.id,
            name: att.name,
            mimeType: mime,
            storageKey: `seed/${att.id}`,
            publicUrl: null,
            label: att.label,
            ocrStatus: "mock",
            uploadedById: maxUserId,
          },
        });
      }
    }
  }

  for (const rel of MOCK_RELATIONS) {
    const fromId = entryMap.get(rel.from);
    const toId = entryMap.get(rel.to);
    if (fromId && toId) {
      await db.entryRelation.create({
        data: { fromEntryId: fromId, toEntryId: toId, type: rel.type },
      });
    }
  }

  // Second pass: link sources and claim basedOn after all entries exist
  for (const mock of MOCK_ENTRIES) {
    const entryId = entryMap.get(mock.id)!;
    if (mock.sourceList) {
      for (const src of mock.sourceList) {
        if (!src.entryId) continue;
        const linkedId = entryMap.get(src.entryId);
        if (!linkedId) continue;
        await db.source.updateMany({
          where: { entryId, title: src.title },
          data: { linkedEntryId: linkedId },
        });
      }
    }
    if (mock.claims) {
      const claims = await db.claim.findMany({ where: { entryId } });
      for (let i = 0; i < mock.claims.length; i++) {
        const claim = mock.claims[i];
        const basedOnIds = (claim.basedOn ?? [])
          .map((lid) => entryMap.get(lid))
          .filter(Boolean) as string[];
        if (basedOnIds.length && claims[i]) {
          await db.claim.update({
            where: { id: claims[i].id },
            data: { basedOnIds },
          });
        }
      }
    }
  }

  for (const q of MOCK_QUESTIONS) {
    const entryId = entryMap.get(q.entryId);
    const authorId = userMap.get(q.author);
    if (!entryId || !authorId) continue;

    const question = await db.question.create({
      data: {
        entryId,
        authorId,
        status: q.status,
        category: q.category,
        text: q.text,
        passageRef: q.passage ?? null,
      },
    });

    if (q.answer) {
      await db.answer.create({
        data: {
          questionId: question.id,
          authorId: userMap.get("Max F.")!,
          text: q.answer,
        },
      });
    }
  }

  for (const c of MOCK_COMMENTS) {
    const entryId = entryMap.get(c.entryId);
    const authorId = userMap.get(c.author);
    if (!entryId || !authorId) continue;

    await db.comment.create({
      data: { entryId, authorId, text: c.text },
    });
  }

  const compareSet = await db.compareSet.create({
    data: {
      projectId: bibelId,
      title: "Logion 114 — Robinson vs. Plisch",
    },
  });

  await db.compareItem.createMany({
    data: [
      {
        compareSetId: compareSet.id,
        entryId: entryMap.get("e15"),
        label: "Robinson (1988)",
        sortOrder: 0,
        content: `Logion 114 (Robinson 1988):
Simon Petrus sprach zu ihnen: „Lasst Maria von uns gehen, denn Frauen sind des Lebens nicht würdig."
Jesus sprach: „Siehe, ich werde sie leiten, damit ich sie männlich mache, damit sie auch ein lebendiger Geist werde wie ihr Männer."`,
      },
      {
        compareSetId: compareSet.id,
        entryId: entryMap.get("e16"),
        label: "Plisch (2007)",
        sortOrder: 1,
        content: `Logion 114 (Plisch 2007):
Simon Petrus sagte zu ihnen: „Lasst Mariam von uns weggehen, denn Frauen sind nicht würdig, das Leben zu empfangen."
Jesus sagte: „Siehe, ich werde sie leiten, damit ich sie männlich mache, damit sie auch ein lebendiger Geist werde wie ihr Männer."`,
      },
    ],
  });

  const maxId = userMap.get("Max F.")!;
  const sarahId = userMap.get("Sarah K.")!;
  const thomasId = userMap.get("Thomas R.")!;
  const bibelSlug = "bibel";
  const e1Id = entryMap.get("e1");
  const b3Id = entryMap.get("b3");

  await db.notification.createMany({
    data: [
      {
        userId: maxId,
        type: "question",
        title: 'Neue Frage zu „Evangelium des Thomas"',
        body: "Stimmt die deutsche Übersetzung von Logion 114 mit Robinson (1988) überein?",
        link: `/p/${bibelSlug}?entry=${e1Id}&tab=diskussion`,
        read: false,
      },
      {
        userId: maxId,
        type: "comment",
        title: 'Neuer Kommentar zu „Evangelium des Thomas"',
        body: "Der koptische Text bei Logion 114 ist mehrdeutig…",
        link: `/p/${bibelSlug}?entry=${e1Id}&tab=diskussion`,
        read: false,
      },
      {
        userId: maxId,
        type: "entry_edited",
        title: 'Eintrag bearbeitet: „Norwich — Byzanz: Der Aufstieg"',
        body: "Sarah K. hat den Eintrag aktualisiert",
        link: `/p/byzanz?entry=${b3Id}`,
        read: true,
      },
      {
        userId: sarahId,
        type: "mention",
        title: "Max F. hat dich erwähnt",
        body: "@Sarah — kannst du die Prokop-Stelle prüfen?",
        link: `/p/byzanz?entry=${b3Id}&tab=diskussion`,
        read: false,
      },
      {
        userId: thomasId,
        type: "answer",
        title: 'Antwort auf Frage zu „Evangelium nach Johannes"',
        body: "Bauckham (2007) argumentiert für johanneische Gemeinde…",
        link: `/p/${bibelSlug}?entry=${entryMap.get("e10")}&tab=diskussion`,
        read: false,
      },
    ],
  });

  console.log("Seed abgeschlossen.");
  console.log("Demo-Login: max@chronikon.dev / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
