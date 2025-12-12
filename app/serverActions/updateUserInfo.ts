"use server";
import {
  OptionalUserInfo,
  OptionalUserInfoKeys,
  User,
  UserDocument,
} from "models/user";
import { objOnlyHasEnumKeys } from "utils/typeGuards";
import { ObjectId } from "mongodb";
import { auth } from "../../auth";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

export const updateUserInfo = async (
  updatedUserInfo: OptionalUserInfo
): Promise<ActionResult<void>> => {
  const session = await auth();

  if (!session?.user) {
    return failure(ErrorMessages.NOT_LOGGED_IN);
  }

  const isValid = await objOnlyHasEnumKeys(
    updatedUserInfo,
    OptionalUserInfoKeys
  );
  if (!isValid) {
    return failure(ErrorMessages.INVALID_INPUT);
  }

  try {
    const user = (await User.findById(
      new ObjectId(session.user.id)
    )) as UserDocument;

    if (!user) {
      return failure(ErrorMessages.NOT_FOUND("User"));
    }

    await user.updateUserInfo(updatedUserInfo);
    return successNoData("User info updated successfully");
  } catch (error) {
    return handleActionError(
      "updateUserInfo",
      error,
      ErrorMessages.FAILED_TO_UPDATE("user info")
    );
  }
};
