"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { auth } from "../../auth";
import { User } from "../models/user";
import { connectToDatabase } from "./mongoose-connector";
import { hasTeacherPermissions } from "utils/userUtils";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

/**
 * Teacher-side of self-registration: see who is waiting, let them in, or
 * turn them away.
 *
 * Every update is filtered on `status: "pending"` as well as the id, so a
 * stale button press cannot deactivate an approved account or delete one
 * that is already in use. Emails are exposed here — that is how a teacher
 * tells a real student from a stranger — so all three are teacher-only.
 */

export type PendingUser = {
  id: string;
  name: string;
  email: string;
  /** ISO date-time of the registration */
  createdAt: string;
};

const userIdSchema = z
  .string()
  .refine((value) => ObjectId.isValid(value), { message: "Invalid id" });

export async function getPendingUsers(): Promise<PendingUser[]> {
  const session = await auth();
  if (!hasTeacherPermissions(session)) return [];

  await connectToDatabase();
  const users = await User.find(
    { status: "pending" },
    { _id: 1, name: 1, email: 1, createdAt: 1 }
  )
    .sort({ createdAt: 1 })
    .lean<
      Array<{ _id: unknown; name: string; email: string; createdAt?: Date }>
    >();

  return users.map((user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    createdAt: (user.createdAt ?? new Date(0)).toISOString(),
  }));
}

export async function approveUser(userId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!hasTeacherPermissions(session)) {
    return failure(ErrorMessages.NOT_AUTHORIZED);
  }
  const validated = userIdSchema.safeParse(userId);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);

  try {
    await connectToDatabase();
    const result = await User.updateOne(
      { _id: new ObjectId(validated.data), status: "pending" },
      { $set: { status: "active" } }
    );
    if (result.matchedCount === 0) {
      return failure(ErrorMessages.NOT_FOUND("Pending account"));
    }
    return successNoData("Account approved");
  } catch (error) {
    return handleActionError(
      "approveUser",
      error,
      ErrorMessages.FAILED_TO_UPDATE("account")
    );
  }
}

/**
 * Deletes the account outright. A rejected registration holds nothing but a
 * name, an email and a password hash, and keeping a "rejected" row around
 * would only block that email from ever trying again.
 */
export async function rejectUser(userId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!hasTeacherPermissions(session)) {
    return failure(ErrorMessages.NOT_AUTHORIZED);
  }
  const validated = userIdSchema.safeParse(userId);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);

  try {
    await connectToDatabase();
    const result = await User.deleteOne({
      _id: new ObjectId(validated.data),
      status: "pending",
    });
    if (result.deletedCount === 0) {
      return failure(ErrorMessages.NOT_FOUND("Pending account"));
    }
    return successNoData("Registration rejected");
  } catch (error) {
    return handleActionError(
      "rejectUser",
      error,
      ErrorMessages.FAILED_TO_DELETE("account")
    );
  }
}
