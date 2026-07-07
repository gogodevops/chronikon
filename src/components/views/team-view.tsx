"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  Check,
  Copy,
  Mail,
  Shield,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import {
  addProjectMember,
  removeProjectMember,
  revokeProjectInvite,
  updateMemberRole,
} from "@/actions/team";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runServerAction } from "@/lib/action-feedback";
import { PROJECT_ROLES, ROLE_META } from "@/lib/constants";
import { ViewFrame } from "@/components/ui/chronikon-shell";

export type TeamMember = {
  id: string;
  userId: string;
  role: keyof typeof ROLE_META;
  joinedAt: Date;
  name: string;
  email: string;
  avatarInitials: string | null;
  image: string | null;
};

export type TeamInvite = {
  id: string;
  email: string;
  role: keyof typeof ROLE_META;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  invitedByName: string;
};

export function TeamView({
  members,
  invites,
  currentUserId,
  projectId,
  isAppAdmin = false,
}: {
  members: TeamMember[];
  invites: TeamInvite[];
  currentUserId: string;
  projectId: string;
  isAppAdmin?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<string>("commenter");
  const [createAccount, setCreateAccount] = React.useState(false);
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [lastInviteLink, setLastInviteLink] = React.useState<string | null>(
    null,
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setLastInviteLink(null);

    const ok = await runServerAction(async () => {
      const result = await addProjectMember({
        projectId,
        email,
        role: role as TeamMember["role"],
        name: createAccount ? name : undefined,
        password: createAccount ? password : undefined,
      });
      if (result.success && result.data.inviteToken) {
        const link = `${window.location.origin}/invite/${result.data.inviteToken}`;
        setLastInviteLink(link);
      }
      return result;
    });

    setPending(false);
    if (ok) {
      setEmail("");
      setName("");
      setPassword("");
      setCreateAccount(false);
      router.refresh();
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await runServerAction(() =>
      updateMemberRole({
        projectId,
        memberId,
        role: newRole as TeamMember["role"],
      }),
    );
    router.refresh();
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!window.confirm(`${memberName} aus dem Projekt entfernen?`)) return;
    await runServerAction(() => removeProjectMember(projectId, memberId));
    router.refresh();
  };

  const handleRevokeInvite = async (inviteId: string) => {
    await runServerAction(() => revokeProjectInvite(projectId, inviteId));
    router.refresh();
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    window.alert("Einladungslink kopiert");
  };

  return (
    <ViewFrame
      eyebrow="Verwaltung"
      title="Team"
      description="Mitglieder einladen, Rollen vergeben und Zugriffsrechte verwalten."
      maxWidth="xl"
    >
        <section className="mb-8 rounded-xl border border-border bg-surface-2/80 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-accent" />
            Berechtigungen
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[0.78rem]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Rolle</th>
                  <th className="pb-2 px-3 font-medium text-center">Lesen</th>
                  <th className="pb-2 px-3 font-medium text-center">Schreiben</th>
                  <th className="pb-2 px-3 font-medium text-center">
                    Diskutieren
                  </th>
                  <th className="pb-2 pl-3 font-medium text-center">Admin</th>
                </tr>
              </thead>
              <tbody>
                {PROJECT_ROLES.map((r) => {
                  const meta = ROLE_META[r];
                  return (
                    <tr key={r} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <span className="font-medium">{meta.label}</span>
                        <span className="ml-2 text-muted-foreground">
                          {meta.description}
                        </span>
                      </td>
                      <PermissionCell ok={meta.canRead} />
                      <PermissionCell ok={meta.canWrite} />
                      <PermissionCell ok={meta.canDiscuss} />
                      <PermissionCell ok={meta.canManageTeam} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-surface-2/80 p-5">
              <h3 className="mb-4 text-sm font-semibold">
                Mitglieder ({members.length})
              </h3>
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-3/50 px-3 py-2.5"
                  >
                    <Avatar className="h-8 w-8">
                      {member.image && (
                        <AvatarImage src={member.image} alt={member.name} />
                      )}
                      <AvatarFallback className="text-[0.62rem]">
                        {member.avatarInitials ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.82rem] font-medium">
                        {member.name}
                        {member.userId === currentUserId && (
                          <span className="ml-1.5 text-[0.68rem] text-muted-foreground">
                            (du)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[0.72rem] text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <Select
                      value={member.role}
                      onValueChange={(v) => handleRoleChange(member.id, v)}
                      disabled={member.userId === currentUserId}
                    >
                      <SelectTrigger className="h-8 w-[8.5rem] text-[0.75rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-[0.78rem]">
                            {ROLE_META[r].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {member.userId !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(member.id, member.name)}
                        title="Entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {invites.length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-surface-2/80 p-5">
                <h3 className="mb-3 text-sm font-semibold">
                  Offene Einladungen ({invites.length})
                </h3>
                <ul className="space-y-2">
                  {invites.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.82rem]">{invite.email}</p>
                        <p className="text-[0.68rem] text-muted-foreground">
                          {ROLE_META[invite.role].label} · läuft ab{" "}
                          {formatDistanceToNow(new Date(invite.expiresAt), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyInviteLink(invite.token)}
                        title="Link kopieren"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRevokeInvite(invite.id)}
                        title="Widerrufen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="lg:col-span-2">
            <form
              onSubmit={handleAdd}
              className="rounded-xl border border-border bg-surface-2/80 p-5"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <UserPlus className="h-4 w-4 text-accent" />
                Mitglied hinzufügen
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[0.72rem] text-muted-foreground">
                    E-Mail
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@beispiel.de"
                    className="h-9 text-[0.82rem]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[0.72rem] text-muted-foreground">
                    Rolle
                  </label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-9 text-[0.82rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_META[r].label} — {ROLE_META[r].short}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-[0.78rem]">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className="rounded border-border"
                    disabled={!isAppAdmin}
                  />
                  Neuen Account direkt anlegen
                </label>

                {!isAppAdmin && (
                  <p className="text-[0.68rem] text-muted-foreground">
                    Neue Accounts legst du unter{" "}
                    <a href="/admin/users" className="text-accent hover:underline">
                      Nutzer verwalten
                    </a>{" "}
                    an.
                  </p>
                )}

                {createAccount && isAppAdmin && (
                  <>
                    <div>
                      <label className="mb-1 block text-[0.72rem] text-muted-foreground">
                        Name
                      </label>
                      <Input
                        required={createAccount}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Vor- und Nachname"
                        className="h-9 text-[0.82rem]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[0.72rem] text-muted-foreground">
                        Passwort
                      </label>
                      <Input
                        type="password"
                        required={createAccount}
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 Zeichen"
                        className="h-9 text-[0.82rem]"
                      />
                    </div>
                  </>
                )}

                <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
                  {createAccount && isAppAdmin
                    ? "Legt sofort einen Account an und fügt ihn dem Projekt hinzu."
                    : "Bestehende Nutzer werden direkt hinzugefügt. Unbekannte E-Mails erhalten eine Einladung."}
                </p>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={pending}
                >
                  {pending ? "Wird hinzugefügt…" : "Hinzufügen"}
                </Button>

                {lastInviteLink && (
                  <div className="rounded-lg border border-accent/30 bg-accent-dim p-3">
                    <p className="mb-2 text-[0.72rem] font-medium text-accent">
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
                        onClick={() => copyInviteLink(lastInviteLink.split("/").pop()!)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </section>
        </div>
    </ViewFrame>
  );
}

function PermissionCell({ ok }: { ok: boolean }) {
  return (
    <td className="px-3 py-2.5 text-center">
      {ok ? (
        <Check className="mx-auto h-4 w-4 text-green" />
      ) : (
        <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
      )}
    </td>
  );
}
