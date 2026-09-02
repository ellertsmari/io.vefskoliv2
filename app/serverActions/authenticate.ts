"use server";
import { signIn } from "../../auth";
import { AuthError, type CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { PENDING_APPROVAL_CODE } from "app/lib/authErrors";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          // Right password, account not approved yet. Distinct on purpose:
          // "invalid credentials" here sends people off to register again.
          if ((error as CredentialsSignin).code === PENDING_APPROVAL_CODE) {
            return "Your account is waiting for a teacher to approve it. Try again once they have.";
          }
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
  redirect("/LMS/dashboard");
}
