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
};

export type ServerExercise = {
  tasks: ServerQuizTask[];
  passThreshold?: number;
};

/** Student answers: task id -> selected option indices. */
export type ExerciseAnswers = Record<string, number[]>;

export type TaskResult = {
  taskId: string;
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  /** revealed only after grading */
  explanation?: string;
};

export type GradeResult = {
  /** 0..10, matching the peer-review grade scale */
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  results: TaskResult[];
};

const DEFAULT_PASS_THRESHOLD = 0.7;

/** Stable string id for a task, whether it's a mongoose doc or serialized JSON. */
export const taskId = (task: { _id?: unknown; id?: string }): string =>
  String(task.id ?? task._id ?? "");

/** Order-independent set equality for two index arrays. */
const sameIndexSet = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((i) => setA.has(i));
};

/**
 * Grade a submitted exercise server-side.
 *
 * Quiz scoring is all-or-nothing per task: the selected option set must exactly
 * match the answer key to earn that task's points (no partial credit in phase 1).
 * The final score is rescaled to 0..10 so it flows through the existing grade UI.
 */
export const gradeExercise = (
  exercise: ServerExercise,
  answers: ExerciseAnswers
): GradeResult => {
  const tasks = exercise.tasks ?? [];
  const threshold = exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD;

  let earnedPoints = 0;
  let totalPoints = 0;

  const results: TaskResult[] = tasks.map((task) => {
    const points = task.points ?? 1;
    totalPoints += points;

    const id = taskId(task);
    const selected = answers[id] ?? [];
    const correct = sameIndexSet(selected, task.correctAnswers ?? []);
    const pointsEarned = correct ? points : 0;
    earnedPoints += pointsEarned;

    return {
      taskId: id,
      correct,
      pointsEarned,
      pointsPossible: points,
      explanation: task.explanation,
    };
  });

  const fraction = totalPoints > 0 ? earnedPoints / totalPoints : 0;
  const score = Math.round(fraction * 10 * 10) / 10; // 0..10, one decimal
  const passed = fraction >= threshold;

  return { score, passed, earnedPoints, totalPoints, results };
};

/**
 * Strip the answer key from an exercise so it can be safely sent to a student.
 * Returns undefined when there is no exercise.
 */
export const sanitizeExerciseForClient = (
  exercise: ServerExercise | null | undefined
): ExercisePublic | undefined => {
  if (!exercise || !Array.isArray(exercise.tasks)) return undefined;

  const tasks: ExerciseTaskPublic[] = exercise.tasks.map((task) => ({
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
