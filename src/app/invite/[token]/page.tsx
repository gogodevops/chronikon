import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptInvite } from "@/actions/projects";
import { acceptUserInvite, lookupInviteByToken } from "@/actions/invites";
import { InviteRegisterForm } from "@/components/invite/invite-register-form";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  const invite = await lookupInviteByToken(token);

  if (!invite) {
    return (
      <InviteShell>
        <h1 className="text-xl font-semibold">Einladung ungültig</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dieser Link existiert nicht oder wurde widerrufen.
        </p>
        <Link href="/login" className="mt-6 inline-block text-accent hover:underline">
          Zur Anmeldung
        </Link>
      </InviteShell>
    );
  }

  const projectName =
    invite.kind === "project" ? invite.project.name : undefined;
  const projectSlug =
    invite.kind === "project" ? invite.project.slug : undefined;
  const projectIcon =
    invite.kind === "project" ? invite.project.icon : undefined;

  if (invite.acceptedAt) {
    return (
      <InviteShell>
        <h1 className="text-xl font-semibold">Bereits angenommen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {invite.kind === "project"
            ? `Du bist bereits Mitglied von ${invite.project.name}.`
            : "Dein Zugang wurde bereits eingerichtet."}
        </p>
        <Link
          href={
            invite.kind === "project"
              ? `/p/${invite.project.slug}/dashboard`
              : "/"
          }
          className="mt-6 inline-block text-accent hover:underline"
        >
          {invite.kind === "project" ? "Zum Projekt →" : "Zur Startseite →"}
        </Link>
      </InviteShell>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <InviteShell>
        <h1 className="text-xl font-semibold">Einladung abgelaufen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bitte den Admin um eine neue Einladung.
        </p>
      </InviteShell>
    );
  }

  const existingUser = await db.user.findUnique({
    where: { email: invite.email.toLowerCase() },
  });

  if (!session?.user?.id) {
    if (existingUser) {
      redirect(
        `/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`,
      );
    }

    return (
      <InviteShell>
        <div className="mb-6 text-center">
          {projectIcon && (
            <span className="mb-2 block text-3xl" aria-hidden>
              {projectIcon}
            </span>
          )}
          <h1 className="text-xl font-semibold">Einladung annehmen</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {invite.kind === "project"
              ? `Du wurdest zu „${projectName}“ eingeladen.`
              : "Du wurdest zu Chronikon eingeladen."}
          </p>
          <p className="mt-1 text-[0.78rem] text-muted-foreground">
            Lege dein Passwort fest, um fortzufahren.
          </p>
        </div>
        <InviteRegisterForm
          token={token}
          email={invite.email}
          projectName={projectName}
        />
      </InviteShell>
    );
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <InviteShell>
        <h1 className="text-xl font-semibold">Falsches Konto</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Diese Einladung gilt für <strong>{invite.email}</strong>. Du bist
          angemeldet als <strong>{user?.email}</strong>.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
          className="mt-6 inline-block text-accent hover:underline"
        >
          Mit anderem Konto anmelden
        </Link>
      </InviteShell>
    );
  }

  if (invite.kind === "project") {
    const result = await acceptInvite(token);
    if (!result.success) {
      return (
        <InviteShell>
          <h1 className="text-xl font-semibold">Fehler</h1>
          <p className="mt-2 text-sm text-muted-foreground">{result.error}</p>
        </InviteShell>
      );
    }
    redirect(`/p/${projectSlug}/dashboard`);
  }

  const userResult = await acceptUserInvite(token);
  if (!userResult.success) {
    return (
      <InviteShell>
        <h1 className="text-xl font-semibold">Fehler</h1>
        <p className="mt-2 text-sm text-muted-foreground">{userResult.error}</p>
      </InviteShell>
    );
  }

  redirect(userResult.data.redirectTo);
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-2 p-8">
        {children}
      </div>
    </div>
  );
}
