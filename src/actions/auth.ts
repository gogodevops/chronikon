"use server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function registerUser(
  _input: {
    name: string;
    email: string;
    password: string;
  },
): Promise<ActionResult<{ userId: string }>> {
  return {
    success: false,
    error:
      "Registrierung ist deaktiviert. Bitte Zugang über eine Einladung anfordern.",
  };
}
