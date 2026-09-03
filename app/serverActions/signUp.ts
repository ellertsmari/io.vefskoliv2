"use server";

import bcrypt from "bcrypt";
import { User } from "../models/user";
import { connectToDatabase } from "./mongoose-connector";
import { z } from "zod";
import { consume, rateLimitKey } from "../utils/rateLimit";
import { getClientIp } from "../lib/clientIp";
import {
  failure,
  successNoData,
  logError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

type SignupFormState = ActionResult<void> | undefined;

/** Registrations one connection may start per hour. */
const SIGNUP_LIMIT = { limit: 5, windowSeconds: 60 * 60 };

// Not exported: a "use server" module may only export async functions.
const SIGNUP_SUCCESS_MESSAGE =
  "Your account is created. A teacher needs to approve it before you can sign in — you'll get access once that's done.";

/**
 * Self-registration creates a PENDING account and nothing more.
 *
 * Anyone on the internet can reach this form, and a logged-in account sees
 * the whole class: names, project links, group work, recorded lessons. So the
 * account is not usable until a teacher approves it on the people page, and
 * there is deliberately no automatic sign-in here any more — `authorize`
 * refuses pending accounts, and it would only have produced a confusing
 * "login failed" a second after "registered successfully".
 */
export async function signUp(
  state: SignupFormState,
  formData: FormData
): Promise<ActionResult<void>> {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validatedFields.error.flatten().fieldErrors
    );
  }

  const {
    firstName,
    lastName,
    email,
    password: rawPassword,
  } = validatedFields.data;

  // Every account created here lands on a teacher's approval list, so a
  // script must not be able to fill it faster than a person can read it.
  const throttle = await consume(
    rateLimitKey("signup:ip", await getClientIp()),
    SIGNUP_LIMIT.limit,
    SIGNUP_LIMIT.windowSeconds
  );
  if (!throttle.allowed) {
    return failure(
      "Too many registrations from this connection. Try again in an hour."
    );
  }

  const password = await bcrypt.hash(rawPassword, 10);

  try {
    // bufferCommands is disabled on the connection, so User.create fails on a
    // cold start unless we connect explicitly (previously this relied on some
    // earlier request having already opened the connection).
    await connectToDatabase();
    await User.create({
      name: firstName + " " + lastName,
      email,
      password,
      role: "user",
      status: "pending",
    });
  } catch (error: unknown) {
    // Check for duplicate email (MongoDB error code 11000)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return failure("User with this email already exists.");
    }

    logError("signUp", error, { email });
    return failure(ErrorMessages.FAILED_TO_CREATE("user"));
  }

  return successNoData(SIGNUP_SUCCESS_MESSAGE);
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
