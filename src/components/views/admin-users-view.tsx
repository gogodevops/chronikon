"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft, UserPlus, Users } from "lucide-react";

import { createAppUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runServerAction } from "@/lib/action-feedback";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  avatarInitials: string | null;
  projectCount: number;
};

export function AdminUsersView({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [lastCreated, setLastCreated] = React.useState<{
    email: string;
    password: string;
  } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setLastCreated(null);

    const ok = await runServerAction(() =>
      createAppUser({
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    );

    setPending(false);
    if (ok) {
      setLastCreated({ email: email.trim().toLowerCase(), password });
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-surface/95 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[0.8rem] text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück
          </Link>
          <span className="text-accent">·</span>
          <span className="text-[0.85rem] font-medium">Nutzer verwalten</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <UserPlus className="h-5 w-5 text-accent" />
            Neuen Nutzer anlegen
          </h1>
          <p className="mb-4 text-[0.82rem] text-muted-foreground">
            Du legst E-Mail und Passwort fest und gibst die Zugangsdaten selbst
            weiter. Öffentliche Registrierung ist deaktiviert.
          </p>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Forscher"
                required
              />
            </div>
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
            <div>
              <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
                Passwort
              </label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 Zeichen — wird an Nutzer weitergegeben"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Wird angelegt…" : "Nutzer erstellen"}
            </Button>
          </form>

          {lastCreated && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent-dim p-3 text-[0.82rem]">
              <p className="font-medium text-accent">Zugangsdaten zum Weitergeben:</p>
              <p className="mt-1">
                E-Mail: <strong>{lastCreated.email}</strong>
              </p>
              <p>
                Passwort: <strong>{lastCreated.password}</strong>
              </p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-accent" />
            Alle Nutzer ({users.length})
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
