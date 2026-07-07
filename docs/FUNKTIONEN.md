# Chronikon — Funktionsübersicht

Stand: Phase 1 — Buch/PDF-Grundlagen, Detail-Kern/Material/Offen.

Legende: ✅ funktioniert · ⚠️ teilweise · ❌ fehlt / kaputt

```
Chronikon
├── Auth & Zugang
│   ├── ✅ Login / Logout (NextAuth)
│   ├── ✅ Registrierung (nur per Einladung)
│   ├── ✅ Einladungslinks (User + Projekt)
│   └── ✅ Admin: Nutzer verwalten, Nutzer löschen
│
├── Ober-Themen (Projekte)
│   ├── ✅ Anlegen, Wechseln, Löschen (Owner/Admin)
│   ├── ✅ Team & Rollen (owner, editor, commenter, viewer)
│   └── ✅ System-Übersicht (Admin)
│
├── Einträge (6 Typen)
│   ├── ✅ Buch — PDF Pflicht bei Anlage, Untereinträge mit Seitenzahlen
│   ├── ✅ Text, Person, Ort, Fund, Notiz
│   ├── ✅ CRUD (Erstellen, Bearbeiten, Löschen)
│   ├── ✅ Filter (Typ, Thema, Confidence, Gespeicherte Ansichten)
│   ├── ✅ Typ-Hinweis beim Anlegen
│   └── ✅ „Für Online-KI" in Detailansicht (Text + Vorlage kopieren)
│
├── Inhalt pro Eintrag
│   ├── ✅ Detail: Kern / Material / Offen
│   ├── ✅ Markdown-Body, Zusammenfassung, Metadaten
│   ├── ✅ Seiten (pageStart/pageEnd) für Buch-Untereinträge
│   ├── ✅ Quellen, Behauptungen, Verknüpfungen
│   ├── ✅ Versionen (Snapshot bei Änderung)
│   ├── ✅ PDF-Anhänge mit digitaler Textextraktion (Status: extrahiert / fehlgeschlagen / ausstehend)
│   └── ⚠️ Scan-OCR (Tesseract/Cloud) — Phase 2
│
├── Offene Punkte
│   ├── ✅ Fragen & Antworten als „Offen"-Liste in der Detailansicht
│   ├── ✅ Projekt-Feed (Diskussionen-Ansicht)
│   └── ✅ Benachrichtigungen
│
├── Sprache
│   └── ✅ Eintragssprache: Deutsch | Englisch (Phase 1)
│
├── KI-Vorlagen (extern)
│   ├── ✅ Buch-Ebene: Zusammenfassung, Kapitelstruktur aus PDF-Text
│   ├── ✅ Untereintrag-Ebene: Seitenkontext {{PAGE_START}}/{{PAGE_END}}, Buch-PDF-Ausschnitt
│   └── ✅ Einheitliches Format ZIEL/KONTEXT/AUFGABE/AUSGABE
│
├── Ansichten
│   ├── ✅ Einträge (Browse + Detail 3-Spalten)
│   ├── ✅ Dashboard (KPIs, Aktivität)
│   ├── ✅ Timeline (vis-timeline)
│   ├── ✅ Karte (Leaflet, Orte mit Koordinaten)
│   ├── ✅ Tabelle (TanStack Table)
│   ├── ✅ Graph (Beziehungsnetz)
│   ├── ⚠️ Vergleich (/compare) — viewMode-Bug, Demo-Daten
│   └── ✅ Export & Online-KI (/export)
│
├── Export & externe KI (keine In-App-KI)
│   ├── ✅ ZIP-Export (entries/*.md, ocr/*.txt, manifest.json, README)
│   ├── ✅ Markdown-Export (einzelne Datei)
│   ├── ✅ Projekt-KI-Vorlagen (Quellenkritik, Chronologie, …)
│   ├── ✅ Typ-spezifische Vorlagen (Buch, Text, Person, …)
│   └── ✅ Einzeleintrag: Text kopieren + KI-Vorlage kopieren
│
└── Infrastruktur
    ├── ✅ PostgreSQL + Prisma (pageStart, pageEnd, sortOrder auf Entry)
    ├── ✅ Lokaler oder S3-Dateispeicher
    ├── ✅ Health-Check API
    └── ✅ Docker optional
```

## Typ-Hinweise (Online-KI)

| Typ | Was dokumentieren? |
|-----|-------------------|
| Buch | PDF hochladen (Textextraktion), Kapitel als Untereinträge mit Seitenzahlen |
| Text | Quelle, Übersetzung, Edition |
| Person | Lebensdaten, Rolle, Quellen |
| Ort | Koordinaten, historischer Name |
| Fund | Fundort, Datierung, Publikation |
| Notiz | Freie Recherche-Notiz |

## Einträge, Hierarchie & Quellen

| Parent-Typ | Erlaubte Untereinträge | Quellen bedeutet… | Wann Quellen anlegen |
|------------|--------------------------|-------------------|----------------------|
| **Buch** | Kapitel/Abschnitt (`text`, mit Seitenzahlen) | Das Buch + PDF (Material) ist die Hauptquelle; „Weiterführende Literatur" = Editionen, Übersetzungen, Rezensionen | Optional, erst wenn Sie neben dem Buch weitere Werke zitieren |
| **Text** (Projekt-Ebene) | — (keine) | Publikationen/Handschrift/Edition, aus der der Text stammt | Sobald Herkunft/Edition bekannt ist — nicht beim Anlegen nötig |
| **Kapitel/Abschnitt** (Unter `Buch`) | — (keine, max. 1 Hierarchie-Ebene) | Zusatzbelege zum Abschnitt; Hauptquelle bleibt das übergeordnete Buch | Optional, wenn der Abschnitt über das Buch-PDF hinaus belegt wird |
| **Person** | — | Primär- und Sekundärquellen für Biografie und Zuordnungen | Nach und nach bei Recherche |
| **Ort** | — | Karten, Berichte, Texte, die Lage und Name belegen | Wenn Belege für Ortsangaben vorliegen |
| **Fund** | — | Publikation/Grabungsbericht zur Fundbeschreibung | Wenn Fund publiziert oder datiert ist |
| **Notiz** | — | Konsultierte Literatur zur Notiz/Hypothese | Jederzeit nachtragbar |

**Regeln:** Nur **Buch** darf Untereinträge haben (nur Typ **Text** / Kapitel-Abschnitt). Keine Verschachtelung (Unter-Untereinträge). Quellen sind in allen Typen **optional beim Anlegen** — Abschnitt „Weitere Bereiche" zeigt leere Quellen nur bei Bearbeitungsrecht; bei **Buch** und **Kapitel** ist der Block dezent/optional gekennzeichnet.

## Bekannte Lücken (Phase 2+)

- Vollständiger PDF-Buchleser mit Seitenwechsel (react-pdf)
- Scan-OCR für gescannte PDFs
- Mobile Detail-Panel-Optimierung
- Asynchrone Hintergrund-OCR-Jobs
- Vergleichsansicht (`/compare`) zeigt wegen `viewMode="browse"` ggf. nicht den Inhalt

## Deployment

Nach Schema-Änderung: `npx prisma db push` (in Vercel-Build via `vercel.json` bzw. `deploy:db`).
