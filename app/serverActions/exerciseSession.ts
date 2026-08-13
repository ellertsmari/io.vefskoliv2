"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "../../auth";
import { Guide } from "../models/guide";
import { ExerciseAttempt } from "../models/exerciseAttempt";
import { connectToDatabase } from "./mongoose-connector";
import {
  gradeTask,
  knownTasks,
  seededRng,
  selectServedTasks,
  sanitizeExerciseForClient,
  scoreFromProgress,
  taskId,
  type ExerciseProgress,
  type ServerExercise,
  type ServerTask,
  type TaskProgress,
  type GoalResult,
} from "utils/exerciseUtils";
import { runCodeSubmission } from "utils/codeRunner";
import { MAX_ANSWER_LENGTH } from "utils/shortAnswer";
import {
  ExerciseTaskType,
  MAX_CODE_LENGTH,
  type CodeFeedback,
  type ExercisePublic,
  type TaskStatus,
} from "types/guideTypes";
import {
  failure,
  success,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "utils/errors";

/**
 * An exercise worked through one question at a time.
 *
 * The student answers, the answer is checked immediately, and a correct one
 * moves them on. The score is FIRST-TRY accuracy, so the record of how each
 * task went has to live here rather than in the browser: a client reporting its
 * own progress could simply claim everything was right first time.
 *
 * The question set is drawn from `attemptNumber`, so an attempt keeps its
 * questions from start to finish and a later attempt gets a different set —
 * otherwise "improve your grade" would re-serve the questions whose answers the
 * student was just shown.
 */

// ---------------------------------------------------------------------------

export type ExerciseStatus =
  /** never opened it */
  | "notStarted"
  /** an attempt is part-finished */
  | "inProgress"
  /** finished at least once, but not everything right first time */
  | "canImprove"
  /** finished with every question right first time */
  | "perfect";

export type ExerciseSummary = {
  status: ExerciseStatus;
  /** best score so far, 0..10, null when never finished */
  bestScore: number | null;
  passed: boolean;
  attemptCount: number;
  /** questions resolved in the attempt in progress */
  answered: number;
  /** questions in the attempt in progress, or in a fresh one */
  total: number;
};

export type StartedExercise = {
  attemptNumber: number;
  exercise: ExercisePublic;
  /** how each served task has gone so far */
  progress: ExerciseProgress;
};

export type CheckedAnswer = {
  status: TaskStatus;
  /** tries spent on this question so far, including this one */
  tries: number;
  /** revealed on a correct answer */
  explanation?: string;
  /** revealed on a wrong one */
  hint?: string;
  /** code tasks only */
  code?: CodeFeedback;
};

export type FinishedExercise = {
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  goalBreakdown?: GoalResult[];
  perfect: boolean;
};

// ---------------------------------------------------------------------------

/**
 * Revalidation is a cache hint, not part of the outcome.
 *
 * It sits after the attempt has already been saved, so letting it throw would
 * turn a successfully scored attempt into an error for the student — the work
 * is done and recorded either way.
 */
const revalidateQuietly = (...paths: string[]) => {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.warn("[exerciseSession] revalidatePath failed", path, error);
    }
  }
};

const emptyProgress = (): TaskProgress => ({
  tries: 0,
  correct: false,
  firstTryCorrect: false,
  skipped: false,
});

const loadExercise = async (guideId: string): Promise<ServerExercise | null> => {
  if (!ObjectId.isValid(guideId)) return null;
  await connectToDatabase();
  const guide = (await Guide.findById(new ObjectId(guideId))
    .select("gradingMode exercise")
    .lean()) as { gradingMode?: string; exercise?: ServerExercise } | null;
  if (!guide || guide.gradingMode !== "auto" || !guide.exercise) return null;
  return guide.exercise;
};

/** The tasks served for a given attempt. Deterministic, so it can be recomputed. */
const servedFor = (
  exercise: ServerExercise,
  ownerId: string,
  guideId: string,
  attemptNumber: number
): ServerTask[] =>
  selectServedTasks(
    exercise,
    seededRng(`${ownerId}:${guideId}:${attemptNumber}`)
  );

const requireUser = async () => {
  const session = await auth();
  return session?.user?.id ?? null;
};

// ---------------------------------------------------------------------------

