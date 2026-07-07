import { randomBytes } from "crypto";

export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export const INVITE_VALIDITY_DAYS = 14;

export function inviteExpiresAt(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITE_VALIDITY_DAYS);
  return expiresAt;
}
