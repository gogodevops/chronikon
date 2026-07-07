"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { loginAction, type LoginState } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/p/bibel/dashboard";

  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
      <h1 className="mb-1 text-2xl font-bold text-accent">Chronikon</h1>
      <p className="mb-6 text-sm text-muted-foreground">Anmelden</p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <div>
          <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
            E-Mail
          </label>
          <Input
            name="email"
            type="email"
            required
            defaultValue="max@chronikon.dev"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
            Passwort
          </label>
          <Input
            name="password"
            type="password"
            required
            defaultValue="demo123"
            autoComplete="current-password"
          />
        </div>
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Anmelden…" : "Anmelden"}
        </Button>
      </form>

      <p className="mt-4 text-center text-[0.82rem] text-muted-foreground">
        Noch kein Konto?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
      <h1 className="mb-1 text-2xl font-bold text-accent">Chronikon</h1>
      <p className="mb-6 text-sm text-muted-foreground">Anmelden…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
