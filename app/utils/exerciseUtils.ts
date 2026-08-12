import {
  ExercisePublic,
  ExerciseTaskPublic,
  ExerciseTaskType,
  ExerciseAnswerValue,
  TaskStatus,
  CodeConstruct,
  type CodeFeedback,
} from "types/guideTypes";
import { matchShortAnswer, type ShortAnswerKey } from "./shortAnswer";
// Type-only: the runner itself is server-only (TypeScript compiler + WASM).
import type { CodeTestCase } from "./codeRunner";

/** Fields every server-side task carries, whatever its type. */
type ServerTaskBase = {
  _id?: unknown;
  id?: string;
  prompt: string;
  points?: number;
  explanation?: string;
  hint?: string;
  /** Optional knowledge goal (one of the guide's knowledge items) this task assesses. */
  goal?: string;
};

/**
 * Server-side shape of a quiz task, including the answer key. This is what lives
 * on the Guide document. Kept permissive (plain object) because it arrives either
 * as a mongoose doc or a JSON-serialized plain object.
 */
export type ServerQuizTask = ServerTaskBase & {
  // A plain string literal, not the enum: these arrive as JSON from Mongo, and
  // a string enum would reject an object literal written as `type: "quiz"`.
  type: "quiz";
  options: string[];
  allowMultiple?: boolean;
  correctAnswers: number[];
};

/**
 * Server-side shape of a short-answer task, including the answer key.
 * `acceptedAnswers` and `pattern` are the key and never reach a student.
 */
export type ServerShortAnswerTask = ServerTaskBase &
  ShortAnswerKey & {
    type: "shortAnswer";
    /** optional hint about the expected form, shown in the input */
    placeholder?: string;
  };

/**
 * Server-side shape of a code task. `tests` carry the expected values and some
 * are hidden, so the whole array is answer key — only labels and the visible
 * cases reach a student.
 */
export type ServerCodeTask = ServerTaskBase & {
  type: "code";
  /** the function the tests call */
  entryPoint: string;
  starterCode?: string;
  tests: CodeTestCase[];
  /** constructs the solution is expected to use */
  requires?: CodeConstruct[];
  /**
   * Share of the task's points carried by the structural check, 0..1.
   * Deliberately a slice rather than a gate — a student who solves an iteration
   * exercise with .reduce() should not be zeroed for it.
   */
  constructWeight?: number;
};

/**
 * Discriminated on `type`. Gains members as the phases land; every consumer
 * dispatches rather than assuming quiz, so adding one is additive.
 */
export type ServerTask =
  | ServerQuizTask
  | ServerShortAnswerTask
  | ServerCodeTask;

/** Default share of a code task's points carried by the structural check. */
export const DEFAULT_CONSTRUCT_WEIGHT = 0.2;

/**
 * A task whose `type` this build does not know how to grade or serve. Reachable
 * because guides are hand-editable in the database — a typo'd or newer `type`
 * must never silently score as zero or leak an answer key.
 */
export type UnknownServerTask = ServerTaskBase & { type: string };

export type ServerExercise = {
  tasks: (ServerTask | UnknownServerTask)[];
  passThreshold?: number;
  /**
   * When set (and smaller than tasks.length), each visit serves a random
   * subset of this many questions instead of the full set.
   */
  poolSize?: number;
};

/** Student answers: task id -> that task's answer, shaped by the task's type. */
export type ExerciseAnswers = Record<string, ExerciseAnswerValue>;

/** Narrow an arbitrary stored task to one this build can grade and serve. */
export const isKnownTask = (
  task: ServerTask | UnknownServerTask
): task is ServerTask =>
  task.type === ExerciseTaskType.QUIZ ||
  task.type === ExerciseTaskType.SHORT_ANSWER ||
  task.type === ExerciseTaskType.CODE;

/**
 * Code results computed at submission time, keyed by task id.
 *
 * Running a sandbox is asynchronous and expensive, while `gradeExercise` is
 * synchronous and is re-run whenever the answer key changes (analytics,
 * promoting a short answer). So code tasks are executed ONCE, at submission,
 * and their outcome is stored on the attempt and passed back in here.
 */
export type CodeResults = Record<string, CodeFeedback>;

/** What grading one task produced, before it is turned into a TaskResult. */
export type GradedTask = {
  status: TaskStatus;
  /** convenience mirror of `status === "correct"` */
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  /** short answer only: the accepted answer this matched or nearly matched */
  matched?: string;
};

