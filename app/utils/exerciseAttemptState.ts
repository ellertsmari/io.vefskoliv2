import {
  ExerciseTaskType,
  type ExerciseAnswerValue,
  type CodeFeedback,
} from "types/guideTypes";
import {
  DEFAULT_PASS_THRESHOLD,
  gradeTask,
  knownTasks,
  selectServedTasks,
  taskId,
  type CodeResults,
  type ExerciseAnswers,
  type ExerciseProgress,
  type ServerExercise,
  type ServerTask,
} from "./exerciseUtils";

/**
 * One continuous attempt per student per guide — see
 * docs/exercise-continuous-attempt.md.
 *
 * The attempt stores what the student DID. Everything else — which questions
 * are locked, what each is worth, the score — is derived here from that record
 * and the CURRENT answer key, so a teacher accepting a short-answer phrasing
 * re-grades everyone who wrote it without anything being rewritten.
 *
 * Pure: no database, no clock. Randomness is injected.
 */

// ---------------------------------------------------------------------------
// Stored shape
// ---------------------------------------------------------------------------

/** One question a quiz slot has held, and the single guess made on it. */
export type QuizSlotEntry = { taskId: string; answer?: number[] };

/**
 * A place in the quiz. A wrong guess locks the question it holds; asking for a
 * new one appends an entry, worth half of what the locked one was.
 */
export type QuizSlot = { entries: QuizSlotEntry[] };

export type AttemptState = {
  slots: QuizSlot[];
  /** short-answer and code tasks this student works on */
  served: string[];
  /** short answers: every try, in order — the halving is counted from these */
  tries: Record<string, ExerciseAnswerValue[]>;
  /** the latest answer per task: prefill, and what analytics read */
  answers: ExerciseAnswers;
  /** what each code task's latest run did */
  codeResults: CodeResults;
};

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

export type ItemStatus =
  /** nothing tried yet */
  | "open"
  | "correct"
  /** quiz: guessed wrong; the way on is a new question */
  | "locked"
  /** short answer or code: tried, not right yet, can try again */
  | "tried"
  /** short answer: held for the teacher, may yet be accepted */
  | "pending";

export type ItemState = {
  /** the task this item currently shows */
  taskId: string;
  type: ExerciseTaskType;
  status: ItemStatus;
  /** what a right answer earns now; for a locked quiz, what the NEXT question earns */
  worth: number;
  earned: number;
  /** the most this item could ever earn */
  base: number;
  /** answers given on this item so far (all of a slot's questions together) */
  tries: number;
  /** quiz only: index of the slot */
  slot?: number;
};

export type ScoreSummary = {
  /** 0..10, one decimal */
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  perfect: boolean;
  /** items with at least one answer */
  answered: number;
  total: number;
};

export type DerivedAttempt = { items: ItemState[]; summary: ScoreSummary };

const round2 = (n: number) => Math.round(n * 100) / 100;
const halved = (points: number, wrongs: number) => points * 0.5 ** wrongs;

const tasksById = (exercise: ServerExercise) => {
  const map = new Map<string, { task: ServerTask; index: number }>();
  knownTasks(exercise).forEach((task, index) =>
    map.set(taskId(task), { task, index })
  );
  return map;
};

const slotItem = (
  slot: QuizSlot,
  index: number,
  byId: ReturnType<typeof tasksById>
): ItemState => {
  const first = byId.get(slot.entries[0]?.taskId ?? "");
  const base = first?.task.points ?? 1;
  let wrongs = 0;
  let tries = 0;

  for (const entry of slot.entries) {
    if (!entry.answer) {
      // The question on show, not guessed yet.
      return {
        taskId: entry.taskId,
        type: ExerciseTaskType.QUIZ,
        status: "open",
        worth: halved(base, wrongs),
        earned: 0,
        base,
        tries,
        slot: index,
      };
    }
    tries += 1;
    const found = byId.get(entry.taskId);
    // A question deleted from the guide after it was answered counts as
    // missed rather than breaking the slot.
    if (found && gradeTask(found.task, entry.answer).correct) {
      const earned = round2(halved(base, wrongs));
      return {
        taskId: entry.taskId,
        type: ExerciseTaskType.QUIZ,
        status: "correct",
        worth: earned,
        earned,
        base,
        tries,
        slot: index,
      };
    }
    wrongs += 1;
  }

  return {
    taskId: slot.entries[slot.entries.length - 1]?.taskId ?? "",
    type: ExerciseTaskType.QUIZ,
    status: "locked",
    worth: halved(base, wrongs),
    earned: 0,
    base,
    tries,
    slot: index,
  };
};

