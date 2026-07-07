export type InviteStatus = "Eingeladen" | "Angemeldet" | "Abgelaufen";

export function resolveInviteStatus(options: {
  acceptedAt: Date | null;
  expiresAt: Date;
  userRegistered?: boolean;
}): InviteStatus {
  if (options.acceptedAt || options.userRegistered) {
    return "Angemeldet";
  }
  if (options.expiresAt < new Date()) {
    return "Abgelaufen";
  }
  return "Eingeladen";
}
