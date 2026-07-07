import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptInvite } from "@/actions/projects";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invite = await db.projectInvite.findUnique({
    where: { token },
    include: { project: { select: { name: true, slug: true, icon: true } } },
  });

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

  if (invite.acceptedAt) {
    return (
      <InviteShell>
        <h1 className="text-xl font-semibold">Bereits angenommen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du bist bereits Mitglied von {invite.project.name}.
        </p>
        <Link
          href={`/p/${invite.project.slug}/dashboard`}
          className="mt-6 inline-block text-accent hover:underline"
        >
          Zum Projekt →
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

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
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
        <Link href="/login" className="mt-6 inline-block text-accent hover:underline">
          Mit anderem Konto anmelden
        </Link>
      </InviteShell>
    );
  }

  const result = await acceptInvite(token);
  if (!result.success) {
    return (
      <InviteShell>
        <h1 className="text-xl font-semibold">Fehler</h1>
        <p className="mt-2 text-sm text-muted-foreground">{result.error}</p>
      </InviteShell>
    );
  }

  redirect(`/p/${invite.project.slug}/dashboard`);
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-2 p-8 text-center">
        {children}
      </div>
    </div>
  );
}
