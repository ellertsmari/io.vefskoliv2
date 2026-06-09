"use server";

import { ObjectId } from "mongodb";
import { auth } from "../../auth";
import { Guide } from "../models/guide";
import { ExerciseAttempt } from "../models/exerciseAttempt";
import { connectToDatabase } from "./mongoose-connector";
import { hasTeacherPermissions } from "utils/userUtils";
import {
  computeExerciseAnalytics,
  type AttemptForAnalytics,
  type ExerciseAnalytics,
  type ServerExercise,
} from "utils/exerciseUtils";

/**
 * Aggregated quiz analytics for a guide: per-question difficulty plus
 * per-student outcomes. Teacher-only — the per-question correct rates are
 * derived from the answer key.
 */
export const getExerciseAnalytics = async (
  guideId: string
): Promise<ExerciseAnalytics | null> => {
  const session = await auth();
  if (!hasTeacherPermissions(session)) return null;
  if (!ObjectId.isValid(guideId)) return null;

  await connectToDatabase();
  const guide = (await Guide.findById(new ObjectId(guideId))
    .select("gradingMode exercise")
    .lean()) as { gradingMode?: string; exercise?: ServerExercise } | null;

  if (!guide || guide.gradingMode !== "auto" || !guide.exercise) {
    return null;
  }

  const attempts = (await ExerciseAttempt.find(
    { guide: new ObjectId(guideId) },
    { owner: 1, answers: 1, score: 1, passed: 1 }
  ).lean()) as unknown as AttemptForAnalytics[];

  return computeExerciseAnalytics(guide.exercise, attempts);
};