export type TaskResult = {
  taskId: string;
  /**
   * `pending` means the answer was close to an accepted one and is held for a
   * teacher rather than marked wrong. It earns no points yet, so the score a
   * student sees is a floor that can only rise.
   */
  status: TaskStatus;
  /** true only for a FULLY correct answer */
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  /** revealed only when the task was answered fully CORRECTLY */
  explanation?: string;
  /** revealed when the task was answered incorrectly or only partially */
  hint?: string;
  /** code tasks only: test outcomes, type errors and the mapped runtime error */
  code?: CodeFeedback;
};

/** Per-knowledge-goal score aggregation across the graded tasks. */
export type GoalResult = {
  goal: string;
  earnedPoints: number;
  totalPoints: number;
};

export type GradeResult = {
  /** 0..10, matching the peer-review grade scale */
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  results: TaskResult[];
  /** present when at least one graded task is tagged with a knowledge goal */
  goalBreakdown?: GoalResult[];
  /**
   * How many answers are held for a teacher. While this is above zero the score
   * is provisional and can only rise, so the UI says "awaiting review" rather
   * than "not passed".
   */
  pendingCount: number;
};

/** Thrown when a submission doesn't match the questions that were served. */
export class ExerciseGradingError extends Error {}

const DEFAULT_PASS_THRESHOLD = 0.7;

/** Stable string id for a task, whether it's a mongoose doc or serialized JSON. */
export const taskId = (task: { _id?: unknown; id?: string }): string =>
  String(task.id ?? task._id ?? "");

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The tasks this build can grade and serve.
 *
 * Guides are hand-edited in the database, so an exercise can hold a task whose
 * `type` this build does not implement. Those are dropped from serving, pooling
 * and analytics alike — a student is never shown a question that cannot be
 * graded, and the pool never draws one.
 */
export const knownTasks = (exercise: ServerExercise): ServerTask[] =>
  (exercise.tasks ?? []).filter(isKnownTask);

/** poolSize is only meaningful as an integer in [1, gradeable task count). */
const normalizedPoolSize = (exercise: ServerExercise): number | undefined => {
  const { poolSize } = exercise;
  if (
    typeof poolSize === "number" &&
    Number.isInteger(poolSize) &&
    poolSize >= 1 &&
    poolSize < knownTasks(exercise).length
  ) {
    return poolSize;
  }
  return undefined;
};

/**
 * Grade a single task, dispatching on its type.
 *
 * An unrecognised type throws rather than scoring zero: guides are hand-edited
 * in the database, and a typo'd `type` that quietly marked every student wrong
 * would be far harder to notice than a failed submission.
 */
export const gradeTask = (
  task: ServerTask | UnknownServerTask,
  answer: ExerciseAnswerValue,
  codeFeedback?: CodeFeedback
): GradedTask => {
  switch (task.type) {
    case "quiz":
      return gradeQuizTask(task as ServerQuizTask, answer as number[]);
    case "shortAnswer":
      return gradeShortAnswerTask(task as ServerShortAnswerTask, answer);
    case "code":
      return gradeCodeTask(task as ServerCodeTask, codeFeedback);
    default:
      throw new ExerciseGradingError(
        `This exercise contains a question of an unsupported type ("${task.type}") and cannot be graded. Please tell your teacher.`
      );
  }
};

/**
 * Single-choice: all-or-nothing. Multi-select: partial credit —
 * points * max(0, (correct selections - incorrect selections) / total correct).
 * A student who finds 3 of 4 right answers is not in the same place as one who
 * found none; the penalty for wrong selections keeps select-everything at zero.
 */
const gradeQuizTask = (task: ServerQuizTask, selected: number[]): GradedTask => {
  const points = task.points ?? 1;
  const correctSet = new Set(task.correctAnswers ?? []);
  const selectedSet = new Set(selected);

  if (!task.allowMultiple) {
    const correct =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every((i) => correctSet.has(i));
    return {
      status: correct ? "correct" : "incorrect",
      correct,
      pointsEarned: correct ? points : 0,
      pointsPossible: points,
    };
  }

  const correctSelected = [...selectedSet].filter((i) =>
    correctSet.has(i)
  ).length;
  const incorrectSelected = selectedSet.size - correctSelected;
  const fraction =
    correctSet.size > 0
      ? Math.max(0, (correctSelected - incorrectSelected) / correctSet.size)
      : 0;

  return {
    status: fraction === 1 ? "correct" : "incorrect",
    correct: fraction === 1,
    pointsEarned: round2(points * fraction),
    pointsPossible: points,
  };
};

