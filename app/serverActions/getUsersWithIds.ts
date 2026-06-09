"use server";
import { auth } from "../../auth";
import { User } from "models/user";
import { connectToDatabase } from "./mongoose-connector";
import { hasTeacherPermissions } from "utils/userUtils";
import type { GetUsersFilter } from "./getUsers";

type UserForReports = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

/**
 * Returns users with ids and emails for teacher-facing report views.
 *
 * Teacher-only: unlike `getUsers` (which returns only shareable profile
 * fields), this exposes emails and ids, so it requires teacher permissions.
 * The filter is a closed, typed option rather than a raw Mongo FilterQuery —
 * server actions are callable from any client with arbitrary arguments.
 */
export const getUsersWithIds = async (
  filter: GetUsersFilter = {}
): Promise<UserForReports[]> => {
  const session = await auth();
  if (!hasTeacherPermissions(session)) return [];

  const query: GetUsersFilter = {};
  if (filter.role === "teacher" || filter.role === "user") {
    query.role = filter.role;
  }

  await connectToDatabase();
  const users = await User.find(query, {
    _id: 1,
    name: 1,
    email: 1,
    role: 1,
  }).lean<Array<{ _id: unknown; name: string; email: string; role: string }>>();

  return users.map((user) => ({
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  }));
};
