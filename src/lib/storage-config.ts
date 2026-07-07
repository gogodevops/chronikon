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

export function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY &&
      process.env.S3_SECRET_KEY,
  );
}

export function storageMode(): "local" | "s3" {
  if (process.env.STORAGE_MODE?.toLowerCase() === "local") return "local";
  if (hasS3Config()) return "s3";
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

  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL fehlt");
  }
  if (!authSecret || authSecret.includes("change-me")) {
    errors.push("AUTH_SECRET fehlt oder ist noch der Platzhalter");
  } else if (authSecret.length < 16) {
    errors.push("AUTH_SECRET zu kurz (min. 16 Zeichen)");
  }
  if (!process.env.AUTH_URL && !process.env.VERCEL_URL) {
    warnings.push("AUTH_URL fehlt — setze https://deine-app.vercel.app");
  }

  if (hasS3Config()) {
    if (!process.env.S3_BUCKET) {
      warnings.push("S3_BUCKET fehlt — Standard: chronikon-attachments");
    }
    if (!process.env.S3_PUBLIC_URL) {
      warnings.push(
        "S3_PUBLIC_URL optional — Dateien über /api/files/… (Login nötig)",
      );
    }
  } else if (process.env.VERCEL === "1") {
    warnings.push(
      "R2/S3 nicht konfiguriert — App läuft, Datei-Uploads erst nach S3_* Variablen",
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}