/**
 * A short answer is correct, wrong, or held for review.
 *
 * A held answer earns nothing yet — the score is a floor that rises if the
 * teacher promotes the phrasing into the key. Scoring it optimistically would
 * mean a grade that could later go DOWN, which is worse than one that rises.
 */
/**
 * Partial credit per passing test, with the structural check worth its own
 * slice of the marks rather than acting as a gate (decision 6).
 *
 * Without feedback — an attempt stored before the code ran, or an exercise
 * re-graded outside submission — the task scores zero rather than guessing.
 */
const gradeCodeTask = (
  task: ServerCodeTask,
  feedback?: CodeFeedback
): GradedTask => {
  const points = task.points ?? 1;
  if (!feedback) {
    return {
      status: "incorrect",
      correct: false,
      pointsEarned: 0,
      pointsPossible: points,
    };
  }

  const requires = task.requires ?? [];
  // With nothing required, the tests carry the whole task.
  const constructWeight =
    requires.length === 0
      ? 0
      : task.constructWeight ?? DEFAULT_CONSTRUCT_WEIGHT;

  const testFraction =
    feedback.testsTotal > 0 ? feedback.testsPassed / feedback.testsTotal : 0;
  const constructFraction = feedback.constructsMet ? 1 : 0;

  const fraction =
    testFraction * (1 - constructWeight) + constructFraction * constructWeight;

  const correct = testFraction === 1 && constructFraction === 1;
  return {
    status: correct ? "correct" : "incorrect",
    correct,
    pointsEarned: round2(points * fraction),
    pointsPossible: points,
  };
};

const gradeShortAnswerTask = (
  task: ServerShortAnswerTask,
  answer: ExerciseAnswerValue
): GradedTask => {
  const points = task.points ?? 1;
  const { status, matched } = matchShortAnswer(task, answer);
  return {
    status,
    correct: status === "correct",
    pointsEarned: status === "correct" ? points : 0,
    pointsPossible: points,
    matched,
  };
};

/**
 * Resolve which tasks a submission should be graded against.
 *
 * Full set: every task. Pooled: exactly the served subset, identified by the
 * submitted answer keys. The subset must contain poolSize distinct, valid task
 * ids — anything else is a malformed submission. (A determined student could
 * hand-craft which pool questions they answer; for a formative quiz with
 * unlimited retries that buys them little, and we accept the tradeoff rather
 * than tracking served sets server-side. Revisit if these ever become summative.)
 */
const tasksToGrade = (
  exercise: ServerExercise,
  answers: ExerciseAnswers
): ServerTask[] => {
  const allTasks = knownTasks(exercise);
  const poolSize = normalizedPoolSize(exercise);
  if (!poolSize) return allTasks;

  const byId = new Map(allTasks.map((t) => [taskId(t), t]));
  const submittedIds = [...new Set(Object.keys(answers))].filter((id) =>
    byId.has(id)
  );

  if (submittedIds.length !== poolSize) {
    throw new ExerciseGradingError(
      "Your submission didn't match the questions you were given. Please refresh the page and try again."
    );
  }

  return submittedIds.map((id) => byId.get(id)!);
};

/**
 * Grade a submitted exercise server-side.
 *
 * The final score is rescaled to 0..10 so it flows through the existing grade UI.
 */
