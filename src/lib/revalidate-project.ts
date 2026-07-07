import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export async function revalidateProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  if (!project) return;
  const base = `/p/${project.slug}`;
  revalidatePath(base, "layout");
  for (const sub of [
    "",
    "/dashboard",
    "/timeline",
    "/map",
    "/table",
    "/graph",
    "/discussions",
    "/notifications",
    "/team",
    "/new",
    "/compare",
    "/export",
  ]) {
    revalidatePath(`${base}${sub}`);
  }
}
