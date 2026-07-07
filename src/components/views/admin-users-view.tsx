"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowLeft,
  Copy,
  Mail,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  createUserInvite,
  revokeUserInvite,
} from "@/actions/invites";
import type { InviteStatus } from "@/lib/invite-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  avatarInitials: string | null;
  projectCount: number;
};

export type AdminInviteRow = {
  id: string;
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedByName: string;
  status: InviteStatus;
  registeredAt: Date | null;
};

const STATUS_STYLES: Record<InviteStatus, string> = {
  Eingeladen: "bg-accent-dim text-accent",
  Angemeldet: "bg-green/15 text-green",
  Abgelaufen: "bg-muted text-muted-foreground",
};

export function AdminUsersView({
  users,
  invites,
}: {
  users: AdminUserRow[];
  invites: AdminInviteRow[];
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [sendEmail, setSendEmail] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [lastInviteLink, setLastInviteLink] = React.useState<string | null>(
    null,
  );
  const [lastFeedback, setLastFeedback] = React.useState<{
    email: string;
    emailSent?: boolean;
  } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setLastInviteLink(null);
    setLastFeedback(null);

    const result = await createUserInvite({
      email: email.trim(),
      sendEmail,
    });

    setPending(false);
    if (!result.success) {
      window.alert(result.error ?? "Aktion fehlgeschlagen");
      return;
    }

    const link = `${window.location.origin}/invite/${result.data.token}`;
    setLastInviteLink(link);
    setLastFeedback({
      email: email.trim().toLowerCase(),
      emailSent: result.data.emailSent,
    });
    setEmail("");
    setSendEmail(false);
    router.refresh();
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    window.alert("Einladungslink kopiert");
  };

  const handleRevokeInvite = async (inviteId: string) => {
    const result = await revokeUserInvite(inviteId);
    if (!result.success) {
      window.alert(result.error ?? "Aktion fehlgeschlagen");
      return;
    }
    router.refresh();
  };

  const pendingInvites = invites.filter((invite) => invite.status === "Eingeladen");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-surface/95 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-[0.8rem] text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            System-Übersicht
          </Link>
          <span className="text-accent">·</span>
          <span className="text-[0.85rem] font-medium">Nutzer verwalten</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <UserPlus className="h-5 w-5 text-accent" />
            Neuen Nutzer einladen
          </h1>
          <p className="mb-4 text-[0.82rem] text-muted-foreground">
            Nur die E-Mail-Adresse eingeben. Der eingeladene Nutzer legt Name
            und Passwort selbst über den Einladungslink fest (14 Tage gültig).
          </p>

          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
                E-Mail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nutzer@beispiel.de"
                required
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[0.78rem]">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-border"
              />
              Einladung per E-Mail senden
            </label>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Wird erstellt…" : "Einladung senden"}
            </Button>
          </form>

          {lastFeedback?.emailSent && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent-dim p-3 text-[0.82rem]">
              <p className="font-medium text-accent">
                Einladungs-E-Mail wurde gesendet an:
              </p>
              <p className="mt-1">
                <strong>{lastFeedback.email}</strong>
              </p>
            </div>
          )}

          {lastInviteLink && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent-dim p-3">
              <p className="mb-2 text-[0.82rem] font-medium text-accent">
                Einladungslink erstellt
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={lastInviteLink}
                  className="h-8 text-[0.68rem]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    copyInviteLink(lastInviteLink.split("/").pop()!)
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>

        {invites.length > 0 && (
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-accent" />
              Einladungen ({pendingInvites.length} offen)
            </h2>
            <ul className="space-y-2">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-2/50 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.85rem] font-medium">
                      {invite.email}
                      <span
                        className={`ml-2 rounded px-1.5 py-0.5 text-[0.62rem] ${STATUS_STYLES[invite.status]}`}
                      >
                        {invite.status}
                      </span>
                    </p>
                    <p className="text-[0.72rem] text-muted-foreground">
                      Eingeladen{" "}
                      {format(new Date(invite.createdAt), "d. MMM yyyy", {
                        locale: de,
                      })}
                      {" · "}
                      Gültig bis{" "}
                      {format(new Date(invite.expiresAt), "d. MMM yyyy", {
                        locale: de,
                      })}
                      {invite.registeredAt && (
                        <>
                          {" · "}
                          Angemeldet{" "}
                          {format(new Date(invite.registeredAt), "d. MMM yyyy", {
                            locale: de,
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  {invite.status === "Eingeladen" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => copyInviteLink(invite.token)}
                        title="Link kopieren"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRevokeInvite(invite.id)}
                        title="Widerrufen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-accent" />
            Registrierte Nutzer ({users.length})
          </h2>
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-2/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.85rem] font-medium">
                    {user.name ?? "Unbenannt"}
                    {user.isAdmin && (
                      <span className="ml-2 rounded bg-accent-dim px-1.5 py-0.5 text-[0.62rem] text-accent">
                        Admin
                      </span>
                    )}
                    <span className="ml-2 rounded bg-green/15 px-1.5 py-0.5 text-[0.62rem] text-green">
                      Angemeldet
                    </span>
                  </p>
                  <p className="truncate text-[0.75rem] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <div className="shrink-0 text-right text-[0.68rem] text-muted-foreground">
                  <p>{user.projectCount} Projekt(e)</p>
                  <p>
                    {format(new Date(user.createdAt), "d. MMM yyyy", {
                      locale: de,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
