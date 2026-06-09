"use server";

import { ObjectId } from "mongodb";
import { auth } from "../../auth";
import { ExerciseAttempt } from "../models/exerciseAttempt";
import { connectToDatabase } from "./mongoose-connector";

export type BestAttemptInfo = {
  score: number;
  passed: boolean;
  attemptCount: number;
  /** ISO date of the most recent attempt */
  lastAttemptAt: string;
};

/**
 * The CURRENT user's best attempt at a guide's exercise, for showing
 * "your best so far" when they revisit. Returns null when they haven't
 * attempted it (or aren't logged in).
 */
export const getBestExerciseAttempt = async (
  guideId: string
): Promise<BestAttemptInfo | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!ObjectId.isValid(guideId)) return null;

  await connectToDatabase();
  const attempts = (await ExerciseAttempt.find(
    {
      guide: new ObjectId(guideId),
      owner: new ObjectId(session.user.id),
    },
    { score: 1, passed: 1, createdAt: 1 }
  ).lean()) as unknown as Array<{
    score: number;
    passed: boolean;
    createdAt: Date;
  }>;

  if (attempts.length === 0) return null;

  const best = attempts.reduce((a, b) => (b.score > a.score ? b : a));
  const last = attempts.reduce((a, b) =>
    b.createdAt > a.createdAt ? b : a
  );

  return {
    score: best.score,
    passed: attempts.some((a) => a.passed),
    attemptCount: attempts.length,
    lastAttemptAt: new Date(last.createdAt).toISOString(),
  };
};
