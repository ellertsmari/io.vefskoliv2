import { ObjectId } from "mongodb";
import { ExerciseAttempt } from "models/exerciseAttempt";
import {
  deriveAttempt,
  freshAttemptState,
  mergeLegacyAttempts,
  type AttemptState,
  type DerivedAttempt,
  type LegacyAttempt,
} from "utils/exerciseAttemptState";
import type { ServerExercise } from "utils/exerciseUtils";

/**
 * Loading and saving the one continuous attempt.
 *
 * Deliberately NOT a "use server" module: these take an owner id as an
 * argument, and every export of a "use server" file is callable from the
 * browser — a student could pass someone else's id. Server actions call these
 * after resolving the owner from the session.
 */

type AttemptDoc = InstanceType<typeof ExerciseAttempt> & {
  _id: ObjectId;
  slots?: AttemptState["slots"];
  served?: string[];
  tries?: AttemptState["tries"];
  answers?: AttemptState["answers"];
  codeResults?: AttemptState["codeResults"];
  score: number;
  passed: boolean;
  answeredCount?: number;
};

export const LEGACY_STATUSES = ["submitted", "inProgress"];

const DUPLICATE_KEY = 11000;

export const stateOf = (doc: AttemptDoc): AttemptState => ({
  slots: doc.slots ?? [],
  served: doc.served ?? [],
  tries: doc.tries ?? {},
  answers: doc.answers ?? {},
  codeResults: doc.codeResults ?? {},
});

/**
 * Write a changed state back, with the score cached alongside it.
 * Mixed fields are replaced wholesale and marked modified — mongoose does not
 * see changes nested inside them.
 */
export const saveAttempt = async (
  doc: AttemptDoc,
  exercise: ServerExercise,
  state: AttemptState
): Promise<DerivedAttempt> => {
  const derived = deriveAttempt(exercise, state);
  doc.set({
    slots: state.slots,
    served: state.served,
    tries: state.tries,
    answers: state.answers,
    codeResults: state.codeResults,
    score: derived.summary.score,
    passed: derived.summary.passed,
    answeredCount: derived.summary.answered,
  });
  for (const field of ["slots", "tries", "answers", "codeResults"]) {
    doc.markModified(field);
  }
  await doc.save();
  return derived;
};

/**
 * Re-derive and correct the cached score if the answer key or the pass mark
 * changed since it was written. Writes nothing when it is already right.
 */
export const refreshCachedScore = async (
  doc: AttemptDoc,
  exercise: ServerExercise
): Promise<DerivedAttempt> => {
  const derived = deriveAttempt(exercise, stateOf(doc));
  const { score, passed, answered } = derived.summary;
  if (
    doc.score !== score ||
    doc.passed !== passed ||
    doc.answeredCount !== answered
  ) {
    await ExerciseAttempt.updateOne(
      { _id: doc._id },
      { $set: { score, passed, answeredCount: answered } }
    );
    doc.score = score;
    doc.passed = passed;
    doc.answeredCount = answered;
  }
  return derived;
};

/** The student's active attempt, or null if they have none yet. */
export const findActiveAttempt = async (
  ownerId: string,
  guideId: string
): Promise<AttemptDoc | null> =>
  (await ExerciseAttempt.findOne({
    guide: new ObjectId(guideId),
    owner: new ObjectId(ownerId),
    status: "active",
  })) as AttemptDoc | null;

/** Whether the student has old numbered attempts not yet merged. */
export const hasLegacyAttempts = async (
  ownerId: string,
  guideId: string
): Promise<boolean> =>
  (await ExerciseAttempt.exists({
    guide: new ObjectId(guideId),
    owner: new ObjectId(ownerId),
    status: { $in: LEGACY_STATUSES },
  })) !== null;

/**
 * The student's active attempt, created if needed — merging any old numbered
 * attempts into it the first time.
 *
 * Two requests racing to create it (two tabs, a double click) are settled by
 * the unique index: the loser reads the winner's document.
 */
export const ensureActiveAttempt = async (
  exercise: ServerExercise,
  ownerId: string,
  guideId: string,
  rng: () => number = Math.random
): Promise<AttemptDoc> => {
  const existing = await findActiveAttempt(ownerId, guideId);
  if (existing) return existing;

  const guide = new ObjectId(guideId);
  const owner = new ObjectId(ownerId);
  const legacy = (await ExerciseAttempt.find({
    guide,
    owner,
    status: { $in: LEGACY_STATUSES },
  })
    .select("_id attemptNumber createdAt answers taskProgress codeResults")
    .lean()) as unknown as (LegacyAttempt & { _id: ObjectId })[];

  const state =
    legacy.length > 0
      ? mergeLegacyAttempts(exercise, legacy, rng)
      : freshAttemptState(exercise, rng);
  const { summary } = deriveAttempt(exercise, state);

  let created: AttemptDoc;
  try {
    created = (await ExerciseAttempt.create({
      guide,
      owner,
      status: "active",
      attemptNumber: 1,
      ...state,
      score: summary.score,
      passed: summary.passed,
      answeredCount: summary.answered,
    })) as AttemptDoc;
  } catch (error) {
    if ((error as { code?: number }).code === DUPLICATE_KEY) {
      const winner = await findActiveAttempt(ownerId, guideId);
      if (winner) return winner;
    }
    throw error;
  }

  if (legacy.length > 0) {
    await ExerciseAttempt.updateMany(
      { _id: { $in: legacy.map((a) => a._id) } },
      { $set: { status: "merged" } }
    );
  }
  return created;
};
