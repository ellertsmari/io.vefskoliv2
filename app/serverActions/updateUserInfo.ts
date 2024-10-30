"use server";
import {
  OptionalUserInfo,
  OptionalUserInfoKeys,
  User,
  UserDocument,
} from "models/user";
import { objOnlyHasEnumKeys } from "utils/typeGuards";
import { ObjectId } from "mongodb";

export const updateUserInfo = async (
  userId: string,
  updatedUserInfo: OptionalUserInfo
) => {
  let user: UserDocument;

  try {
    user = (await User.findById(new ObjectId(userId))) as UserDocument;
    console.log("user was found", user);
    if (!user) {
      throw new Error();
    }
  } catch (error) {
    throw new Error("User not found");
  }

  if (!objOnlyHasEnumKeys(updatedUserInfo, OptionalUserInfoKeys)) {
    throw new Error("Invalid user info");
  }

  try {
    await user.updateUserInfo(updatedUserInfo);
  } catch (error) {
    throw new Error("Failed to update user info");
  }
};
