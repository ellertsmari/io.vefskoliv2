"use server";
import { auth } from "../../auth";
import { OptionalUserInfoKeys, User } from "models/user";
import { connectToDatabase } from "./mongoose-connector";
import { ShareableUserInfo } from "types/types";

/**
 * Server actions are public endpoints: any logged-in client can invoke them
 * with arbitrary arguments. The filter is therefore a closed, typed option
 * (not a raw Mongo FilterQuery) and the query projects only the shareable
 * fields, so nothing sensitive is ever read out of the database here.
 */
export type GetUsersFilter = { role?: "teacher" | "user" };

const SHAREABLE_PROJECTION: Record<string, 1> = { name: 1 };
for (const key of Object.keys(OptionalUserInfoKeys)) {
  SHAREABLE_PROJECTION[key] = 1;
}

export const getUsers = async (
  filter: GetUsersFilter = {}
): Promise<ShareableUserInfo[]> => {
  const session = await auth();
  if (!session?.user) return [];

  const query: GetUsersFilter = {};
  if (filter.role === "teacher" || filter.role === "user") {
    query.role = filter.role;
  }

  await connectToDatabase();
  const users = await User.find(query, SHAREABLE_PROJECTION).lean<
    Array<Partial<ShareableUserInfo>>
  >();

  return users.map((userInfo) => calculateShareableInfo(userInfo));
};

const calculateShareableInfo = (
  userInfo: Partial<ShareableUserInfo>
): ShareableUserInfo => {
  const shareableKeys = Object.keys(OptionalUserInfoKeys).concat(
    "name"
  ) as (keyof ShareableUserInfo)[];

  const shareableInfo = shareableKeys.reduce((acc, key) => {
    if (userInfo[key] && userInfo[key] !== undefined) {
      acc[key] = userInfo[key] as string;
    }
    return acc;
  }, {} as ShareableUserInfo);
  return shareableInfo;
};