/** What the guide page needs to label its button and draw a progress bar. */
export const getExerciseSummary = async (
  guideId: string
): Promise<ExerciseSummary | null> => {
  const ownerId = await requireUser();
  if (!ownerId) return null;

  const exercise = await loadExercise(guideId);
  if (!exercise) return null;

  const attempts = (await ExerciseAttempt.find({
    guide: new ObjectId(guideId),
    owner: new ObjectId(ownerId),
  })
    .select("status score passed attemptNumber taskProgress")
    .lean()) as unknown as {
    status?: string;
    score: number;
    passed: boolean;
    attemptNumber?: number;
    taskProgress?: ExerciseProgress;
  }[];

  const submitted = attempts.filter((a) => a.status !== "inProgress");
  const inProgress = attempts.find((a) => a.status === "inProgress");

  const best = submitted.reduce<number | null>(
    (acc, a) => (acc === null || a.score > acc ? a.score : acc),
    null
  );

  const nextAttemptNumber = submitted.length + 1;
  const served = servedFor(
    exercise,
    ownerId,
    guideId,
    inProgress?.attemptNumber ?? nextAttemptNumber
  );

  const progress = inProgress?.taskProgress ?? {};
  // "Attempted" means they actually tried it, not that a row exists. Opening
  // the modal creates the attempt, so counting rows told a student they were
  // "part way through" with nothing answered — and promised their answers were
  // saved when there were none.
  const answered = served.filter(
    (t) => (progress[taskId(t)]?.tries ?? 0) > 0
  ).length;

  const status: ExerciseStatus =
    inProgress && answered > 0
      ? "inProgress"
      : best === null
      ? "notStarted"
      : best >= 10
      ? "perfect"
      : "canImprove";

  return {
    status,
    bestScore: best,
    passed: submitted.some((a) => a.passed),
    attemptCount: submitted.length,
    answered,
    total: served.length,
  };
};

/** Open the exercise: resume the attempt in progress, or begin a new one. */
export const startExercise = async (
  guideId: string
): Promise<ActionResult<StartedExercise>> => {
  const ownerId = await requireUser();
  if (!ownerId) return failure(ErrorMessages.NOT_LOGGED_IN);

  try {
    const exercise = await loadExercise(guideId);
    if (!exercise) return failure(ErrorMessages.NOT_FOUND("Exercise"));

    const guide = new ObjectId(guideId);
    const owner = new ObjectId(ownerId);

    let attempt = await ExerciseAttempt.findOne({
      guide,
      owner,
      status: "inProgress",
    });

    if (!attempt) {
      const submittedCount = await ExerciseAttempt.countDocuments({
        guide,
        owner,
        status: { $ne: "inProgress" },
      });
      attempt = await ExerciseAttempt.create({
        guide,
        owner,
        answers: {},
        taskProgress: {},
        attemptNumber: submittedCount + 1,
        status: "inProgress",
        score: 0,
        passed: false,
      });
    }

    const attemptNumber = attempt.attemptNumber ?? 1;
    const served = servedFor(exercise, ownerId, guideId, attemptNumber);

    // Sanitize the SERVED subset, not the whole exercise, so the client sees
    // exactly the tasks this attempt is about.
    const sanitized = sanitizeExerciseForClient({
      ...exercise,
      tasks: served,
      poolSizes: undefined,
      poolSize: undefined,
    })!;

    return success(
      {
        attemptNumber,
        exercise: sanitized,
        progress: (attempt.taskProgress ?? {}) as ExerciseProgress,
      },
      "Exercise started"
    );
  } catch (e) {
    return handleActionError("startExercise", e, "Could not open the exercise");
  }
};

const CheckSchema = z.object({
  guideId: z.string().trim().min(1),
  taskId: z.string().trim().min(1),
  answer: z.union([
    z.array(z.number().int().min(0)),
    z.string().max(Math.max(MAX_ANSWER_LENGTH, MAX_CODE_LENGTH)),
  ]),
});

