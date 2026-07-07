import "dotenv/config";

import bcrypt from "bcryptjs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

export const SEED_ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@chronikon.dev",
  password: process.env.SEED_ADMIN_PASSWORD ?? "Chronikon-Admin-2026!",
  name: process.env.SEED_ADMIN_NAME ?? "Admin",
};

export async function runSeed() {
  console.log("Seeding Chronikon (minimal)…");

  await db.comment.deleteMany();
  await db.answer.deleteMany();
  await db.question.deleteMany();
  await db.entryRelation.deleteMany();
  await db.claim.deleteMany();
  await db.source.deleteMany();
  await db.attachment.deleteMany();
  await db.entryTopic.deleteMany();
  await db.entryVersion.deleteMany();
  await db.compareItem.deleteMany();
  await db.compareSet.deleteMany();
  await db.entry.deleteMany();
  await db.savedView.deleteMany();
  await db.topic.deleteMany();
  await db.projectMember.deleteMany();
  await db.projectInvite.deleteMany();
  await db.project.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.notification.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(SEED_ADMIN.password, 12);
  const initials = SEED_ADMIN.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  await db.user.create({
    data: {
      email: SEED_ADMIN.email,
      name: SEED_ADMIN.name,
      passwordHash,
      avatarInitials: initials || "AD",
    },
  });

  console.log("Seed abgeschlossen.");
  console.log(`Admin-Login: ${SEED_ADMIN.email} / ${SEED_ADMIN.password}`);
  console.log(
    "Hinweis: Passwort über SEED_ADMIN_PASSWORD änderbar. Nach Login unter „Projekt“ ein Ober-Thema anlegen.",
  );
}

const runningAsCli =
  typeof process.argv[1] === "string" &&
  process.argv[1].replace(/\\/g, "/").endsWith("prisma/seed.ts");

if (runningAsCli) {
  runSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
      await pool.end();
    });
}
