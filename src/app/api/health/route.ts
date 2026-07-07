import { NextResponse } from "next/server";

import { checkDeployEnvironment, storageMode } from "@/lib/storage-config";

export async function GET() {
  const deploy = checkDeployEnvironment();
  const authOk = Boolean(
    process.env.AUTH_SECRET &&
      !process.env.AUTH_SECRET.includes("change-me") &&
      process.env.AUTH_SECRET.length >= 16,
  );

  return NextResponse.json({
    ok: deploy.ok && authOk,
    auth: authOk,
    storage: storageMode(),
    vercel: process.env.VERCEL === "1",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    errors: [
      ...deploy.errors,
      ...(!authOk ? ["AUTH_SECRET fehlt in Vercel Environment Variables"] : []),
    ],
    warnings: deploy.warnings,
  });
}
