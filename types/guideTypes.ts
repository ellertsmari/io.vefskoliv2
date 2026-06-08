import { Types } from "mongoose";
import { ModuleType, GuideType } from "../app/models/guide";
import { ReviewDocument, GradedReviewDocument } from "../app/models/review";
import { ReturnDocument } from "../app/models/return";

export type ReviewDocumentWithReturn = ReviewDocument & {
  associatedReturn?: ReturnDocument;
};

/**
 * How a guide is completed and graded.
 * - PEER_REVIEW (default): the original flow — submit a project, get peer reviews,
 *   teacher grades the reviews.
 * - AUTO: the guide is an interactive exercise graded automatically server-side;
 *   peer review is skipped entirely. See `exercise` on the guide and the
 *   `submitExercise` server action.
 */
export enum GradingMode {
  PEER_REVIEW = "peerReview",
  AUTO = "auto",
}

/** Kinds of auto-graded task. Phase 1 ships QUIZ; short-answer / code follow. */
export enum ExerciseTaskType {
  QUIZ = "quiz",
}

/**
 * A quiz task as sent to the CLIENT — note it deliberately omits the answer key
 * (`correctAnswers`) and any solution explanation. Those stay server-side; see
 * `sanitizeGuideForClient` in utils/exerciseUtils.
 */
export type QuizTaskPublic = {
  type: ExerciseTaskType.QUIZ;
  id: string;
  prompt: string;
  options: string[];
  /** true for multi-select, false for single-choice */
  allowMultiple: boolean;
  /** points this task contributes to the exercise total */
  points: number;
};

export type ExerciseTaskPublic = QuizTaskPublic;

export type ExercisePublic = {
  tasks: ExerciseTaskPublic[];
  /** fraction of total points required to pass, 0..1 */
  passThreshold: number;
};

/**
 * A guide as safely sent to a student/public view: the raw `exercise` (with its
 * answer key) is replaced by the sanitized `ExercisePublic`. Produced by
 * `sanitizeGuideForClient`.
 */
export type ClientGuide = Omit<GuideType, "exercise" | "gradingMode"> & {
  gradingMode?: GradingMode;
  exercise?: ExercisePublic;
};

/** A student's attempt at an auto-graded exercise, as surfaced to status/grade calc. */
export type ExerciseAttemptInfo = {
  _id: Types.ObjectId;
  /** 0..10 score, matching the peer-review grade scale */
  score: number;
  passed: boolean;
  createdAt: Date;
};

export type GuideInfo = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  order: number;
  module: ModuleType;

  /** Defaults to PEER_REVIEW for existing guides (field absent in the DB). */
  gradingMode?: GradingMode;

  // this user's project returns
  returnsSubmitted: ReturnDocument[];
  reviewsReceived: ReviewDocument[];

  // reviewing others' returns
  availableForReview: ReturnDocument[];
  reviewsGiven: ReviewDocumentWithReturn[];

  // grades received by others on reviews given by this user
  gradesReceived: GradedReviewDocument[];

  // grading others' reviews
  gradesGiven: GradedReviewDocument[];
  availableToGrade: ReviewDocument[];

  // auto-graded guides only: this user's attempts at the exercise
  exerciseAttempts?: ExerciseAttemptInfo[];
};

/** @deprecated Use ReviewDocumentWithReturn instead */
export type FeedbackDocumentWithReturn = ReviewDocumentWithReturn;

export type GuideWithLink = GuideInfo & { link: string };

export type Module = {
  title: string;
  number: number;
};

export type ExtendedGuideInfo = GuideWithLink & {
  link: string;
  returnStatus: ReturnStatus;
  reviewStatus: ReviewStatus;
  gradesReceivedStatus: GradesReceivedStatus;
  grade: number | undefined;
  gradesGivenStatus: GradesGivenStatus;
};

export enum ReturnStatus {
  NOT_RETURNED = "Not Returned",
  AWAITING_REVIEWS = "AWAITING REVIEWS",
  PASSED = "PASSED",
  HALL_OF_FAME = "HALL OF FAME",
  FAILED = "FAILED",
}

export enum ReviewStatus {
  AWAITING_PROJECTS = "Awaiting projects to review",
  NEED_TO_REVIEW = "GIVE REVIEW",
  REVIEWS_GIVEN = "Reviews given",
  /** Auto-graded guides have no peer-review step. */
  NOT_APPLICABLE = "Not applicable",
}

export enum GradesGivenStatus {
  AWAITING_REVIEWS = "Awaiting reviews to grade",
  NEED_TO_GRADE = "GIVE GRADE",
  GRADES_GIVEN = "Grades given",
  /** Auto-graded guides have no peer-grading step. */
  NOT_APPLICABLE = "Not applicable",
}

export enum GradesReceivedStatus {
  AWAITING_GRADES = "Awaiting grades",
  GRADES_RECEIVED = "Grades received",
  /** Auto-graded guides are scored on submission, not via peer grades. */
  NOT_APPLICABLE = "Not applicable",
}

// Legacy aliases for backwards compatibility
/** @deprecated Use ReturnStatus.AWAITING_REVIEWS instead */
export const AWAITING_FEEDBACK = ReturnStatus.AWAITING_REVIEWS;
/** @deprecated Use ReviewStatus instead */
export const FeedbackStatus = ReviewStatus;
