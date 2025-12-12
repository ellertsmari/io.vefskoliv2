"use server";

import { auth } from "auth";
import { connectToDatabase } from "./mongoose-connector";
import { User } from "models/user";
import { cookies } from "next/headers";
import { hasTeacherPermissions } from "utils/userUtils";
import {
  failure,
  success,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

type UserListItem = { id: string; name: string; email: string; role: string };

export async function getAllUsers(): Promise<ActionResult<UserListItem[]>> {
  const session = await auth();

  if (!hasTeacherPermissions(session)) {
    return failure(ErrorMessages.NOT_AUTHORIZED);
  }

  try {
    await connectToDatabase();
    const users = await User.find({}, { _id: 1, name: 1, email: 1, role: 1 })
      .sort({ name: 1 })
      .lean();

    const userList = users.map((user) => ({
      id: (user._id as unknown as { toString(): string }).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }));

    return success(userList);
  } catch (error) {
    return handleActionError(
      "getAllUsers",
      error,
      ErrorMessages.FAILED_TO_FETCH("users")
    );
  }
}

export async function setAlias(userId: string): Promise<ActionResult<void>> {
  const session = await auth();

  if (!hasTeacherPermissions(session)) {
    return failure(ErrorMessages.NOT_AUTHORIZED);
  }

  try {
    await connectToDatabase();
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return failure(ErrorMessages.NOT_FOUND("User"));
    }

    // Store the aliased user ID in a cookie
    const cookieStore = await cookies();
    cookieStore.set("aliased-user", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return successNoData("Alias set successfully");
  } catch (error) {
    return handleActionError("setAlias", error, "Failed to set alias");
  }
}

export async function clearAlias(): Promise<ActionResult<void>> {
  const session = await auth();

  if (!session?.user) {
    return failure(ErrorMessages.NOT_LOGGED_IN);
  }

  try {
    // Remove the aliased user cookie
    const cookieStore = await cookies();
    cookieStore.delete("aliased-user");

    return successNoData("Alias cleared successfully");
  } catch (error) {
    return handleActionError("clearAlias", error, "Failed to clear alias");
  }
}