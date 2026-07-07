import { redirect } from "next/navigation";

import { isAppAdmin } from "@/lib/auth-helpers";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!(await isAppAdmin(session.user.id))) {
    redirect("/");
  }
  return <>{children}</>;
}
