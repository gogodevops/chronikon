import { redirect } from "next/navigation";

import { getUserLandingPath } from "@/actions/projects";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  redirect(await getUserLandingPath(session.user.id));
}
