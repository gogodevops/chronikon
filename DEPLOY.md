# Chronikon online stellen — Vercel + Neon + Cloudflare R2

**Empfohlene Stack (~0 €/Monat für kleine Projekte):**

| Teil | Dienst | Kosten |
|------|--------|--------|
| App | [Vercel Hobby](https://vercel.com) | 0 € |
| Datenbank | [Neon Free](https://neon.tech) | 0 € |
| Datei-Speicher | [Cloudflare R2](https://cloudflare.com/r2) | 0 € (10 GB) |

---

## Schritt 1 — GitHub

```bash
cd chronikon
git init
git add .
git commit -m "Chronikon production ready"
# Repo auf GitHub anlegen, dann:
git remote add origin https://github.com/DEIN-USER/chronikon.git
git push -u origin main
```

---

## Schritt 2 — Neon (PostgreSQL)

1. [neon.tech](https://neon.tech) → Projekt **chronikon**
2. Connection String kopieren (`?sslmode=require`)

Lokal DB anlegen:

```bash
cp .env.production.example .env.production
# DATABASE_URL in .env.production eintragen

npm run deploy:db
```

Admin-Login danach: `admin@chronikon.dev` / `Chronikon-Admin-2026!`  
Erstes Ober-Thema im App-Header unter „+ Neues Ober-Thema…" anlegen.

---

## Schritt 3 — Cloudflare R2 (Anhänge)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → Bucket **chronikon-attachments**
2. **Manage R2 API Tokens** → Token mit Read & Write
3. Werte notieren:
   - Account ID → `S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com`
   - Access Key ID → `S3_ACCESS_KEY`
   - Secret → `S3_SECRET_KEY`

**Optional:** Unter Bucket → Settings → **Public access** (r2.dev URL) → `S3_PUBLIC_URL`  
Ohne Public URL: Dateien laufen über `/api/files/…` (nur eingeloggte Projekt-Mitglieder).

---

## Schritt 4 — Vercel

1. [vercel.com/new](https://vercel.com/new) → GitHub Repo importieren
2. **Root Directory:** `chronikon` (falls Repo nur chronikon ist: `.`)
3. **Environment Variables** (Production):

| Variable | Wert |
|----------|------|
| `DATABASE_URL` | Neon Connection String |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_URL` | `https://DEIN-PROJEKT.vercel.app` |
| `STORAGE_MODE` | `s3` |
| `S3_ENDPOINT` | R2 Endpoint |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | `chronikon-attachments` |
| `S3_ACCESS_KEY` | R2 Key |
| `S3_SECRET_KEY` | R2 Secret |
| `AI_MOCK_MODE` | `true` |
| `RESEND_API_KEY` | Resend API Key **nur in Vercel** (nicht ins Repo committen; siehe Schritt 4b) |
| `MAIL_FROM` | `Chronikon <noreply@chronikon.de>` oder `Chronikon <einladungen@chronikon.de>` (siehe Schritt 4b) |

4. **Deploy**

Nach erstem Deploy: `AUTH_URL` auf die echte URL setzen und **Redeploy**.

---

## Schritt 4b – Resend (Einladungs-E-Mails)

Ohne Resend werden Einladungen erstellt, aber **keine E-Mails versendet** – nur der kopierbare Link funktioniert.

**Wichtig:** `RESEND_API_KEY` nur als **Vercel Environment Variable** (Production) setzen – **niemals** in Git, `.env` oder andere committed Dateien.

1. [resend.com](https://resend.com) → Konto anlegen
2. **API Keys** → Create API Key → Wert nur in Vercel als `RESEND_API_KEY` eintragen (nicht committen)
3. **Absender wählen** (`MAIL_FROM` in Vercel):

| Modus | MAIL_FROM | Empfänger |
|-------|-----------|-----------|
| **Test** | `Chronikon <onboarding@resend.dev>` | Nur die E-Mail deines Resend-Kontos |
| **Produktion (chronikon.de)** | `Chronikon <noreply@chronikon.de>` oder `Chronikon <einladungen@chronikon.de>` | Beliebige Adressen (Domain muss verifiziert sein) |

4. **Domain `chronikon.de` verifizieren** (Produktion): [resend.com/domains](https://resend.com/domains) → Domain hinzufügen → bei deinem DNS-Provider die von Resend angezeigten Records setzen:
   - **DKIM:** TXT-Record für `resend._domainkey` (vollständig oft `resend._domainkey.chronikon.de`) – Wert aus dem Resend-Dashboard
   - **SPF / MX:** nur eintragen, wenn Resend sie für die Domain anzeigt (Werte 1:1 aus dem Dashboard)
   - In Resend **Verify** → Status **Verified** abwarten (DNS-Propagation kann Minuten dauern)
5. In Vercel `MAIL_FROM` setzen (z. B. `Chronikon <noreply@chronikon.de>`) und **Redeploy**

**Häufiger Fehler:** Gmail-Adresse eingeladen, aber `onboarding@resend.dev` als Absender – Resend lehnt das ab oder liefert nur an die Resend-Konto-Mail. Lösung: Domain verifizieren oder Einladungslink manuell teilen.

Status prüfen: `GET /api/health` → Feld `mail` und `warnings`.

---

## Schritt 5 — Prüfen

```bash
# Lokal Env prüfen (mit .env.production)
npm run deploy:check
```

Live:

- `https://DEIN-PROJEKT.vercel.app/api/health` → `"ok": true`
- Login → Eintrag öffnen → Anhang hochladen → Bild/PDF anzeigen

---

## Skripte

| Befehl | Zweck |
|--------|--------|
| `npm run deploy:check` | Env-Variablen prüfen |
| `npm run deploy:db` | Schema + Seed auf Production-DB |

---

## Architektur

```
Browser
   │
   ▼
Vercel (Next.js) ──► Neon PostgreSQL
   │
   └──► Cloudflare R2 (PDF, Bilder)
         oder /api/files/ Proxy
```

---

## Kosten später

| Limit | Lösung |
|-------|--------|
| Neon > 0,5 GB | Neon Launch ~$5/Mo |
| R2 > 10 GB | ~$0.015/GB |
| Vercel kommerziell | Pro ~$20/Mo |
| Alles auf einem Server | Hetzner VPS ~€4/Mo + `STORAGE_MODE=local` |

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `/api/health` errors | Fehlende Env in Vercel |
| Upload 500 | R2 Keys / Bucket prüfen |
| Login-Loop | `AUTH_URL` = exakte Production-URL |
| Bild lädt nicht | Projekt-Mitgliedschaft; oder `S3_PUBLIC_URL` setzen |
| DB connection | `?sslmode=require` bei Neon |
| E-Mail kommt nicht an | `/api/health` → `mail.configured`; bei Test-Absender nur Resend-Konto-Mail; sonst Domain verifizieren |
| „E-Mail nicht versendet" in UI | `RESEND_API_KEY` / `MAIL_FROM` in Vercel setzen und Redeploy |