export const gradeExercise = (
  exercise: ServerExercise,
  answers: ExerciseAnswers,
  codeResults: CodeResults = {}
): GradeResult => {
  const tasks = tasksToGrade(exercise, answers);
  const threshold = exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD;

  let earnedPoints = 0;
  let totalPoints = 0;
  const goalTotals = new Map<string, { earned: number; total: number }>();

  const results: TaskResult[] = tasks.map((task) => {
    const id = taskId(task);
    const selected = answers[id] ?? [];
    const feedback = codeResults[id];
    const graded = gradeTask(task, selected, feedback);

    earnedPoints += graded.pointsEarned;
    totalPoints += graded.pointsPossible;

    if (task.goal) {
      const entry = goalTotals.get(task.goal) ?? { earned: 0, total: 0 };
      entry.earned += graded.pointsEarned;
      entry.total += graded.pointsPossible;
      goalTotals.set(task.goal, entry);
    }

    return {
      taskId: id,
      status: graded.status,
      correct: graded.correct,
      pointsEarned: graded.pointsEarned,
      pointsPossible: graded.pointsPossible,
      // The explanation typically restates the answer, so it's only revealed
      // once the student has it fully right; otherwise they get the hint,
      // which points back at the material without giving the answer away.
      explanation: graded.correct ? task.explanation : undefined,
      // A held answer gets neither: the hint would imply it was wrong, which
      // is exactly what has not been decided yet.
      hint: graded.status === "incorrect" ? task.hint : undefined,
      // Test outcomes, type errors and the mapped runtime error. Already
      // stripped of hidden test details by the runner.
      code: feedback,
    };
  });

  earnedPoints = round2(earnedPoints);
  const fraction = totalPoints > 0 ? earnedPoints / totalPoints : 0;
  const score = Math.round(fraction * 10 * 10) / 10; // 0..10, one decimal
  const passed = fraction >= threshold;

  const goalBreakdown =
    goalTotals.size > 0
      ? [...goalTotals.entries()].map(([goal, { earned, total }]) => ({
          goal,
          earnedPoints: round2(earned),
          totalPoints: total,
        }))
      : undefined;

  return {
    score,
    passed,
    earnedPoints,
    totalPoints,
    results,
    goalBreakdown,
    pendingCount: results.filter((r) => r.status === "pending").length,
  };
};

