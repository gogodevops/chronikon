"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  registerAndLoginAction,
  type RegisterState,
} from "@/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAndLoginAction,
    {},
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
        <h1 className="mb-1 text-2xl font-bold text-accent">Chronikon</h1>
        <p className="mb-6 text-sm text-muted-foreground">Konto erstellen</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            <Input name="name" required autoComplete="name" />
          </div>
          <div>
            <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
              E-Mail
            </label>
            <Input name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
              Passwort (min. 8 Zeichen)
            </label>
            <Input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Registrieren…" : "Registrieren"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[0.82rem] text-muted-foreground">
          Bereits registriert?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
