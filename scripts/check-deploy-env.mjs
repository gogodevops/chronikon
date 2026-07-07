#!/usr/bin/env node
/**
 * Prüft ob alle Variablen für Vercel + Neon + R2 gesetzt sind.
 * Usage: node scripts/check-deploy-env.mjs
 *        npm run deploy:check
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const errors = [];
const warnings = [];

function req(name, msg) {
  const v = process.env[name];
  if (!v || v.includes("change-me") || v.includes("DEIN_")) {
    errors.push(msg ?? `${name} fehlt`);
  }
}

req("DATABASE_URL");
req("AUTH_SECRET", "AUTH_SECRET fehlt oder ist Platzhalter");

if (!process.env.AUTH_URL) {
  warnings.push("AUTH_URL — nach Deploy auf https://deine-app.vercel.app setzen");
}

const hasS3 =
  process.env.S3_ENDPOINT &&
  process.env.S3_ACCESS_KEY &&
  process.env.S3_SECRET_KEY;

if (hasS3) {
  if (!process.env.S3_BUCKET) {
    warnings.push("S3_BUCKET — Standard: chronikon-attachments");
  }
  if (!process.env.S3_PUBLIC_URL) {
    warnings.push(
      "S3_PUBLIC_URL optional — ohne sie laufen Dateien über /api/files/ (Login nötig)",
    );
  }
} else if (process.env.VERCEL === "1") {
  warnings.push(
    "R2/S3 nicht konfiguriert — App läuft, Datei-Uploads erst nach S3_* Variablen",
  );
}

if (!process.env.OPENAI_API_KEY && process.env.AI_MOCK_MODE !== "true") {
  warnings.push("OPENAI_API_KEY leer — setze AI_MOCK_MODE=true für Demo");
}

const resendKey = process.env.RESEND_API_KEY?.trim();
const mailFrom = process.env.MAIL_FROM?.trim();
if (!resendKey || !mailFrom) {
  warnings.push(
    "E-Mail (Resend) nicht konfiguriert — RESEND_API_KEY und MAIL_FROM für Einladungs-Mails setzen",
  );
} else if (/onboarding@resend\.dev/i.test(mailFrom)) {
  warnings.push(
    "MAIL_FROM nutzt onboarding@resend.dev — E-Mails nur an die Resend-Konto-Adresse möglich",
  );
}

console.log("\n  Chronikon — Deploy Check\n");

if (errors.length) {
  console.log("  Fehler:");
  errors.forEach((e) => console.log(`    ✗ ${e}`));
}
if (warnings.length) {
  console.log("  Hinweise:");
  warnings.forEach((w) => console.log(`    ! ${w}`));
}
if (!errors.length && !warnings.length) {
  console.log("  ✓ Alle Pflicht-Variablen gesetzt\n");
} else if (!errors.length) {
  console.log("\n  ✓ Pflicht-Variablen OK (Hinweise beachten)\n");
} else {
  console.log("\n  ✗ Bitte .env oder Vercel Environment Variables ergänzen\n");
  process.exit(1);
}
