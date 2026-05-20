"use server";

import { ObjectId } from "mongodb";
import type { GradedReviewDocument } from "../models/review";
import { auth } from "../../auth";
import { Review } from "../models/review";
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

  // Grading reviews is teacher-only. Students no longer grade each other's
  // reviews; all review grades are assigned by teachers (e.g. via the reports
  // page). This is the single source of authorization for grading — there is no
  // student grading path anywhere in the app.
  if (session.user.role !== "teacher") {
    return failure("Only teachers can grade reviews");
  }

  const userId = new ObjectId(session.user.id);

  try {
    await connectToDatabase();

    // Fetch the review to validate it exists
    const review = await Review.findById(new ObjectId(reviewId));

    if (!review) {
      return failure(ErrorMessages.NOT_FOUND("Review"));
    }

    // Teachers can grade and re-grade any review. Record the grade and grader.
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
