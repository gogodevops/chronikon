import { listUserInvitesForAdmin } from "@/actions/invites";
import { listAppUsers } from "@/actions/users";
import { AdminUsersView } from "@/components/views/admin-users-view";
import { getMailConfigStatus } from "@/lib/mail";

export default async function AdminUsersPage() {
  const [users, invites] = await Promise.all([
    listAppUsers(),
    listUserInvitesForAdmin(),
  ]);

  return (
    <AdminUsersView
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        avatarInitials: u.avatarInitials,
        projectCount: u._count.memberships,
      }))}
      invites={invites}
      mailConfig={getMailConfigStatus()}
    />
  );
}
