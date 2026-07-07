import { listAppUsers } from "@/actions/users";
import { AdminUsersView } from "@/components/views/admin-users-view";

export default async function AdminUsersPage() {
  const users = await listAppUsers();

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
    />
  );
}
