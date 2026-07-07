export type MailResult =
  | { ok: true }
  | { ok: false; error: string };

export type MailConfigStatus = {
  configured: boolean;
  hasApiKey: boolean;
  hasFrom: boolean;
  fromAddress: string | null;
  /** True when MAIL_FROM uses Resend's sandbox sender (onboarding@resend.dev). */
  isTestSender: boolean;
};

const RESEND_TEST_SENDER = "onboarding@resend.dev";

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim());
}

export function isResendTestSender(from?: string | null): boolean {
  const address = extractEmailAddress(from ?? process.env.MAIL_FROM);
  return address === RESEND_TEST_SENDER;
}

export function getMailConfigStatus(): MailConfigStatus {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim() ?? null;

  return {
    configured: Boolean(apiKey && from),
    hasApiKey: Boolean(apiKey),
    hasFrom: Boolean(from),
    fromAddress: from,
    isTestSender: isResendTestSender(from),
  };
}

function extractEmailAddress(from: string | null | undefined): string | null {
  if (!from) return null;
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

function formatFromAddress(from: string): string {
  if (from.includes("<")) return from;
  return `Chronikon <${from}>`;
}

function appUrl(): string {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

function parseResendError(status: number, body: string): string {
  try {
    const json = JSON.parse(body) as { message?: string };
    if (json.message) {
      const msg = json.message;
      if (/only send testing emails to your own email/i.test(msg)) {
        return "E-Mail nicht versendet — onboarding@resend.dev kann nur an die E-Mail-Adresse deines Resend-Kontos senden (nicht an beliebige Gmail-Adressen). Domain verifizieren oder Link manuell teilen.";
      }
      if (/domain is not verified/i.test(msg)) {
        return "E-Mail nicht versendet — Absender-Domain bei Resend nicht verifiziert. Domain bestätigen oder onboarding@resend.dev nur für Tests nutzen.";
      }
      return `E-Mail nicht versendet — ${msg}`;
    }
  } catch {
    // ignore JSON parse errors
  }
  return `E-Mail nicht versendet — Resend-Fehler (${status})`;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromRaw = process.env.MAIL_FROM?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error: "E-Mail nicht versendet — RESEND_API_KEY fehlt",
    };
  }
  if (!fromRaw) {
    return {
      ok: false,
      error: "E-Mail nicht versendet — MAIL_FROM fehlt",
    };
  }

  const from = formatFromAddress(fromRaw);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html ?? options.text.replace(/\n/g, "<br>"),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", res.status, body);
      return { ok: false, error: parseResendError(res.status, body) };
    }

    return { ok: true };
  } catch (error) {
    console.error("sendMail failed:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? `E-Mail nicht versendet — ${error.message}`
          : "E-Mail nicht versendet — unbekannter Fehler",
    };
  }
}

