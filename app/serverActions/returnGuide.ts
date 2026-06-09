"use server";
import { AdapterUser } from "next-auth/adapters";
import { auth } from "../../auth";
import { Return } from "../models/return";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

export type ReturnFormData = {
  projectUrl?: string;
  liveVersion?: string;
  projectName?: string;
  comment?: string;
  pictureUrl?: string;
  guideId?: string;
} | null;

type ReturnFormState = ActionResult<void> | undefined;

export async function returnGuide(
  state: ReturnFormState,
  data: ReturnFormData
): Promise<ActionResult<void>> {
  const validatedFields = ReturnFormSchema.safeParse(data);

  if (!validatedFields.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validatedFields.error.flatten().fieldErrors
    );
  }

  const {
    projectUrl,
    projectName,
    comment,
    liveVersion,
    guideId,
    pictureUrl,
  } = validatedFields.data;

  const session = await auth();

  if (!session?.user) {
    return failure("You must be logged in to submit a return");
  }
  const user = session?.user as AdapterUser;

  try {
    await Return.create({
      projectUrl,
      projectName,
      comment,
      liveVersion,
      owner: new ObjectId(user.id),
      guide: new ObjectId(guideId),
      pictureUrl,
    });

    return successNoData("Return submitted successfully");
  } catch (e) {
    return handleActionError("returnGuide", e, "Failed to submit return");
  }
}

// A typo'd URL doesn't just hurt the submitter: a classmate gets assigned to
// review the return and hits a dead link. So URLs are actually validated as
// URLs (the client normalizes bare domains to https:// before submitting).
const urlField = (message: string) => z.string().trim().url({ message });

const ReturnFormSchema = z.object({
  projectUrl: urlField(
    "Please enter a valid URL, including https:// (e.g. https://github.com/you/project)"
  ),
  liveVersion: urlField(
    "Please enter a valid URL, including https:// (e.g. https://you.github.io/project)"
  ),
  projectName: z
    .string()
    .min(2, { message: "Please enter a valid project name" })
    .trim(),
  comment: z
    .string()
    .min(2, { message: "Please enter a valid description" })
    .trim(),
  guideId: z.string().trim(),
  // optional, but if present it must be a real URL; empty string means absent
  pictureUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    urlField("Please enter a valid image URL or leave the field empty").optional()
  ),
});
