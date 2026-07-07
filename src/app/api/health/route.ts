import { NextResponse } from "next/server";

import { checkDeployEnvironment, storageMode } from "@/lib/storage-config";

export async function GET() {
  const deploy = checkDeployEnvironment();
  const authOk = Boolean(
    (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET) &&
      !(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET)!.includes(
        "change-me",
      ),
  );

  return NextResponse.json({
    ok: deploy.ok && authOk,
    auth: authOk,
    authSecretSet: authOk,
    authUrl: process.env.AUTH_URL ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    storage: storageMode(),
    mail: { enabled: false },
    vercel: process.env.VERCEL === "1",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    errors: [
      ...deploy.errors,
      ...(!authOk ? ["AUTH_SECRET fehlt in Vercel Environment Variables"] : []),
    ],
    warnings: deploy.warnings,
  });
}
