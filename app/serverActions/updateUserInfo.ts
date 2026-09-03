"use server";
import { z } from "zod";
import { OptionalUserInfo, User, UserDocument } from "models/user";
import { optionalStoredImageSchema } from "utils/imageUpload";
import { ObjectId } from "mongodb";
import { auth, updateSession } from "../../auth";
import { connectToDatabase } from "./mongoose-connector";
import {
  failure,
  successNoData,
  handleActionError,
  logError,
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

  const validated = ProfileSchema.safeParse(updatedUserInfo);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  try {
    // Mongoose buffers queries when it has no connection and gives up after
    // 10s. A server action can land on a lambda where nothing has connected
    // yet, so every entry point connects for itself.
    await connectToDatabase();

    const user = (await User.findById(
      new ObjectId(session.user.id)
    )) as UserDocument;

    if (!user) {
      return failure(ErrorMessages.NOT_FOUND("User"));
    }

    await user.updateUserInfo(validated.data);

    // The session token carries a snapshot of the profile (it is what the
    // header renders). Refresh it now; if that fails the token catches up on
    // its own within a few minutes, so the save is still a success.
    try {
      await updateSession({});
    } catch (error) {
      logError("updateUserInfo", error, { step: "updateSession" });
    }

    return successNoData("Profile saved");
  } catch (error) {
    return handleActionError(
      "updateUserInfo",
      error,
      ErrorMessages.FAILED_TO_UPDATE("user info")
    );
  }
};

const PROFILE_TEXT_MAX = 2000;
const profileText = z
  .string()
  .trim()
  .max(PROFILE_TEXT_MAX, {
    message: `Keep this under ${PROFILE_TEXT_MAX} characters`,
  })
  .optional();

// `.strict()` refuses unknown keys, so this cannot be used to set fields the
// profile form does not own (role, status, email).
const ProfileSchema = z
  .object({
    background: profileText,
    careerGoals: profileText,
    interests: profileText,
    favoriteArtists: profileText,
    avatarUrl: optionalStoredImageSchema.optional(),
  })
  .strict();
