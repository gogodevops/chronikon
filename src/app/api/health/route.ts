import { NextResponse } from "next/server";

import { checkDeployEnvironment, storageMode } from "@/lib/storage-config";

export async function GET() {
  const deploy = checkDeployEnvironment();

  return NextResponse.json({
    ok: deploy.ok,
    storage: storageMode(),
    vercel: process.env.VERCEL === "1",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    errors: deploy.errors,
    warnings: deploy.warnings,
  });
}
