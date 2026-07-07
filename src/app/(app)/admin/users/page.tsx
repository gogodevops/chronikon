import { listUserInvitesForAdmin } from "@/actions/invites";
import { listAppUsers } from "@/actions/users";
import { auth } from "@/auth";
import { AdminUsersView } from "@/components/views/admin-users-view";

export default async function AdminUsersPage() {
  const session = await auth();
  const [users, invites] = await Promise.all([
    listAppUsers(),
    listUserInvitesForAdmin(),
  ]);

  return (
    <AdminUsersView
      currentUserId={session?.user?.id ?? ""}
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
    />
  );
}