/** Check one answer, record the try, and say whether to move on. */
export const checkAnswer = async (
  input: z.infer<typeof CheckSchema>
): Promise<ActionResult<CheckedAnswer>> => {
  const validated = CheckSchema.safeParse(input);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);
  const { guideId, taskId: id, answer } = validated.data;

  const ownerId = await requireUser();
  if (!ownerId) return failure(ErrorMessages.NOT_LOGGED_IN);

  try {
    const exercise = await loadExercise(guideId);
    if (!exercise) return failure(ErrorMessages.NOT_FOUND("Exercise"));

    const attempt = await ExerciseAttempt.findOne({
      guide: new ObjectId(guideId),
      owner: new ObjectId(ownerId),
      status: "inProgress",
    });
    if (!attempt) return failure("Start the exercise before answering");

    // The task must be one this attempt actually served. Recomputed from the
    // seed rather than trusted from the request.
    const served = servedFor(
      exercise,
      ownerId,
      guideId,
      attempt.attemptNumber ?? 1
    );
    const task = served.find((t) => taskId(t) === id);
    if (!task) return failure("That question is not part of this attempt");

    const progress = (attempt.taskProgress ?? {}) as ExerciseProgress;
    const before = progress[id] ?? emptyProgress();

    // Already right: re-checking changes nothing, and must not cost a try.
    if (before.correct) {
      return success(
        { status: "correct", tries: before.tries, ...(task.explanation ? { explanation: task.explanation } : {}) },
        "Already answered"
      );
    }

    let code: CodeFeedback | undefined;
    if (task.type === ExerciseTaskType.CODE) {
      if (typeof answer !== "string") return failure(ErrorMessages.INVALID_INPUT);
      try {
        code = await runCodeSubmission(
          {
            entryPoint: task.entryPoint,
            tests: task.tests ?? [],
            requires: task.requires,
          },
          answer
        );
      } catch (sandboxError) {
        // The grader itself failed — a module that would not load, a budget
        // that ran out. Do not record a try against the student for our
        // problem; everything they have already answered is safe, because
        // progress is saved per question.
        console.error("[checkAnswer] code grader failed", sandboxError);
        return failure(
          "The code grader could not run just now. This is a problem on our side, not with your code — try again in a moment."
        );
      }
    }

    const graded = gradeTask(task, answer, code);
    const tries = before.tries + 1;
    const isCorrect = graded.status === "correct";

    const after: TaskProgress = {
      tries,
      correct: isCorrect,
      firstTryCorrect: isCorrect && tries === 1,
      skipped: false,
      // Kept only for the first try — that is the one the grade depends on.
      firstAnswer: tries === 1 ? answer : before.firstAnswer,
    };

    attempt.taskProgress = { ...progress, [id]: after };
    attempt.answers = { ...(attempt.answers ?? {}), [id]: answer };
    if (code) {
      attempt.codeResults = { ...(attempt.codeResults ?? {}), [id]: code };
    }
    attempt.markModified("taskProgress");
    attempt.markModified("answers");
    if (code) attempt.markModified("codeResults");
    await attempt.save();

    return success(
      {
        status: graded.status,
        tries,
        ...(isCorrect && task.explanation
          ? { explanation: task.explanation }
          : {}),
        ...(!isCorrect && task.hint ? { hint: task.hint } : {}),
        ...(code ? { code } : {}),
      },
      isCorrect ? "Correct" : "Not quite"
    );
  } catch (e) {
    return handleActionError("checkAnswer", e, "Could not check that answer");
  }
};

/** Finish the attempt and score it. */
export const finishExercise = async (
  guideId: string
): Promise<ActionResult<FinishedExercise>> => {
  const ownerId = await requireUser();
  if (!ownerId) return failure(ErrorMessages.NOT_LOGGED_IN);

  try {
    const exercise = await loadExercise(guideId);
    if (!exercise) return failure(ErrorMessages.NOT_FOUND("Exercise"));

    const attempt = await ExerciseAttempt.findOne({
      guide: new ObjectId(guideId),
      owner: new ObjectId(ownerId),
      status: "inProgress",
    });
    if (!attempt) return failure("There is no exercise in progress");

    const served = servedFor(
      exercise,
      ownerId,
      guideId,
      attempt.attemptNumber ?? 1
    );
    const progress = (attempt.taskProgress ?? {}) as ExerciseProgress;

    const graded = scoreFromProgress(
      served,
      progress,
      exercise.passThreshold ?? undefined
    );

    attempt.score = graded.score;
    attempt.passed = graded.passed;
    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    await attempt.save();

    revalidateQuietly("/guides", `/guides/${guideId}`);

    return success(
      {
        score: graded.score,
        passed: graded.passed,
        earnedPoints: graded.earnedPoints,
        totalPoints: graded.totalPoints,
        goalBreakdown: graded.goalBreakdown,
        perfect: graded.earnedPoints === graded.totalPoints,
      },
      "Exercise finished"
    );
  } catch (e) {
    return handleActionError("finishExercise", e, "Could not finish the exercise");
  }
};

/** Ensure the known tasks helper stays reachable for callers that need counts. */
export const countExerciseTasks = async (
  guideId: string
): Promise<number | null> => {
  const exercise = await loadExercise(guideId);
  return exercise ? knownTasks(exercise).length : null;
};
