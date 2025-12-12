"use server";

import { ObjectId } from "mongodb";
import type { GradedReviewDocument } from "../models/review";
import { auth } from "../../auth";
import { Review } from "../models/review";
import { Return } from "../models/return";
import { z } from "zod";
import { safeSerialize } from "../utils/serialization";
import { connectToDatabase } from "./mongoose-connector";
import {
  failure,
  success,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

export type GradeDataType = {
  grade: number | undefined;
  reviewId: string | undefined;
};

type GradeFormState = ActionResult<GradedReviewDocument> | undefined;

export async function returnGrade(
  state: GradeFormState,
  data: GradeDataType
): Promise<ActionResult<GradedReviewDocument>> {
  const validatedFields = GradeFormSchema.safeParse({
    grade: data.grade,
    reviewId: data.reviewId,
  });

  if (!validatedFields.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validatedFields.error.flatten().fieldErrors
    );
  }

  const { grade, reviewId } = validatedFields.data;
  const session = await auth();

  if (!session?.user) {
    return failure("You must be logged in to give a grade");
  }

  const userId = new ObjectId(session.user.id);
  const isTeacher = session.user.role === "teacher";

  try {
    await connectToDatabase();

    // Fetch the review to validate authorization
    const review = await Review.findById(new ObjectId(reviewId));

    if (!review) {
      return failure(ErrorMessages.NOT_FOUND("Review"));
    }

    // Teachers can re-grade reviews, students cannot
    if (!isTeacher && review.grade !== null && review.grade !== undefined) {
      return failure("This review has already been graded");
    }

    // Only apply ownership restrictions for non-teachers
    if (!isTeacher) {
      // Check if user is trying to grade their own review (not allowed)
      if (review.owner.equals(userId)) {
        return failure("You cannot grade your own review");
      }

      // Fetch the return to check ownership
      const associatedReturn = await Return.findById(review.return);

      if (!associatedReturn) {
        return failure(ErrorMessages.NOT_FOUND("Associated return"));
      }

      // Check if user is trying to grade a review on their own return (not allowed for neutral grading)
      if (associatedReturn.owner.equals(userId)) {
        return failure("You cannot grade reviews on your own projects");
      }
    }

    // All checks passed, update the grade and record who graded it
    await Review.updateOne(
      { _id: new ObjectId(reviewId) },
      { grade, gradedBy: userId }
    );

    const gradedDocument = (await Review.findById(
      new ObjectId(reviewId)
    )) as GradedReviewDocument;

    if (!gradedDocument) {
      return failure("Failed to submit grade");
    }

    return success(
      safeSerialize(gradedDocument.toObject()),
      "Grade submitted successfully"
    );
  } catch (e) {
    return handleActionError("returnGrade", e, "Failed to submit grade");
  }
}

const GradeFormSchema = z.object({
  grade: z
    .number()
    .int()
    .min(0, { message: "Grade must be at least 0" })
    .max(10, { message: "Grade must be at most 10" }),
  reviewId: z.string().min(2, { message: "Please append a reviewId" }).trim(),
});