function inviteHtml(options: {
  greeting: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaUrl: string;
  footerLines?: string[];
}): string {
  const body = options.bodyLines.map((line) => `<p>${line}</p>`).join("");
  const footer = (options.footerLines ?? [])
    .map((line) => `<p style="color:#666;font-size:14px;">${line}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="de">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
  <p style="font-size:13px;color:#666;margin:0 0 8px;">Chronikon</p>
  <p>${options.greeting}</p>
  ${body}
  <p style="margin:24px 0;">
    <a href="${options.ctaUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">${options.ctaLabel}</a>
  </p>
  <p style="font-size:13px;color:#666;word-break:break-all;">${options.ctaUrl}</p>
  ${footer}
</body>
</html>`;
}

export async function sendWelcomeEmail(options: {
  to: string;
  name: string;
  password: string;
  invitedBy?: string;
  projectName?: string;
}): Promise<MailResult> {
  const loginUrl = `${appUrl()}/login`;
  const lines = [
    `Hallo ${options.name},`,
    "",
    "du wurdest zu Chronikon eingeladen — einer Plattform für historische Forschung.",
    "",
    ...(options.projectName ? [`Projekt: ${options.projectName}`, ""] : []),
    "Deine Zugangsdaten:",
    `  E-Mail:   ${options.to}`,
    `  Passwort: ${options.password}`,
    "",
    `Anmelden: ${loginUrl}`,
    "",
    "Bitte ändere dein Passwort nach dem ersten Login (sobald verfügbar).",
    "",
    options.invitedBy ? `Eingeladen von: ${options.invitedBy}` : "",
  ].filter(Boolean);

  return sendMail({
    to: options.to,
    subject: "Dein Chronikon-Zugang",
    text: lines.join("\n"),
    html: inviteHtml({
      greeting: `Hallo ${options.name},`,
      bodyLines: [
        "du wurdest zu Chronikon eingeladen — einer Plattform für historische Forschung.",
        ...(options.projectName ? [`<strong>Projekt:</strong> ${options.projectName}`] : []),
        `<strong>E-Mail:</strong> ${options.to}<br><strong>Passwort:</strong> ${options.password}`,
        options.invitedBy ? `Eingeladen von: ${options.invitedBy}` : "",
      ].filter(Boolean) as string[],
      ctaLabel: "Bei Chronikon anmelden",
      ctaUrl: loginUrl,
      footerLines: [
        "Bitte ändere dein Passwort nach dem ersten Login (sobald verfügbar).",
      ],
    }),
  });
}

export async function sendProjectInviteEmail(options: {
  to: string;
  projectName: string;
  inviteUrl: string;
  invitedBy: string;
  roleLabel: string;
}): Promise<MailResult> {
  const lines = [
    "Hallo,",
    "",
    `${options.invitedBy} hat dich zum Chronikon-Projekt „${options.projectName}" eingeladen.`,
    `Rolle: ${options.roleLabel}`,
    "",
    "Chronikon ist eine Plattform für historische Forschung.",
    "",
    "Öffne den Link, um dein Konto anzulegen und die Einladung anzunehmen:",
    `  ${options.inviteUrl}`,
    "",
    "Die E-Mail-Adresse ist fest mit dieser Einladung verknüpft.",
    "Der Link ist 14 Tage gültig.",
  ];

  return sendMail({
    to: options.to,
    subject: `Chronikon: Einladung zu „${options.projectName}"`,
    text: lines.join("\n"),
    html: inviteHtml({
      greeting: "Hallo,",
      bodyLines: [
        `<strong>${options.invitedBy}</strong> hat dich zum Chronikon-Projekt <strong>„${options.projectName}"</strong> eingeladen.`,
        `Rolle: <strong>${options.roleLabel}</strong>`,
        "Chronikon ist eine Plattform für historische Forschung.",
      ],
      ctaLabel: "Einladung annehmen",
      ctaUrl: options.inviteUrl,
      footerLines: [
        "Die E-Mail-Adresse ist fest mit dieser Einladung verknüpft.",
        "Der Link ist 14 Tage gültig.",
      ],
    }),
  });
}

export async function sendUserInviteEmail(options: {
  to: string;
  inviteUrl: string;
  invitedBy: string;
}): Promise<MailResult> {
  const lines = [
    "Hallo,",
    "",
    `${options.invitedBy} hat dich zu Chronikon eingeladen — einer Plattform für historische Forschung.`,
    "",
    "Öffne den Link, um dein Konto anzulegen:",
    `  ${options.inviteUrl}`,
    "",
    "Die E-Mail-Adresse ist fest mit dieser Einladung verknüpft.",
    "Der Link ist 14 Tage gültig.",
  ];

  return sendMail({
    to: options.to,
    subject: "Chronikon: Einladung zur Plattform",
    text: lines.join("\n"),
    html: inviteHtml({
      greeting: "Hallo,",
      bodyLines: [
        `<strong>${options.invitedBy}</strong> hat dich zu Chronikon eingeladen — einer Plattform für historische Forschung.`,
      ],
      ctaLabel: "Konto anlegen",
      ctaUrl: options.inviteUrl,
      footerLines: [
        "Die E-Mail-Adresse ist fest mit dieser Einladung verknüpft.",
        "Der Link ist 14 Tage gültig.",
      ],
    }),
  });
}
