"use server";

import { AuthError } from "next-auth";

import { getUserLandingPath } from "@/actions/projects";
import { signIn } from "@/auth";
import { db } from "@/lib/db";

export type LoginState = { error?: string };

async function resolveLoginRedirect(
  redirectTo: string,
  email: string,
): Promise<string> {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  if (!user) return "/";

  const landing = await getUserLandingPath(user.id);
  const target = redirectTo.trim();

  if (!target || target === "/") return landing;

  const projectMatch = target.match(/^\/p\/([^/?#]+)/);
  if (projectMatch) {
    const slug = projectMatch[1];
    const hasAccess = await db.projectMember.findFirst({
      where: { userId: user.id, project: { slug } },
    });
    return hasAccess ? target : landing;
  }

  if (target.startsWith("/invite/") || target.startsWith("/projects/") || target === "/app") {
    return target;
  }

  return landing;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = await resolveLoginRedirect(
    String(formData.get("redirectTo") ?? "/"),
    email,
  );

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-Mail oder Passwort ungültig" };
    }
    throw error;
  }

  return {};
}