const shortAnswerItem = (
  task: ServerTask,
  tries: ExerciseAnswerValue[]
): ItemState => {
  const base = task.points ?? 1;
  let wrongs = 0;
  let lastPending = false;
  for (const answer of tries) {
    const { status } = gradeTask(task, answer);
    if (status === "correct") {
      const earned = round2(halved(base, wrongs));
      return {
        taskId: taskId(task),
        type: ExerciseTaskType.SHORT_ANSWER,
        status: "correct",
        worth: earned,
        earned,
        base,
        tries: tries.length,
      };
    }
    // Held for review is not a wrong answer: it may yet be accepted.
    lastPending = status === "pending";
    if (status === "incorrect") wrongs += 1;
  }
  return {
    taskId: taskId(task),
    type: ExerciseTaskType.SHORT_ANSWER,
    status: tries.length === 0 ? "open" : lastPending ? "pending" : "tried",
    worth: halved(base, wrongs),
    earned: 0,
    base,
    tries: tries.length,
  };
};

const codeItem = (task: ServerTask, feedback?: CodeFeedback): ItemState => {
  const base = task.points ?? 1;
  const graded = gradeTask(task, "", feedback);
  return {
    taskId: taskId(task),
    type: ExerciseTaskType.CODE,
    status: graded.correct ? "correct" : feedback ? "tried" : "open",
    // Scored on the final code, so a right answer is always worth the lot.
    worth: base,
    earned: graded.pointsEarned,
    base,
    tries: feedback ? 1 : 0,
  };
};

/**
 * Every item's state and the score, from what the student did.
 *
 * Items come back in the order the teacher authored the questions; a quiz
 * slot keeps the position of the question it started with, so a replacement
 * appears where the locked one was.
 */
export const deriveAttempt = (
  exercise: ServerExercise,
  state: AttemptState
): DerivedAttempt => {
  const byId = tasksById(exercise);
  const placed: { order: number; item: ItemState }[] = [];

  state.slots.forEach((slot, index) => {
    if (slot.entries.length === 0) return;
    placed.push({
      order: byId.get(slot.entries[0].taskId)?.index ?? Infinity,
      item: slotItem(slot, index, byId),
    });
  });

  for (const id of state.served) {
    const found = byId.get(id);
    // Deleted from the guide since it was served: drop it rather than
    // scoring the student on a question that no longer exists.
    if (!found) continue;
    const item =
      found.task.type === ExerciseTaskType.CODE
        ? codeItem(found.task, state.codeResults[id])
        : shortAnswerItem(found.task, state.tries[id] ?? []);
    placed.push({ order: found.index, item });
  }

  const items = placed
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);

  const earnedPoints = round2(items.reduce((sum, i) => sum + i.earned, 0));
  const totalPoints = round2(items.reduce((sum, i) => sum + i.base, 0));
  const fraction = totalPoints > 0 ? earnedPoints / totalPoints : 0;
  const threshold = exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD;

  return {
    items,
    summary: {
      score: Math.round(fraction * 100) / 10,
      passed: totalPoints > 0 && fraction >= threshold,
      earnedPoints,
      totalPoints,
      perfect: totalPoints > 0 && earnedPoints === totalPoints,
      answered: items.filter((i) => i.tries > 0).length,
      total: items.length,
    },
  };
};

// ---------------------------------------------------------------------------
// Drawing questions
// ---------------------------------------------------------------------------

const emptyState = (): AttemptState => ({
  slots: [],
  served: [],
  tries: {},
  answers: {},
  codeResults: {},
});

/** A new student's attempt: the usual pooled draw, quiz questions as slots. */
export const freshAttemptState = (
  exercise: ServerExercise,
  rng: () => number
): AttemptState => {
  const state = emptyState();
  for (const task of selectServedTasks(exercise, rng)) {
    if (task.type === ExerciseTaskType.QUIZ) {
      state.slots.push({ entries: [{ taskId: taskId(task) }] });
    } else {
      state.served.push(taskId(task));
    }
  }
  return state;
};

/**
 * The question to put in a locked slot, or null when the pool is used up.
 *
 * Never one the student has already held in any slot — they have either got
 * it right or been shown the answer. The same learning goal first, so the slot
 * keeps asking about the topic the student missed.
 */
export const pickReplacement = (
  exercise: ServerExercise,
  state: AttemptState,
  lockedTaskId: string,
  rng: () => number
): ServerTask | null => {
  const seen = new Set(
    state.slots.flatMap((slot) => slot.entries.map((e) => e.taskId))
  );
  const unseen = knownTasks(exercise).filter(
    (t) => t.type === ExerciseTaskType.QUIZ && !seen.has(taskId(t))
  );
  if (unseen.length === 0) return null;

  const goal = tasksById(exercise).get(lockedTaskId)?.task.goal;
  const sameGoal = goal ? unseen.filter((t) => t.goal === goal) : [];
  const from = sameGoal.length > 0 ? sameGoal : unseen;
  return from[Math.floor(rng() * from.length)] ?? null;
};

// ---------------------------------------------------------------------------
// Merging the old numbered attempts
// ---------------------------------------------------------------------------

/** The slice of an old attempt document the merge reads. */
export type LegacyAttempt = {
  attemptNumber?: number;
  createdAt?: Date;
  answers?: ExerciseAnswers;
  taskProgress?: ExerciseProgress;
  codeResults?: CodeResults;
};

