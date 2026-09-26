"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "../../auth";
import { Guide } from "../models/guide";
import { connectToDatabase } from "./mongoose-connector";
import {
  DEFAULT_PASS_THRESHOLD,
  knownTasks,
  publicTask,
  sanitizeExerciseForClient,
  selectServedTasks,
  taskId,
  type ServerExercise,
  type ServerTask,
} from "utils/exerciseUtils";
import {
  deriveAttempt,
  pickReplacement,
  type AttemptState,
  type DerivedAttempt,
  type ItemState,
  type ScoreSummary,
} from "utils/exerciseAttemptState";
import {
  ensureActiveAttempt,
  findActiveAttempt,
  hasLegacyAttempts,
  refreshCachedScore,
  saveAttempt,
  stateOf,
} from "../lib/exerciseAttempts";
import { runCodeSubmission } from "utils/codeRunner";
import { MAX_ANSWER_LENGTH, normalizeAnswer } from "utils/shortAnswer";
import {
  ExerciseTaskType,
  MAX_CODE_LENGTH,
  type CodeFeedback,
  type ExerciseAnswerValue,
  type ExercisePublic,
  type ExerciseTaskPublic,
} from "types/guideTypes";
import {
  failure,
  success,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "utils/errors";

/**
 * An exercise worked through at the student's own pace, in ONE attempt that
 * never closes — see docs/exercise-continuous-attempt.md.
 *
 * Answers are checked on the server and recorded as they are given, so the
 * work is saved on any computer the moment a question is checked. The score is
 * derived from that record (utils/exerciseAttemptState) and is live: the guide
 * passes the moment it reaches the pass mark.
 *
 * - Multiple choice: one guess. A wrong one locks the question and reveals the
 *   answer; a new question from the pool is worth half as much.
 * - Short answer: each wrong try halves what the next is worth.
 * - Code: scored on the final code.
 */

// ---------------------------------------------------------------------------

export type ExerciseStatus =
  /** nothing answered yet */
  | "notStarted"
  /** under the pass mark, with work to do */
  | "inProgress"
  /** at or over the pass mark, not everything right */
  | "passed"
  /** everything right */
  | "perfect";

export type ExerciseSummary = {
  status: ExerciseStatus;
  /** 0..10, null before anything is answered */
  score: number | null;
  passed: boolean;
  /** fraction of the points needed to pass, 0..1 */
  passThreshold: number;
  /** questions with at least one answer */
  answered: number;
  total: number;
};

/** One question as the student sees it: its state, and what it is worth. */
export type ExerciseItem = Omit<ItemState, "slot"> & {
  /** what they last gave, to show it again */
  lastAnswer?: ExerciseAnswerValue;
  /** revealed once answered correctly */
  explanation?: string;
  /**
   * Multiple choice, once locked: the right answer and why. The question is
   * never served to this student again, so revealing it costs nothing.
   */
  reveal?: { correctAnswers: number[]; explanation?: string };
  /** multiple choice, once locked: whether the pool has a question left */
  canReplace?: boolean;
  /** code: what the latest run did */
  code?: CodeFeedback;
};

export type OpenedExercise = {
  /** the questions currently on show, in order */
  exercise: ExercisePublic;
  items: Record<string, ExerciseItem>;
  score: ScoreSummary;
};

export type CheckedAnswer = {
  item: ExerciseItem;
  score: ScoreSummary;
  /** on a wrong short answer or code — a wrong quiz answer reveals instead */
  hint?: string;
  /**
   * Why what the student actually gave is wrong — the options they picked, or
   * the text they typed. Specific to their answer rather than to the question.
   */
  answerNotes?: string[];
};

export type NewQuestion = {
  /** the locked task this replaces */
  replaced: string;
  task: ExerciseTaskPublic;
  item: ExerciseItem;
  score: ScoreSummary;
};

// ---------------------------------------------------------------------------

/**
 * Revalidation is a cache hint, not part of the outcome.
 *
 * It sits after the answer has already been saved, so letting it throw would
 * turn a successfully recorded answer into an error for the student.
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

const loadExercise = async (guideId: string): Promise<ServerExercise | null> => {
  if (!ObjectId.isValid(guideId)) return null;
  await connectToDatabase();
  const guide = (await Guide.findById(new ObjectId(guideId))
    .select("gradingMode exercise")
    .lean()) as { gradingMode?: string; exercise?: ServerExercise } | null;
  if (!guide || guide.gradingMode !== "auto" || !guide.exercise) return null;
  return guide.exercise;
};

const requireUser = async () => {
  const session = await auth();
  return session?.user?.id ?? null;
};

const tasksById = (exercise: ServerExercise) =>
  new Map(knownTasks(exercise).map((task) => [taskId(task), task]));

const statusOf = (summary: ScoreSummary): ExerciseStatus =>
  summary.answered === 0
    ? "notStarted"
    : summary.perfect
    ? "perfect"
    : summary.passed
    ? "passed"
    : "inProgress";

/** An item as sent to the student: its state plus what they may now see. */
const clientItem = (
  exercise: ServerExercise,
  state: AttemptState,
  item: ItemState
): ExerciseItem => {
  const { slot, ...rest } = item;
  const task = tasksById(exercise).get(item.taskId);
  const lastAnswer =
    slot !== undefined
      ? state.slots[slot]?.entries.at(-1)?.answer
      : state.answers[item.taskId];

  const view: ExerciseItem = {
    ...rest,
    ...(lastAnswer !== undefined ? { lastAnswer } : {}),
  };
  if (item.status === "correct" && task?.explanation) {
    view.explanation = task.explanation;
  }
  if (item.status === "locked" && task?.type === "quiz") {
    view.reveal = {
      correctAnswers: task.correctAnswers ?? [],
      ...(task.explanation ? { explanation: task.explanation } : {}),
    };
    // A fixed rng: this only asks whether ANY question is left.
    view.canReplace =
      pickReplacement(exercise, state, item.taskId, () => 0) !== null;
  }
  if (item.type === ExerciseTaskType.CODE && state.codeResults[item.taskId]) {
    view.code = state.codeResults[item.taskId];
  }
  return view;
};

const openedFrom = (
  exercise: ServerExercise,
  state: AttemptState,
  derived: DerivedAttempt
): OpenedExercise => {
  const byId = tasksById(exercise);
  const current = derived.items
    .map((item) => byId.get(item.taskId))
    .filter((task): task is ServerTask => !!task);

  // Sanitize exactly the tasks on show. They are already drawn, so the
  // sanitizer must not draw again: pool sizes are cleared.
  const sanitized = sanitizeExerciseForClient({
    ...exercise,
    tasks: current,
    poolSizes: undefined,
    poolSize: undefined,
  })!;

  return {
    exercise: sanitized,
    items: Object.fromEntries(
      derived.items.map((item) => [
        item.taskId,
        clientItem(exercise, state, item),
      ])
    ),
    score: derived.summary,
  };
};

/** Explain what they actually gave — only notes matching their own answer. */
const notesFor = (
  task: ServerTask,
  answer: ExerciseAnswerValue
): string[] | undefined => {
  if (task.type === "quiz" && Array.isArray(answer) && task.optionFeedback?.length) {
    const correctSet = new Set(task.correctAnswers ?? []);
    const notes = answer
      .filter((i) => !correctSet.has(i))
      .map((i) => task.optionFeedback?.[i])
      .filter((note): note is string => !!note && note.trim().length > 0);
    return notes.length > 0 ? notes : undefined;
  }

  if (
    task.type === "shortAnswer" &&
    typeof answer === "string" &&
    task.answerFeedback?.length
  ) {
    const written = normalizeAnswer(answer);
    const notes = task.answerFeedback
      .filter((entry) => {
        if (entry.match && normalizeAnswer(entry.match) === written) return true;
        if (entry.pattern) {
          try {
            return new RegExp(entry.pattern, "i").test(written);
          } catch {
            return false;
          }
        }
        return false;
      })
      .map((entry) => entry.note);
    return notes.length > 0 ? notes : undefined;
  }
  return undefined;
};

// ---------------------------------------------------------------------------

/**
 * Where the student stands, for the guide page. A student who has never opened
 * the exercise gets nothing created; one with old numbered attempts has them
 * merged here, so the grade they see already includes the amnesty.
 */
export const getExerciseSummary = async (
  guideId: string
): Promise<ExerciseSummary | null> => {
  const ownerId = await requireUser();
  if (!ownerId) return null;

  const exercise = await loadExercise(guideId);
  if (!exercise) return null;
  const passThreshold = exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD;

  let attempt = await findActiveAttempt(ownerId, guideId);
  if (!attempt && (await hasLegacyAttempts(ownerId, guideId))) {
    attempt = await ensureActiveAttempt(exercise, ownerId, guideId);
  }
  if (!attempt) {
    return {
      status: "notStarted",
      score: null,
      passed: false,
      passThreshold,
      answered: 0,
      total: selectServedTasks(exercise, Math.random).length,
    };
  }

  const { summary } = await refreshCachedScore(attempt, exercise);
  return {
    status: statusOf(summary),
    score: summary.answered > 0 ? summary.score : null,
    passed: summary.passed,
    passThreshold,
    answered: summary.answered,
    total: summary.total,
  };
};

/** Open the exercise: the student's one attempt, created on first open. */
export const openExercise = async (
  guideId: string
): Promise<ActionResult<OpenedExercise>> => {
  const ownerId = await requireUser();
  if (!ownerId) return failure(ErrorMessages.NOT_LOGGED_IN);

  try {
    const exercise = await loadExercise(guideId);
    if (!exercise) return failure(ErrorMessages.NOT_FOUND("Exercise"));

    const attempt = await ensureActiveAttempt(exercise, ownerId, guideId);
    const derived = await refreshCachedScore(attempt, exercise);
    return success(
      openedFrom(exercise, stateOf(attempt), derived),
      "Exercise opened"
    );
  } catch (e) {
    return handleActionError("openExercise", e, "Could not open the exercise");
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

/** Check one answer and record it. */
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

    const attempt = await findActiveAttempt(ownerId, guideId);
    if (!attempt) return failure("Open the exercise before answering");

    const state = stateOf(attempt);
    // The question must be one ON SHOW in this attempt — derived on the
    // server, never trusted from the request.
    const before = deriveAttempt(exercise, state).items.find(
      (item) => item.taskId === id
    );
    const task = tasksById(exercise).get(id);
    if (!before || !task) {
      return failure("That question is not part of your exercise");
    }
    if (before.status === "correct") {
      return failure("You have already answered that one");
    }
    if (before.status === "locked") {
      return failure("That question is locked — ask for a new one");
    }

    let code: CodeFeedback | undefined;
    if (task.type === "code") {
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
        // The grader itself failed. Record nothing against the student for
        // our problem.
        console.error("[checkAnswer] code grader failed", sandboxError);
        return failure(
          "The code grader could not run just now. This is a problem on our side, not with your code — try again in a moment."
        );
      }
    }

    if (task.type === "quiz") {
      if (!Array.isArray(answer)) return failure(ErrorMessages.INVALID_INPUT);
      const slot = state.slots[before.slot!];
      slot.entries[slot.entries.length - 1] = { taskId: id, answer };
    } else if (task.type === "shortAnswer") {
      if (typeof answer !== "string") return failure(ErrorMessages.INVALID_INPUT);
      state.tries = { ...state.tries, [id]: [...(state.tries[id] ?? []), answer] };
    } else if (code) {
      state.codeResults = { ...state.codeResults, [id]: code };
    }
    state.answers = { ...state.answers, [id]: answer };

    const derived = await saveAttempt(attempt, exercise, state);
    const after = derived.items.find((item) => item.taskId === id)!;
    revalidateQuietly("/guides", `/guides/${guideId}`);

    const wrong = after.status === "locked" || after.status === "tried";
    const hint =
      wrong && task.type !== "quiz" && task.hint ? task.hint : undefined;
    const answerNotes = wrong ? notesFor(task, answer) : undefined;

    return success(
      {
        item: clientItem(exercise, state, after),
        score: derived.summary,
        ...(hint ? { hint } : {}),
        ...(answerNotes ? { answerNotes } : {}),
      },
      after.status === "correct" ? "Correct" : "Not quite"
    );
  } catch (e) {
    return handleActionError("checkAnswer", e, "Could not check that answer");
  }
};

