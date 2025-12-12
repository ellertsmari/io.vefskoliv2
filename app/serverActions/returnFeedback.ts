"use server";

import { z } from "zod";
import { ObjectId } from "mongodb";
import type { ReviewType } from "models/review";
import { auth } from "../../auth";
import { Review, Vote } from "models/review";
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

  const reviewData: Omit<ReviewType, "createdAt"> = {
    vote,
    comment,
    owner: new ObjectId(user.id),
    return: new ObjectId(returnId),
    guide: new ObjectId(guideId),
  };

  try {
    await connectToDatabase();
    await Review.create(reviewData);

    return successNoData("Review submitted successfully");
  } catch (e) {
    return handleActionError("returnReview", e, "Failed to submit review");
  }
}

const ReviewFormSchema = z.object({
  vote: z.nativeEnum(Vote).refine((val) => Object.values(Vote).includes(val), {
    message: "Vote type is invalid",
  }),
  returnId: z.string().min(2, { message: "Please append a returnId" }).trim(),
  guideId: z.string().min(2, { message: "Please append a guideId" }).trim(),
  comment: z
    .string()
    .min(2, { message: "Please provide a valid review comment" })
    .trim(),
});

/** @deprecated Use returnReview instead */
export const returnFeedback = returnReview;