/**
 * Fold a student's old attempts into one, with a one-time amnesty.
 *
 * Anything right in ANY attempt counts at full points — including answers that
 * were right only on a later try, which scored nothing under the first-try
 * rule. Questions tried and never got right come back open, at full value.
 * Nobody's grade goes down: the best result per task is kept.
 */
export const mergeLegacyAttempts = (
  exercise: ServerExercise,
  legacy: LegacyAttempt[],
  rng: () => number
): AttemptState => {
  const byId = tasksById(exercise);
  // Newest first, so "the latest answer" and "most recently tried" fall out of
  // iteration order.
  const attempts = [...legacy].sort(
    (a, b) =>
      (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0) ||
      (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
  );

  const correctAnswer = new Map<string, ExerciseAnswerValue>();
  const touched: string[] = [];
  const latestAnswer = new Map<string, ExerciseAnswerValue>();
  const bestCode = new Map<
    string,
    { feedback: CodeFeedback; answer?: ExerciseAnswerValue; points: number }
  >();

  for (const attempt of attempts) {
    const answers = attempt.answers ?? {};
    const ids = new Set([
      ...Object.keys(answers),
      ...Object.keys(attempt.taskProgress ?? {}),
    ]);
    for (const id of ids) {
      const found = byId.get(id);
      if (!found) continue;
      const { task } = found;
      const answer = answers[id];
      const tries = attempt.taskProgress?.[id]?.tries;
      if (tries === 0 && answer === undefined) continue;

      if (!touched.includes(id)) touched.push(id);
      if (answer !== undefined && !latestAnswer.has(id)) {
        latestAnswer.set(id, answer);
      }

      if (task.type === ExerciseTaskType.CODE) {
        const feedback = attempt.codeResults?.[id];
        if (!feedback) continue;
        const points = gradeTask(task, "", feedback).pointsEarned;
        const best = bestCode.get(id);
        if (!best || points > best.points) {
          bestCode.set(id, { feedback, answer, points });
        }
        continue;
      }

      if (correctAnswer.has(id) || answer === undefined) continue;
      // Re-checked against the current key rather than trusting the stored
      // verdict: the new attempt derives its score from this answer, so an
      // answer the key no longer accepts must not be carried in as "right".
      if (gradeTask(task, answer).correct) correctAnswer.set(id, answer);
    }
  }

  const fresh = freshAttemptState(exercise, rng);
  const state = emptyState();

  // Quiz: as many slots as a new student gets. Right answers first, then the
  // ones tried and missed (open again), then fresh questions.
  const quizCount = fresh.slots.length;
  const quizIds = knownTasks(exercise)
    .filter((t) => t.type === ExerciseTaskType.QUIZ)
    .map(taskId);
  const quizOrder = [
    ...touched.filter((id) => correctAnswer.has(id)),
    ...touched.filter((id) => !correctAnswer.has(id)),
    ...fresh.slots.map((s) => s.entries[0].taskId),
    ...quizIds,
  ].filter((id) => quizIds.includes(id));
  for (const id of new Set(quizOrder)) {
    if (state.slots.length >= quizCount) break;
    const answer = correctAnswer.get(id);
    state.slots.push({
      entries: [answer ? { taskId: id, answer: answer as number[] } : { taskId: id }],
    });
    if (answer) state.answers[id] = answer;
  }

  // Short answer and code: the same number of each type as a fresh draw,
  // preferring the ones the student already worked on.
  const servedByType = new Map<string, number>();
  for (const id of fresh.served) {
    const type = byId.get(id)?.task.type ?? "";
    servedByType.set(type, (servedByType.get(type) ?? 0) + 1);
  }
  for (const [type, count] of servedByType) {
    const ofType = (id: string) => byId.get(id)?.task.type === type;
    const order = new Set([
      ...touched.filter((id) => ofType(id) && (correctAnswer.has(id) || bestCode.has(id))),
      ...touched.filter(ofType),
      ...fresh.served.filter(ofType),
    ]);
    [...order].slice(0, count).forEach((id) => state.served.push(id));
  }

  for (const id of state.served) {
    const task = byId.get(id)!.task;
    if (task.type === ExerciseTaskType.CODE) {
      const best = bestCode.get(id);
      if (best) {
        state.codeResults[id] = best.feedback;
        if (best.answer !== undefined) state.answers[id] = best.answer;
      } else if (latestAnswer.has(id)) {
        state.answers[id] = latestAnswer.get(id)!;
      }
      continue;
    }
    const right = correctAnswer.get(id);
    const latest = latestAnswer.get(id);
    if (right !== undefined) {
      state.tries[id] = [right];
      state.answers[id] = right;
    } else if (
      latest !== undefined &&
      gradeTask(task, latest).status === "pending"
    ) {
      // Still waiting on the teacher: keep it, so accepting it counts.
      state.tries[id] = [latest];
      state.answers[id] = latest;
    }
  }

  return state;
};
