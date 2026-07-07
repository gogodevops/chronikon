import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(request: Request) {
  const setupSecret = process.env.SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json(
      { error: "SETUP_SECRET nicht in Vercel gesetzt" },
      { status: 503 },
    );
  }

  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== setupSecret) {
    return NextResponse.json({ error: "Ungültiges Secret" }, { status: 401 });
  }

  const userCount = await db.user.count();
  if (userCount > 0) {
    return NextResponse.json({
      ok: true,
      alreadyInitialized: true,
      users: userCount,
      message: "Datenbank hat bereits Benutzer — Seed übersprungen",
    });
  }

  const { runSeed, SEED_ADMIN } = await import("../../../../../prisma/seed");
  await runSeed();

  return NextResponse.json({
    ok: true,
    seeded: true,
    login: `${SEED_ADMIN.email} / ${SEED_ADMIN.password}`,
  });
}
