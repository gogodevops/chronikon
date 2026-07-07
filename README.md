# Chronikon

Historische Forschungsplattform — Einträge, Quellen, Diskussionen und KI-gestützte Erfassung.

## Voraussetzungen

- **Node.js 20+**
- **PostgreSQL** — z.B. kostenlos bei [Neon](https://neon.tech) (kein Docker nötig)
- Docker ist **optional** (nur wenn du Postgres + MinIO lokal per Container willst)

---

## Setup ohne Docker (empfohlen)

### 1. Abhängigkeiten

```bash
cd chronikon
npm install
```

### 2. PostgreSQL (Neon — kostenlos, ~2 Minuten)

1. Auf [neon.tech](https://neon.tech) anmelden
2. Neues Projekt **chronikon** anlegen
3. **Connection string** kopieren (mit `?sslmode=require`)
4. In `.env` eintragen:

```env
DATABASE_URL="postgresql://...@...neon.tech/neondb?sslmode=require"
AUTH_SECRET="irgendein-langer-zufallsstring"
AUTH_URL="http://localhost:3000"
STORAGE_MODE="local"
AI_MOCK_MODE="true"
```

Vorlage: `.env.example` nach `.env` kopieren.

### 3. Datenbank initialisieren

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. App starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

### Anhänge ohne MinIO

Mit `STORAGE_MODE=local` (Standard, wenn kein S3 konfiguriert) landen Uploads in `public/uploads/` — **kein MinIO, kein Docker**.

---

## Admin-Zugang (nach Seed)

| E-Mail | Passwort | Hinweis |
|--------|----------|---------|
| `admin@chronikon.dev` | `Chronikon-Admin-2026!` | Einziger Benutzer; kein Demo-Inhalt |

Passwort per Umgebungsvariable `SEED_ADMIN_PASSWORD` beim Seed änderbar.

Nach dem Login das erste **Ober-Thema** unter dem Projekt-Dropdown („+ Neues Ober-Thema…") oder auf `/projects/new` anlegen.

---

## Alternative: PostgreSQL lokal installiert (Windows)

Falls du Postgres bereits installiert hast (ohne Docker):

```env
DATABASE_URL="postgresql://postgres:DEIN_PASSWORT@localhost:5432/chronikon?schema=public"
```

Datenbank anlegen:

```sql
CREATE DATABASE chronikon;
```

Dann wie oben: `db:push` → `db:seed` → `dev`.

---

## Optional: Docker (nur wenn du willst)

```bash
npm run docker:up
```

Startet PostgreSQL (5432) + MinIO (9000). Dann in `.env` die Docker-URLs aus der alten `.env.example` nutzen und `STORAGE_MODE=s3` setzen.

---

## Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver |
| `npm run db:push` | Schema in DB pushen |
| `npm run db:seed` | Demo-Daten laden |
| `npm run db:generate` | Prisma Client |
| `npm run deploy:check` | Production-Env prüfen |
| `npm run deploy:db` | Schema + Seed auf Production-DB |
| `npm run docker:up` | Optional: Postgres + MinIO |

---

## Stack

- Next.js 16, React 19, TypeScript
- PostgreSQL + Prisma (Neon oder lokal)
- NextAuth (Credentials)
- Anhänge: lokal oder S3/R2
- Deployment: siehe `DEPLOY.md`
