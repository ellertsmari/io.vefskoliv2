"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "../../auth";
import { Guide } from "../models/guide";
import { ExerciseAttempt } from "../models/exerciseAttempt";
import {
  gradeExercise,
  type GradeResult,
  type ServerExercise,
  type ExerciseAnswers,
} from "../utils/exerciseUtils";
import {
  failure,
  success,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

export type SubmitExerciseData = {
  guideId: string;
  answers: ExerciseAnswers;
};

type SubmitExerciseState = ActionResult<GradeResult> | undefined;

// Answers: task id -> array of selected option indices.
const SubmitExerciseSchema = z.object({
  guideId: z.string().trim().min(1),
  answers: z.record(z.string(), z.array(z.number().int().min(0))),
});

/**
 * Submit and auto-grade an interactive exercise.
 *
 * Grading runs entirely server-side against the answer key on the Guide document
 * (which is never sent to the client), so answers can't be spoofed and the key
 * can't leak. Each submission is stored as its own ExerciseAttempt; the best
 * attempt drives the guide's grade/status in `extendGuides`.
 */
export async function submitExercise(
  _state: SubmitExerciseState,
  data: SubmitExerciseData
): Promise<ActionResult<GradeResult>> {
  const validated = SubmitExerciseSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  const { guideId, answers } = validated.data;

  const session = await auth();
  if (!session?.user?.id) {
    return failure("You must be logged in to submit an exercise");
  }

  if (!ObjectId.isValid(guideId)) {
    return failure(ErrorMessages.NOT_FOUND("Guide"));
  }

  try {
    const guide = (await Guide.findById(new ObjectId(guideId)).lean()) as
      | { gradingMode?: string; exercise?: ServerExercise }
      | null;

    if (!guide) {
      return failure(ErrorMessages.NOT_FOUND("Guide"));
    }

    if (guide.gradingMode !== "auto" || !guide.exercise) {
      return failure("This guide is not an auto-graded exercise");
    }

    const result = gradeExercise(guide.exercise as ServerExercise, answers);

    await ExerciseAttempt.create({
      guide: new ObjectId(guideId),
      owner: new ObjectId(session.user.id),
      answers,
      score: result.score,
      passed: result.passed,
    });

    // Refresh the guides list so the new grade/status shows up.
    revalidatePath("/guides");

    return success(result, "Exercise submitted");
  } catch (e) {
    return handleActionError("submitExercise", e, "Failed to submit exercise");
  }
}
