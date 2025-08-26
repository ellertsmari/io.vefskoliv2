"use server";

import bcrypt from "bcrypt";
import { signIn, getUser } from "../../auth";
import { User } from "../models/user";
import { z } from "zod";

type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function signUp(state: SignupFormState, formData: FormData) {
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
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        message: "User with this email already exists.",
      };
    }
    
    console.error('User creation error:', error);
    return {
      success: false,
      message: "Failed to create user. Please try again later.",
    };
  }

  try {
    const user = await getUser(email);
    if (!user) {
      return {
        success: false,
        message: "User created but failed to retrieve. Please try logging in.",
      };
    }
    
    await signIn("credentials", {
      email,
      password: rawPassword,
    });
  } catch (error) {
    console.error('Sign in error after signup:', error);
    return {
      success: false,
      message: "Account created successfully, but automatic login failed. Please log in manually.",
    };
  }

  return {
    success: true,
    message:
      "Successfully registered. Now logging you in. If it fails you will be redirected to the login page.",
  };
}

const SignupFormSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters long." })
    .trim(),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters long." })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Your password must be at least 8 characters long" })
    .trim(),
});
