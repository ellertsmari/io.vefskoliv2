"use server";
import { AdapterUser } from "next-auth/adapters";
import { auth } from "../../auth";
import { Return } from "../models/return";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "./mongoose-connector";
import { z } from "zod";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";
import { optionalStoredImageSchema } from "../utils/imageUpload";
import { isActingAsTeacher } from "../utils/userUtils";

export type ReturnFormData = {
  projectUrl?: string;
  liveVersion?: string;
  projectName?: string;
  comment?: string;
  pictureUrl?: string;
  guideId?: string;
} | null;

type ReturnFormState = ActionResult<void> | undefined;

// Two returns of one guide by one student inside this window are one
// submission. (Not exported: a "use server" file may only export functions.)
const DUPLICATE_RETURN_WINDOW_MS = 10_000;

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
  if (isActingAsTeacher(session)) {
    return failure(
      "Guides are returned by students. Switch to a student view to return on their behalf."
    );
  }
  const user = session?.user as AdapterUser;

  try {
    // Mongoose buffers queries when it has no connection and gives up after
    // 10s. A server action can land on a lambda where nothing has connected
    // yet, so every entry point connects for itself.
    await connectToDatabase();

    // A double-click on the return form used to save two returns 0.4s apart.
    // Both then got handed out for review, and one classmate reviewed the same
    // work twice. Anything this close together is the same submission, so the
    // second one is dropped and reported as the success it effectively was.
    const justReturned = await Return.exists({
      owner: user.id,
      guide: guideId,
      createdAt: { $gt: new Date(Date.now() - DUPLICATE_RETURN_WINDOW_MS) },
    });
    if (justReturned) {
      return successNoData("Return submitted successfully");
    }

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
const urlField = (message: string) =>
  z
    .string()
    .trim()
    .max(2000, { message: "Keep the URL under 2000 characters" })
    .url({ message });

const ReturnFormSchema = z.object({
  projectUrl: urlField(
    "Please enter a valid URL, including https:// (e.g. https://github.com/you/project)"
  ),
  liveVersion: urlField(
    "Please enter a valid URL, including https:// (e.g. https://you.github.io/project)"
  ),
  projectName: z
    .string()
    .trim()
    .min(2, { message: "Please enter a valid project name" })
    .max(200, { message: "Keep the project name under 200 characters" }),
  comment: z
    .string()
    .trim()
    .min(2, { message: "Please enter a valid description" })
    .max(5000, { message: "Keep the description under 5000 characters" }),
  guideId: z
    .string()
    .trim()
    .refine((value) => ObjectId.isValid(value), {
      message: "Please append a valid guideId",
    }),
  // optional: an uploaded image (data URL) or a legacy pasted URL; empty
  // string means absent
  pictureUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    optionalStoredImageSchema.optional()
  ),
});
