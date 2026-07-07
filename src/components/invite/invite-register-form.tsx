"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { registerViaInvite } from "@/actions/invites";
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
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await registerViaInvite({
      token,
      name: name.trim(),
      password,
      confirmPassword,
    });

    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Registrierung fehlgeschlagen");
      return;
    }

    router.push(result.data.redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Konto wird erstellt…" : "Registrieren und fortfahren"}
      </Button>
    </form>
  );
}
