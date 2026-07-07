import { NextResponse } from "next/server";

import { getMailConfigStatus } from "@/lib/mail";
import { checkDeployEnvironment, storageMode } from "@/lib/storage-config";

export async function GET() {
  const deploy = checkDeployEnvironment();
  const authOk = Boolean(
    (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET) &&
      !(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET)!.includes(
        "change-me",
      ),
  );

  const mail = getMailConfigStatus();
  const mailWarnings: string[] = [];
  if (!mail.configured) {
    if (!mail.hasApiKey) mailWarnings.push("RESEND_API_KEY fehlt");
    if (!mail.hasFrom) mailWarnings.push("MAIL_FROM fehlt");
  } else if (mail.isTestSender) {
    mailWarnings.push(
      "MAIL_FROM nutzt onboarding@resend.dev — E-Mails nur an Resend-Konto-Adresse möglich",
    );
  }

  return NextResponse.json({
    ok: deploy.ok && authOk,
    auth: authOk,
    authSecretSet: authOk,
    authUrl: process.env.AUTH_URL ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    storage: storageMode(),
    mail: {
      configured: mail.configured,
      hasApiKey: mail.hasApiKey,
      hasFrom: mail.hasFrom,
      isTestSender: mail.isTestSender,
    },
    vercel: process.env.VERCEL === "1",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    errors: [
      ...deploy.errors,
      ...(!authOk ? ["AUTH_SECRET fehlt in Vercel Environment Variables"] : []),
    ],
    warnings: [...deploy.warnings, ...mailWarnings],
  });
}
