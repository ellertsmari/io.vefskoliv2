"use server";

import { z } from "zod";
import { ObjectId } from "mongodb";
import type { FeedbackType } from "models/review";
import { auth } from "../../auth";
import { Review, Vote } from "models/review";

export async function returnFeedback(
  state: FeedbackFormState,
  data: FeedbackDataType
) {
  const validatedFields = FeedbackFormSchema.safeParse({
    vote: data.vote,
    comment: data.comment,
    returnId: data.returnId,
    guideId: data.guideId,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { vote, comment, returnId } = validatedFields.data;
  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      message: "You must be logged in to submit a return",
    };
  }
  const { user } = session;

  const reviewData: Omit<FeedbackType, "createdAt"> = {
    vote,
    comment,
    owner: new ObjectId(user.id),
    return: new ObjectId(returnId),
    guide: new ObjectId(data.guideId),
  };

  try {
    const review = await Review.create(reviewData);

    return {
      success: true,
      message: "Return feedback submitted successfully",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to submit return feedback",
    };
  }
}

export type FeedbackDataType = {
  vote: Vote | undefined;
  comment: string | undefined;
  returnId: string | undefined;
  guideId: string | undefined;
};

export const FeedbackFormSchema = z.object({
  vote: z.nativeEnum(Vote).refine((val) => Object.values(Vote).includes(val), {
    message: "Vote type is invalid",
  }),
  returnId: z.string().min(2, { message: "Please append a returnId" }).trim(),
  guideId: z.string().min(2, { message: "Please append a guideId" }).trim(),
  comment: z
    .string()
    .min(2, { message: "Please provide valid feedback" })
    .trim(),
});

export type FeedbackFormState =
  | {
      errors?: {
        returnId?: string[];
        vote?: string[];
        comment?: string[];
        guideId?: string[];
      };
      message?: string;
    }
  | undefined;