const NewQuestionSchema = z.object({
  guideId: z.string().trim().min(1),
  taskId: z.string().trim().min(1),
});

/** Swap a locked multiple-choice question for a new one, worth half. */
export const newQuestion = async (
  input: z.infer<typeof NewQuestionSchema>
): Promise<ActionResult<NewQuestion>> => {
  const validated = NewQuestionSchema.safeParse(input);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);
  const { guideId, taskId: id } = validated.data;

  const ownerId = await requireUser();
  if (!ownerId) return failure(ErrorMessages.NOT_LOGGED_IN);

  try {
    const exercise = await loadExercise(guideId);
    if (!exercise) return failure(ErrorMessages.NOT_FOUND("Exercise"));

    const attempt = await findActiveAttempt(ownerId, guideId);
    if (!attempt) return failure("Open the exercise first");

    const state = stateOf(attempt);
    const locked = deriveAttempt(exercise, state).items.find(
      (item) => item.taskId === id
    );
    if (!locked || locked.status !== "locked" || locked.slot === undefined) {
      return failure("Only a locked question can be swapped for a new one");
    }

    const next = pickReplacement(exercise, state, id, Math.random);
    if (!next) return failure("There are no new questions left");

    const nextId = taskId(next);
    state.slots[locked.slot].entries.push({ taskId: nextId });

    const derived = await saveAttempt(attempt, exercise, state);
    const item = derived.items.find((i) => i.taskId === nextId)!;

    return success(
      {
        replaced: id,
        task: publicTask(next),
        item: clientItem(exercise, state, item),
        score: derived.summary,
      },
      "New question"
    );
  } catch (e) {
    return handleActionError("newQuestion", e, "Could not get a new question");
  }
};
