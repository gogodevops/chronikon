export type MailResult =
  | { ok: true }
  | { ok: false; error: string };

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim());
}

function appUrl(): string {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  );
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "E-Mail nicht konfiguriert (RESEND_API_KEY, MAIL_FROM)",
    };
  }

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
      return { ok: false, error: `E-Mail-Versand fehlgeschlagen (${res.status})` };
    }

    return { ok: true };
  } catch (error) {
    console.error("sendMail failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "E-Mail-Versand fehlgeschlagen",
    };
  }
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
    ...(options.projectName
      ? [`Projekt: ${options.projectName}`, ""]
      : []),
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
    `Hallo,`,
    "",
    `${options.invitedBy} hat dich zum Chronikon-Projekt „${options.projectName}" eingeladen.`,
    `Rolle: ${options.roleLabel}`,
    "",
    "Chronikon ist eine Plattform für historische Forschung.",
    "",
    "Falls du noch keinen Account hast, legt der Administrator deinen Zugang an.",
    "Melde dich dann mit der E-Mail-Adresse an, für die diese Einladung gilt:",
    `  ${options.to}`,
    "",
    `Einladung annehmen: ${options.inviteUrl}`,
    "",
    "Der Link ist 14 Tage gültig.",
  ];

  return sendMail({
    to: options.to,
    subject: `Einladung: ${options.projectName} (Chronikon)`,
    text: lines.join("\n"),
  });
}
