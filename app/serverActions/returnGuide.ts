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

const ReturnFormSchema = z.object({
  projectUrl: z.string().min(2, { message: "Please enter a valid URL" }).trim(),
  liveVersion: z
    .string()
    .min(2, { message: "Please enter a valid URL" })
    .trim(),
  projectName: z
    .string()
    .min(2, { message: "Please enter a valid project name" })
    .trim(),
  comment: z
    .string()
    .min(2, { message: "Please enter a valid description" })
    .trim(),
  guideId: z.string().trim(),
  pictureUrl: z.string().trim().optional(),
});
