"use server";

import { SignupFormSchema, FormState } from "../utils/formvalidation";
import bcrypt from "bcrypt";

import { signIn, signOut as s } from "../../auth";
import { AuthError } from "next-auth";
import {
  OptionalUserInfo,
  RequiredUserInfo,
  User,
  UserDocument,
} from "../models/user";

export const signOut = s; //needs to be in actions.ts so that it can be called on the client side
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function signUp(state: FormState, formData: FormData) {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const {
    firstName,
    lastName,
    email,
    password: rawPassword,
  } = validatedFields.data;
  const password = await bcrypt.hash(rawPassword, 10);

  try {
    await User.create({
      name: firstName + " " + lastName,
      email,
      password,
      role: "user",
    });
  } catch (error) {
    return {
      success: false,
      message: "Failed to create user. May already exist.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password: rawPassword,
    });
  } catch (error) {
    console.error("Failed to sign in user:", error);
  }
  return {
    success: true,
    message:
      "Successfully registered. Now logging you in. If it fails you will be redirected to the login page.",
  };
}

// currently not secure and allows for any user to be updated
export async function updateUserInfo(email: string, info: OptionalUserInfo) {
  const response = await fetch("http://localhost:3000" + "/api/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, info }),
  });
  console.log("response", response);
  if (!response.ok) {
    console.log("response not ok", response);
    throw new Error("Failed to update user info");
  }

  const data = await response.json();
  return data;
}
