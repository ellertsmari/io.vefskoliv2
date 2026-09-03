"use server";

import { z } from "zod";
import { ObjectId } from "mongodb";
import type { ReviewType } from "models/review";
import { auth } from "../../auth";
import { Review, Vote } from "models/review";
import { Return } from "models/return";
import { connectToDatabase } from "./mongoose-connector";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

type ReviewDataType = {
  vote: Vote | undefined;
  comment: string | undefined;
  returnId: string | undefined;
  guideId: string | undefined;
};

type ReviewFormState = ActionResult<void> | undefined;

export async function returnReview(
  state: ReviewFormState,
  data: ReviewDataType
): Promise<ActionResult<void>> {
  const validatedFields = ReviewFormSchema.safeParse({
    vote: data.vote,
    comment: data.comment,
    returnId: data.returnId,
    guideId: data.guideId,
  });

  if (!validatedFields.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validatedFields.error.flatten().fieldErrors
    );
  }

  const { vote, comment, returnId, guideId } = validatedFields.data;
  const session = await auth();

  if (!session?.user) {
    return failure("You must be logged in to submit a review");
  }
  const { user } = session;

  try {
    await connectToDatabase();

    // The form only offers returns the student is allowed to review, but
    // the ids arrive from the browser and the rules have to hold here too:
    // the return must exist, belong to the guide it claims, not be their
    // own, and not already carry a review from them. Each of these fed the
    // grading pipeline before. ("Return" is one submission of a guide; the
    // guide's project brief is a different thing, so don't say "project".)
    const submission = await Return.findById(returnId, { owner: 1, guide: 1 })
      .lean<{ owner: ObjectId; guide: ObjectId }>();
    if (!submission) return failure(ErrorMessages.NOT_FOUND("Return"));
    if (!submission.guide.equals(guideId)) {
      return failure("That return does not belong to this guide.");
    }
    if (submission.owner.equals(user.id)) {
      return failure("You cannot review your own return.");
    }
    const alreadyReviewed = await Review.exists({
      owner: user.id,
      return: returnId,
    });
    if (alreadyReviewed) {
      return failure("You have already reviewed this return.");
    }

    const reviewData: Omit<ReviewType, "createdAt"> = {
      vote,
      comment,
      owner: new ObjectId(user.id),
      return: new ObjectId(returnId),
      guide: new ObjectId(guideId),
    };
    await Review.create(reviewData);

    return successNoData("Review submitted successfully");
  } catch (e) {
    return handleActionError("returnReview", e, "Failed to submit review");
  }
}

const objectId = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => ObjectId.isValid(value), {
      message: `Please append a valid ${label}`,
    });

const ReviewFormSchema = z.object({
  vote: z.nativeEnum(Vote).refine((val) => Object.values(Vote).includes(val), {
    message: "Vote type is invalid",
  }),
  returnId: objectId("returnId"),
  guideId: objectId("guideId"),
  comment: z
    .string()
    .trim()
    .min(2, { message: "Please provide a valid review comment" })
    .max(5000, { message: "Keep the review under 5000 characters" }),
});
