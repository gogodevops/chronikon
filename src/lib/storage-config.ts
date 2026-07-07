/** Zentrale Storage-/Deploy-Konfiguration (lokal vs. Vercel + R2). */

export function appBaseUrl(): string {
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function isVercelProduction(): boolean {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
}

export function storageMode(): "local" | "s3" {
  const explicit = process.env.STORAGE_MODE?.toLowerCase();
  if (explicit === "local") return "local";
  if (explicit === "s3") return "s3";
  if (
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  ) {
    return "s3";
  }
  if (isVercelProduction()) {
    return "s3";
  }
  return "local";
}

/** Öffentliche URL für gespeicherte Dateien */
export function filePublicUrl(storageKey: string): string {
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/${storageKey}`;
  }
  return `${appBaseUrl()}/api/files/${storageKey}`;
}

export type DeployEnvCheck = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function checkDeployEnvironment(): DeployEnvCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL fehlt");
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.includes("change-me")) {
    errors.push("AUTH_SECRET fehlt oder ist noch der Platzhalter");
  }
  if (!process.env.AUTH_URL) {
    warnings.push("AUTH_URL fehlt — Vercel setzt oft VERCEL_URL automatisch");
  }

  const mode = storageMode();
  if (mode === "s3") {
    if (!process.env.S3_ENDPOINT) errors.push("S3_ENDPOINT fehlt");
    if (!process.env.S3_ACCESS_KEY) errors.push("S3_ACCESS_KEY fehlt");
    if (!process.env.S3_SECRET_KEY) errors.push("S3_SECRET_KEY fehlt");
    if (!process.env.S3_BUCKET) warnings.push("S3_BUCKET fehlt — Standard: chronikon-attachments");
    if (!process.env.S3_PUBLIC_URL) {
      warnings.push(
        "S3_PUBLIC_URL nicht gesetzt — Dateien werden über /api/files/… ausgeliefert (Login nötig)",
      );
    }
  } else if (isVercelProduction()) {
    errors.push(
      "STORAGE_MODE=local auf Vercel — Uploads gehen verloren. STORAGE_MODE=s3 + R2 konfigurieren.",
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}
