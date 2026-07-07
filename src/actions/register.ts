"use server";

export type RegisterState = { error?: string };

export async function registerAndLoginAction(
  _prev: RegisterState,
  _formData: FormData,
): Promise<RegisterState> {
  return {
    error: "Registrierung ist deaktiviert. Bitte Zugangsdaten vom Administrator anfordern.",
  };
}
