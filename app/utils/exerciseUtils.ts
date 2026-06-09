import {
  ExercisePublic,
  ExerciseTaskPublic,
  ExerciseTaskType,
} from "types/guideTypes";

/**
 * Server-side shape of an exercise task, including the answer key. This is what
 * lives on the Guide document. Kept permissive (plain object) because it arrives
 * either as a mongoose doc or a JSON-serialized plain object.
 */
export type ServerQuizTask = {
  _id?: unknown;
  id?: string;
  type: "quiz";
  prompt: string;
  options: string[];
  allowMultiple?: boolean;
  points?: number;
  correctAnswers: number[];
  explanation?: string;
  hint?: string;
  /** Optional knowledge goal (one of the guide's knowledge items) this task assesses. */
  goal?: string;
};

export type ServerExercise = {
  tasks: ServerQuizTask[];
  passThreshold?: number;
  /**
   * When set (and smaller than tasks.length), each visit serves a random
   * subset of this many questions instead of the full set.
   */
  poolSize?: number;
};

/** Student answers: task id -> selected option indices. */
export type ExerciseAnswers = Record<string, number[]>;

export type TaskResult = {
  taskId: string;
  /** true only for a FULLY correct answer */
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  /** revealed only when the task was answered fully CORRECTLY */
  explanation?: string;
  /** revealed when the task was answered incorrectly or only partially */
  hint?: string;
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
};

/** Thrown when a submission doesn't match the questions that were served. */
export class ExerciseGradingError extends Error {}

const DEFAULT_PASS_THRESHOLD = 0.7;

/** Stable string id for a task, whether it's a mongoose doc or serialized JSON. */
export const taskId = (task: { _id?: unknown; id?: string }): string =>
  String(task.id ?? task._id ?? "");

const round2 = (n: number) => Math.round(n * 100) / 100;

/** poolSize is only meaningful as an integer in [1, tasks.length). */
const normalizedPoolSize = (
  exercise: ServerExercise
): number | undefined => {
  const { poolSize, tasks } = exercise;
  if (
    typeof poolSize === "number" &&
    Number.isInteger(poolSize) &&
    poolSize >= 1 &&
    poolSize < (tasks?.length ?? 0)
  ) {
    return poolSize;
  }
  return undefined;
};

/**
 * Grade a single task.
 *
 * Single-choice: all-or-nothing. Multi-select: partial credit —
 * points * max(0, (correct selections - incorrect selections) / total correct).
 * A student who finds 3 of 4 right answers is not in the same place as one who
 * found none; the penalty for wrong selections keeps select-everything at zero.
 */
export const gradeTask = (
  task: ServerQuizTask,
  selected: number[]
): { correct: boolean; pointsEarned: number; pointsPossible: number } => {
  const points = task.points ?? 1;
  const correctSet = new Set(task.correctAnswers ?? []);
  const selectedSet = new Set(selected);

  if (!task.allowMultiple) {
    const correct =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every((i) => correctSet.has(i));
    return {
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
    correct: fraction === 1,
    pointsEarned: round2(points * fraction),
    pointsPossible: points,
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
): ServerQuizTask[] => {
  const allTasks = exercise.tasks ?? [];
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
  answers: ExerciseAnswers
): GradeResult => {
  const tasks = tasksToGrade(exercise, answers);
  const threshold = exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD;

  let earnedPoints = 0;
  let totalPoints = 0;
  const goalTotals = new Map<string, { earned: number; total: number }>();

  const results: TaskResult[] = tasks.map((task) => {
    const id = taskId(task);
    const selected = answers[id] ?? [];
    const graded = gradeTask(task, selected);

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
      correct: graded.correct,
      pointsEarned: graded.pointsEarned,
      pointsPossible: graded.pointsPossible,
      // The explanation typically restates the answer, so it's only revealed
      // once the student has it fully right; otherwise they get the hint,
      // which points back at the material without giving the answer away.
      explanation: graded.correct ? task.explanation : undefined,
      hint: graded.correct ? undefined : task.hint,
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

  return { score, passed, earnedPoints, totalPoints, results, goalBreakdown };
};

/** Fisher–Yates sample of `count` tasks; rng injectable for tests. */
const sampleTasks = (
  tasks: ServerQuizTask[],
  count: number,
  rng: () => number
): ServerQuizTask[] => {
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

  const poolSize = normalizedPoolSize(exercise);
  const servedTasks = poolSize
    ? sampleTasks(exercise.tasks, poolSize, rng)
    : exercise.tasks;

  const tasks: ExerciseTaskPublic[] = servedTasks.map((task) => ({
    type: ExerciseTaskType.QUIZ,
    id: taskId(task),
    prompt: task.prompt,
    options: task.options ?? [],
    allowMultiple: task.allowMultiple ?? false,
    points: task.points ?? 1,
  }));

  return {
    tasks,
    passThreshold: exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD,
    // lets the UI say "6 questions (drawn from a pool of 14)"
    poolTotal: poolSize ? exercise.tasks.length : undefined,
  };
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

  const taskStats: TaskStats[] = (exercise.tasks ?? []).map((task) => {
    const id = taskId(task);
    let timesAnswered = 0;
    let fullyCorrect = 0;
    for (const attempt of attempts) {
      const selected = attempt.answers?.[id];
      if (!selected) continue;
      timesAnswered += 1;
      if (gradeTask(task, selected).correct) fullyCorrect += 1;
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
