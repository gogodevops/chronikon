# Chronikon — Funktionsübersicht

Stand: MVP mit Export, Online-KI-Vorlagen, Buch-Untereinträge.

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
│   ├── ✅ Buch — Untereinträge (Kapitel/Seiten)
│   ├── ✅ Text, Person, Ort, Fund, Notiz
│   ├── ✅ CRUD (Erstellen, Bearbeiten, Löschen)
│   ├── ✅ Filter (Typ, Thema, Confidence, Gespeicherte Ansichten)
│   ├── ✅ Typ-Hinweis beim Anlegen
│   └── ✅ „Für Online-KI" in Detailansicht (Text + Vorlage kopieren)
│
├── Inhalt pro Eintrag
│   ├── ✅ Markdown-Body, Zusammenfassung, Metadaten
│   ├── ✅ Quellen, Behauptungen, Verknüpfungen
│   ├── ✅ Versionen (Snapshot bei Änderung)
│   ├── ✅ PDF/Bild-Anhänge mit OCR-Extraktion
│   └── ⚠️ OCR — nur bei PDF-Upload, kein Nach-OCR-Button
│
├── Diskussion
│   ├── ✅ Fragen & Antworten, Kommentare
│   ├── ✅ Diskussions-Feed (Projekt + Eintrag)
│   └── ✅ Benachrichtigungen
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
    ├── ✅ PostgreSQL + Prisma
    ├── ✅ Lokaler oder S3-Dateispeicher
    ├── ✅ Health-Check API
    └── ✅ Docker optional
```

## Typ-Hinweise (Online-KI)

| Typ | Was dokumentieren? |
|-----|-------------------|
| Buch | Kapitel als Untereinträge, OCR-Text, Ausgabe/Jahr |
| Text | Quelle, Übersetzung, Edition |
| Person | Lebensdaten, Rolle, Quellen |
| Ort | Koordinaten, historischer Name |
| Fund | Fundort, Datierung, Publikation |
| Notiz | Freie Recherche-Notiz |

## Workflow: Externe KI nutzen

1. Wissen in Chronikon pflegen (Einträge, Anhänge, Quellen)
2. **Projekt als ZIP** unter Dashboard → Export & Online-KI
3. KI-Vorlage kopieren, ZIP-Inhalt einfügen → ChatGPT/Claude
4. Oder pro Eintrag: Detailansicht → **Text kopieren** / **KI-Vorlage kopieren**

## Bekannte Lücken

- Vergleichsansicht (`/compare`) zeigt wegen `viewMode="browse"` ggf. nicht den Inhalt
- Keine eingebaute KI (absichtlich)
- Vorlagen nicht pro Projekt editierbar (nur Standard-Vorlagen)
- Gespeicherte Vergleichssets nur per Seed/Datenbank, kein UI-Editor
