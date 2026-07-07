"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  registerViaInviteAction,
  type InviteRegisterState,
} from "@/actions/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteRegisterForm({
  token,
  email,
  projectName,
}: {
  token: string;
  email: string;
  projectName?: string;
}) {
  const [state, formAction, pending] = useActionState<
    InviteRegisterState,
    FormData
  >(registerViaInviteAction, {});

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="token" value={token} />

      {projectName && (
        <p className="text-center text-[0.82rem] text-muted-foreground">
          Projekt: <strong className="text-foreground">{projectName}</strong>
        </p>
      )}

      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          E-Mail
        </label>
        <Input value={email} readOnly disabled className="bg-surface-3/50" />
      </div>

      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          Name
        </label>
        <Input
          name="name"
          placeholder="Vor- und Nachname"
          required
          autoComplete="name"
        />
      </div>

      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          Passwort
        </label>
        <Input
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          Passwort bestätigen
        </label>
        <Input
          name="confirmPassword"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.accountCreatedLoginUrl && (
        <p className="text-sm text-muted-foreground">
          Konto angelegt — bitte{" "}
          <Link
            href={state.accountCreatedLoginUrl}
            className="text-accent hover:underline"
          >
            anmelden
          </Link>
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Konto wird erstellt…" : "Registrieren und fortfahren"}
      </Button>
    </form>
  );
}
