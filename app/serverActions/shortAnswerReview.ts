"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "../../auth";
import { Guide } from "../models/guide";
import { ExerciseAttempt } from "../models/exerciseAttempt";
import { connectToDatabase } from "./mongoose-connector";
import { hasTeacherPermissions } from "utils/userUtils";
import {
  knownTasks,
  taskId,
  type ExerciseAnswers,
  type ServerExercise,
  type ServerShortAnswerTask,
} from "utils/exerciseUtils";
import type { ExerciseAnswerValue } from "types/guideTypes";
import { refreshCachedScore } from "../lib/exerciseAttempts";
import {
  matchShortAnswer,
  normalizeAnswer,
  MAX_ANSWER_LENGTH,
} from "utils/shortAnswer";
import {
  failure,
  success,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "utils/errors";

/**
 * Teacher review of short answers that did not match the key.
 *
 * Answers close to an accepted one are held as `pending` at grading time; the
 * rest were marked wrong. Both are surfaced here, because the interesting case
 * is a phrasing the teacher never thought of — which may be perfectly correct
 * and score zero until it is promoted into the key.
 *
 * Nothing extra is stored to make this work: verdicts are recomputed from the
 * saved answers against the CURRENT key, so the moment an answer is promoted,
 * everyone who wrote it is re-graded.
 */

export type ReviewableAnswer = {
  /** the answer as the student typed it (first spelling seen) */
  answer: string;
  /** how many students wrote it */
  count: number;
  status: "pending" | "incorrect";
};

export type TaskReview = {
  taskId: string;
  prompt: string;
  acceptedAnswers: string[];
  answers: ReviewableAnswer[];
};

const shortAnswerTasks = (exercise: ServerExercise) =>
  knownTasks(exercise).filter(
    (t): t is ServerShortAnswerTask => t.type === "shortAnswer"
  );

const loadAutoGuide = async (guideId: string) => {
  if (!ObjectId.isValid(guideId)) return null;
  await connectToDatabase();
  const guide = (await Guide.findById(new ObjectId(guideId))
    .select("gradingMode exercise")
    .lean()) as { gradingMode?: string; exercise?: ServerExercise } | null;
  if (!guide || guide.gradingMode !== "auto" || !guide.exercise) return null;
  return guide;
};

/** Every unmatched short answer for a guide, grouped by question. */
export const getShortAnswerReview = async (
  guideId: string
): Promise<TaskReview[] | null> => {
  const session = await auth();
  if (!hasTeacherPermissions(session)) return null;

  const guide = await loadAutoGuide(guideId);
  if (!guide) return null;

  const tasks = shortAnswerTasks(guide.exercise!);
  if (tasks.length === 0) return [];

  // Merged attempts are history already carried into the active one;
  // reading both would count the same answer twice.
  const attempts = (await ExerciseAttempt.find(
    { guide: new ObjectId(guideId), status: { $ne: "merged" } },
    { answers: 1, tries: 1 }
  ).lean()) as unknown as {
    answers?: ExerciseAnswers;
    tries?: Record<string, ExerciseAnswerValue[]>;
  }[];

  return tasks.map((task) => {
    const id = taskId(task);
    // Group by NORMALIZED answer so "Const." and "const" are one row, while
    // showing the teacher the first spelling actually typed.
    const groups = new Map<string, ReviewableAnswer>();

    for (const attempt of attempts) {
      // Every try, not just the latest: a phrasing someone wrote and then
      // gave up on is exactly the one the key may be missing.
      const written = attempt.tries?.[id] ?? [attempt.answers?.[id]];
      const seen = new Set<string>();
      for (const raw of written) {
        if (typeof raw !== "string" || !raw.trim()) continue;

        const { status } = matchShortAnswer(task, raw);
        if (status === "correct") continue;

        const normalized = normalizeAnswer(raw);
        // Counted once per student, however often they wrote it.
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        const existing = groups.get(normalized);
        if (existing) {
          existing.count += 1;
        } else {
          groups.set(normalized, { answer: raw.trim(), count: 1, status });
        }
      }
    }

    return {
      taskId: id,
      prompt: task.prompt,
      acceptedAnswers: task.acceptedAnswers ?? [],
      // Held answers first, then by how many students wrote them.
      answers: [...groups.values()].sort(
        (a, b) =>
          (a.status === b.status ? 0 : a.status === "pending" ? -1 : 1) ||
          b.count - a.count
      ),
    };
  });
};

const PromoteSchema = z.object({
  guideId: z.string().trim().min(1),
  taskId: z.string().trim().min(1),
  answer: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
});

export type PromoteResult = { regradedAttempts: number };

/**
 * Accept a phrasing into a short-answer key, and re-grade the cohort.
 *
 * Re-grading is the point: analytics recompute from the current key, but each
 * ExerciseAttempt stores the score it was given, and that is what drives the
 * student's grade. Without this pass, promoting an answer would fix the
 * teacher's view and leave the student's mark untouched.
 */
export const promoteShortAnswer = async (
  input: z.infer<typeof PromoteSchema>
): Promise<ActionResult<PromoteResult>> => {
  const validated = PromoteSchema.safeParse(input);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { guideId, taskId: id, answer } = validated.data;

  const session = await auth();
  if (!hasTeacherPermissions(session)) {
    return failure("Only teachers can accept an answer");
  }

  try {
    const guide = await loadAutoGuide(guideId);
    if (!guide) return failure(ErrorMessages.NOT_FOUND("Guide"));

    const exercise = guide.exercise!;
    const task = shortAnswerTasks(exercise).find((t) => taskId(t) === id);
    if (!task) return failure(ErrorMessages.NOT_FOUND("Question"));

    const normalized = normalizeAnswer(answer);
    const already = (task.acceptedAnswers ?? []).some(
      (a) => normalizeAnswer(a) === normalized
    );
    if (already) {
      return failure("That answer is already accepted");
    }

    // Positional update so only this task's key changes.
    const index = exercise.tasks.findIndex((t) => taskId(t) === id);
    await Guide.updateOne(
      { _id: new ObjectId(guideId) },
      { $push: { [`exercise.tasks.${index}.acceptedAnswers`]: normalized } }
    );

    // Re-grade every stored attempt against the updated key.
    const updatedExercise: ServerExercise = {
      ...exercise,
      tasks: exercise.tasks.map((t, i) =>
        i === index
          ? {
              ...(t as ServerShortAnswerTask),
              acceptedAnswers: [...(task.acceptedAnswers ?? []), normalized],
            }
          : t
      ),
    };

    // Only the continuous attempts carry a grade. Old numbered ones are
    // re-checked against the current key when they are merged, so an
    // accepted phrasing counts for them then.
    const attempts = await ExerciseAttempt.find({
      guide: new ObjectId(guideId),
      status: "active",
    });

    // Every try is kept, so this also credits a student who wrote the
    // phrasing on a later try — at whatever that try was worth.
    let regradedAttempts = 0;
    for (const attempt of attempts) {
      const before = attempt.score;
      const { summary } = await refreshCachedScore(attempt, updatedExercise);
      if (summary.score !== before) regradedAttempts += 1;
    }

    // Same reasoning as exerciseSession: the re-grade is already persisted.
    for (const path of ["/guides", `/LMS/edit-guides/${guideId}`]) {
      try {
        revalidatePath(path);
      } catch (error) {
        console.warn("[promoteShortAnswer] revalidatePath failed", path, error);
      }
    }

    return success(
      { regradedAttempts },
      regradedAttempts > 0
        ? `Accepted — ${regradedAttempts} attempt${
            regradedAttempts === 1 ? "" : "s"
          } re-graded`
        : "Accepted"
    );
  } catch (e) {
    return handleActionError("promoteShortAnswer", e, "Failed to accept answer");
  }
};
