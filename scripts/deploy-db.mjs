#!/usr/bin/env node
/**
 * Production-Datenbank initialisieren (Schema + Seed).
 * Lokal mit Production-URL aus .env.production oder .env:
 *
 *   npm run deploy:db
 *
 * Oder einmalig:
 *   DATABASE_URL="postgresql://..." npm run deploy:db
 */

import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(name) {
  const p = resolve(root, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(".env.production");
loadEnv(".env");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL fehlt — Neon Connection String in .env setzen");
  process.exit(1);
}

console.log("\n  Chronikon — DB Deploy\n");
console.log("  → prisma db push");
const push = spawnSync("npx", ["prisma", "db", "push"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
if (push.status !== 0) process.exit(push.status ?? 1);

console.log("\n  → seed (tsx prisma/seed.ts)");
const seed = spawnSync("npm", ["run", "db:seed"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
if (seed.status !== 0) process.exit(seed.status ?? 1);

console.log("\n  ✓ Datenbank bereit\n");