/** Fisher–Yates sample of `count` tasks; rng injectable for tests. */
const sampleTasks = (
  tasks: ServerTask[],
  count: number,
  rng: () => number
): ServerTask[] => {
  const pool = [...tasks];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

/**
 * Strip the answer key from an exercise so it can be safely sent to a student.
 * `correctAnswers`, `explanation`, `hint` and `goal` all stay server-side; the
 * first three are revealed selectively through grading results.
 *
 * When the exercise has a question pool, this is also where the random subset
 * is drawn — a fresh draw per fetch, so each visit can see different questions.
 * Returns undefined when there is no exercise.
 */
export const sanitizeExerciseForClient = (
  exercise: ServerExercise | null | undefined,
  rng: () => number = Math.random
): ExercisePublic | undefined => {
  if (!exercise || !Array.isArray(exercise.tasks)) return undefined;

  // Only gradeable tasks are candidates: filtering BEFORE the draw keeps a
  // pooled exercise serving exactly poolSize questions.
  const candidates = knownTasks(exercise);
  const poolSize = normalizedPoolSize(exercise);
  const servedTasks = poolSize
    ? sampleTasks(candidates, poolSize, rng)
    : candidates;

  const tasks: ExerciseTaskPublic[] = servedTasks.map(publicTask);

  return {
    tasks,
    passThreshold: exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD,
    // lets the UI say "6 questions (drawn from a pool of 14)"
    poolTotal: poolSize ? candidates.length : undefined,
  };
};

/**
 * Project one task to its client-safe shape, dispatching on type.
 *
 * This is the security boundary: every field a task type adds must be listed
 * explicitly here, so a new answer-key field can never reach a student by
 * being spread in accidentally.
 */
const publicTask = (task: ServerTask): ExerciseTaskPublic => {
  switch (task.type) {
    case "quiz":
      return {
        type: ExerciseTaskType.QUIZ,
        id: taskId(task),
        prompt: task.prompt,
        points: task.points ?? 1,
        options: task.options ?? [],
        allowMultiple: task.allowMultiple ?? false,
      };
    case "shortAnswer":
      // acceptedAnswers and pattern are the answer key — deliberately absent.
      return {
        type: ExerciseTaskType.SHORT_ANSWER,
        id: taskId(task),
        prompt: task.prompt,
        points: task.points ?? 1,
        ...(task.placeholder ? { placeholder: task.placeholder } : {}),
      };
    case "code":
      return {
        type: ExerciseTaskType.CODE,
        id: taskId(task),
        prompt: task.prompt,
        points: task.points ?? 1,
        entryPoint: task.entryPoint,
        starterCode: task.starterCode ?? "",
        requires: task.requires ?? [],
        // Hidden cases appear by label only: the student knows how many there
        // are and that they exist, without being able to special-case them.
        tests: (task.tests ?? []).map((test, i) => {
          const label = test.label ?? `Test ${i + 1}`;
          return test.hidden
            ? { label, hidden: true }
            : {
                label,
                hidden: false,
                args: JSON.stringify(test.args),
                expected: JSON.stringify(test.expected ?? null),
              };
        }),
      };
    default: {
      // Exhaustiveness guard: adding a member to ServerTask without handling it
      // here is now a compile error, not a task that fails at runtime.
      const unhandled: never = task;
      throw new Error(
        `Unhandled exercise task type: ${JSON.stringify(
          (unhandled as { type?: unknown }).type
        )}`
      );
    }
  }
};

/**
 * Produce a client-safe copy of a guide: removes the raw `exercise` (which holds
 * the answer key) and replaces it with a sanitized version. Use this anywhere a
 * guide is sent to a student/public view. Teacher-only views may use the raw guide.
 */
export const sanitizeGuideForClient = <T extends Record<string, any>>(
  guide: T
): Omit<T, "exercise"> & { exercise?: ExercisePublic } => {
  const { exercise, ...rest } = guide as T & {
    exercise?: ServerExercise | null;
  };
  return {
    ...(rest as Omit<T, "exercise">),
    exercise: sanitizeExerciseForClient(exercise),
  };
};

// ---------------------------------------------------------------------------
// Teacher analytics
// ---------------------------------------------------------------------------

/** The slice of an ExerciseAttempt the analytics need. */
export type AttemptForAnalytics = {
  owner: unknown;
  answers: ExerciseAnswers;
  score: number;
  passed: boolean;
  /** what the code tasks did when they ran; never recomputed here */
  codeResults?: CodeResults;
};

export type TaskStats = {
  taskId: string;
  prompt: string;
  goal?: string;
  /** attempts in which this task was served (i.e. answered) */
  timesAnswered: number;
  /** fraction of those that were FULLY correct, null when never answered */
  correctRate: number | null;
};

export type ExerciseAnalytics = {
  totalAttempts: number;
  uniqueStudents: number;
  /** students whose best attempt passed / unique students */
  studentPassRate: number | null;
  /** mean of each student's best score, one decimal */
  averageBestScore: number | null;
  taskStats: TaskStats[];
};

/**
 * Aggregate attempts into per-question difficulty and per-student outcomes.
 * Correctness is recomputed against the CURRENT answer key, so stats for
 * questions edited after attempts were made should be read with that in mind.
 */
export const computeExerciseAnalytics = (
  exercise: ServerExercise,
  attempts: AttemptForAnalytics[]
): ExerciseAnalytics => {
  const bestByStudent = new Map<string, { score: number; passed: boolean }>();
  for (const attempt of attempts) {
    const owner = String(attempt.owner);
    const best = bestByStudent.get(owner);
    if (!best || attempt.score > best.score) {
      bestByStudent.set(owner, {
        score: attempt.score,
        passed: attempt.passed,
      });
    } else if (attempt.passed && !best.passed && attempt.score === best.score) {
      bestByStudent.set(owner, best && { ...best, passed: true });
    }
  }

  const uniqueStudents = bestByStudent.size;
  const bests = [...bestByStudent.values()];
  const studentsPassed = bests.filter((b) => b.passed).length;

  const taskStats: TaskStats[] = knownTasks(exercise).map((task) => {
    const id = taskId(task);
    let timesAnswered = 0;
    let fullyCorrect = 0;
    for (const attempt of attempts) {
      const selected = attempt.answers?.[id];
      if (!selected) continue;
      timesAnswered += 1;
      // Quiz and short answer are recomputed against the CURRENT key, so
      // promoting an answer updates these stats for free. Code tasks use what
      // was recorded when they ran — re-running a sandbox per attempt would be
      // both slow and beside the point.
      if (gradeTask(task, selected, attempt.codeResults?.[id]).correct) {
        fullyCorrect += 1;
      }
    }
    return {
      taskId: id,
      prompt: task.prompt,
      goal: task.goal,
      timesAnswered,
      correctRate:
        timesAnswered > 0
          ? Math.round((fullyCorrect / timesAnswered) * 100) / 100
          : null,
    };
  });

  return {
    totalAttempts: attempts.length,
    uniqueStudents,
    studentPassRate:
      uniqueStudents > 0
        ? Math.round((studentsPassed / uniqueStudents) * 100) / 100
        : null,
    averageBestScore:
      bests.length > 0
        ? Math.round(
            (bests.reduce((sum, b) => sum + b.score, 0) / bests.length) * 10
          ) / 10
        : null,
    taskStats,
  };
};
