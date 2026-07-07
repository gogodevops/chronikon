"use client";

import type { ActionResult } from "@/actions/auth";

export async function runServerAction(
  action: () => Promise<ActionResult<unknown>>,
  onSuccess?: () => void,
): Promise<boolean> {
  try {
    const result = await action();
    if (!result.success) {
      window.alert(result.error ?? "Aktion fehlgeschlagen");
      return false;
    }
    onSuccess?.();
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    window.alert(message);
    return false;
  }
}

export function canEditProject(role: string) {
  return role === "owner" || role === "editor";
}

export function canDiscuss(role: string) {
  return role === "owner" || role === "editor" || role === "commenter";
}

export function canManageTeam(role: string) {
  return role === "owner";
}

/** Team-Tab und /team — nur Projekt-Admins (Owner-Rolle). */
export function canSeeTeamNav(role: string) {
  return canManageTeam(role);
}

export function canDeleteProject(role: string, isAppAdmin: boolean) {
  return role === "owner" || isAppAdmin;
}
