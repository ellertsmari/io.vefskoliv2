import { Types } from "mongoose";

/** The scale every guide grade in this system is already on. */
export const CANVAS_SCORE_MAXIMUM = 10;

/**
 * A guide's outcome for one student, in the vocabulary Canvas understands.
 *
 * `scoreGiven` is deliberately optional. "Not handed in yet" and "handed in and
 * scored zero" are the same `undefined` inside `calculateGrade`, but in a
 * gradebook they are opposites: a blank cell is a student who still has time,
 * and a 0 is a judgement. Collapsing them would either invent failures or hide
 * them, so the distinction is restored here and carried through as an explicit
 * state rather than being re-derived by each sink.
 */
export type CanvasScore = {
  scoreGiven?: number;
  scoreMaximum: number;
  activityProgress:
    | "Initialized"
    | "Started"
    | "InProgress"
    | "Submitted"
    | "Completed";
  gradingProgress:
    | "FullyGraded"
    | "Pending"
    | "PendingManual"
    | "Failed"
    | "NotReady";
  comment?: string;
};

/** One student's grade for one guide, addressed to one Canvas course. */
export type CanvasGradePush = {
  userId: Types.ObjectId;
  guideId: Types.ObjectId;
  contextId: string;
  score: CanvasScore;
};

/**
 * Where grades come out.
 *
 * The interface exists because the AGS implementation is blocked on a Canvas
 * developer key that has to come from the school's IT department, while
 * everything upstream of it — routing, score semantics, the change detection
 * that decides who needs re-pushing — is ours to build and test today. A CSV
 * export implements the same contract and is useful on its own as a manual
 * fallback, so the blocked work is one adapter rather than the whole feature.
 */
export interface GradeSink {
  readonly name: string;
  push(grades: CanvasGradePush[]): Promise<GradeSinkResult>;
}

export type GradeSinkResult = {
  delivered: number;
  /** Pushes that failed, paired with why, for retry and for the admin UI. */
  failures: Array<{ push: CanvasGradePush; reason: string }>;
};
