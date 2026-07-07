import { AlertTriangle, Mail } from "lucide-react";

import type { MailConfigStatus } from "@/lib/mail";

export function MailConfigNotice({ status }: { status: MailConfigStatus }) {
  if (status.configured && !status.isTestSender) {
    return null;
  }

  if (!status.configured) {
    const missing: string[] = [];
    if (!status.hasApiKey) missing.push("RESEND_API_KEY");
    if (!status.hasFrom) missing.push("MAIL_FROM");

    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-[0.82rem]">
        <p className="mb-2 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          E-Mail-Versand nicht konfiguriert
        </p>
        <p className="text-muted-foreground">
          Fehlende Umgebungsvariablen:{" "}
          <strong>{missing.join(", ")}</strong>. Einladungen werden erstellt,
          aber ohne Resend-Konfiguration keine E-Mails versendet — den
          Einladungslink manuell teilen.
        </p>
        <p className="mt-2 text-[0.75rem] text-muted-foreground">
          Vercel: Project → Settings → Environment Variables →{" "}
          <code className="rounded bg-muted px-1">RESEND_API_KEY</code> und{" "}
          <code className="rounded bg-muted px-1">MAIL_FROM</code> setzen, dann
          Redeploy.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-[0.82rem]">
      <p className="mb-2 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
        <Mail className="h-4 w-4 shrink-0" />
        Resend-Testmodus aktiv
      </p>
      <p className="text-muted-foreground">
        <code className="rounded bg-muted px-1">onboarding@resend.dev</code> kann
        im Free-Tier <strong>nur an die E-Mail-Adresse deines Resend-Kontos</strong>{" "}
        senden — nicht an beliebige Gmail-Adressen. Für Produktion eine eigene
        Domain bei{" "}
        <a
          href="https://resend.com/domains"
          className="text-accent underline"
          target="_blank"
          rel="noreferrer"
        >
          resend.com/domains
        </a>{" "}
        verifizieren und{" "}
        <code className="rounded bg-muted px-1">
          MAIL_FROM=&quot;Chronikon &lt;noreply@deine-domain.de&gt;&quot;
        </code>{" "}
        setzen.
      </p>
    </div>
  );
}
