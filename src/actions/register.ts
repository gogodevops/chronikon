"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { registerUser } from "@/actions/auth";
import { getUserLandingPath } from "@/actions/projects";
import { signIn } from "@/auth";

export type RegisterState = { error?: string };

export async function registerAndLoginAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await registerUser({ name, email, password });
  if (!result.success) {
    return { error: result.error };
  }

  const landingPath = await getUserLandingPath(result.data.userId);

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: landingPath,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registrierung erfolgreich, Anmeldung fehlgeschlagen" };
    }
    throw error;
  }

  redirect(landingPath);
}
