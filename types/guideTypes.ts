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

/**
 * Kinds of auto-graded task. QUIZ ships today; SHORT_ANSWER and CODE follow in
 * phases 1 and 2 (see docs/exercise-engine-tasks.md).
 *
 * Everything downstream discriminates on this field rather than assuming quiz:
 * grading dispatches in `gradeTask`, serving dispatches in
 * `sanitizeExerciseForClient`, and rendering dispatches in `ExerciseView`.
 */
export enum ExerciseTaskType {
  QUIZ = "quiz",
  SHORT_ANSWER = "shortAnswer",
  CODE = "code",
}

/** Longest submission a code task will accept. */
export const MAX_CODE_LENGTH = 20000;

/**
 * Constructs a code task can require the student to use. Deliberately a small,
 * fixed vocabulary covering what Module 3 teaches rather than a general query
 * language — see docs/exercise-engine-tasks.md, decision 9.
 *
 * `iteration` is usually the right choice over `loop`: it accepts an array
 * method too, so a student who reaches for .reduce() is not punished for
 * writing the better solution.
 */
export enum CodeConstruct {
  LOOP = "loop",
  ARRAY_METHOD = "arrayMethod",
  ITERATION = "iteration",
  CONDITIONAL = "conditional",
  FUNCTION = "function",
  ARROW_FUNCTION = "arrowFunction",
  TYPE_ANNOTATION = "typeAnnotation",
  RECURSION = "recursion",
}

/**
 * How a required construct is described to a student.
 *
 * Lives here, beside the enum, rather than next to the AST code that detects
 * them: that module imports the TypeScript compiler, and the student-facing
 * exercise view must not drag that into the browser bundle. This file has no
 * heavy imports, so both sides can share one copy.
 */
export const CONSTRUCT_LABELS: Record<CodeConstruct, string> = {
  [CodeConstruct.LOOP]: "a loop (for, for…of or while)",
  [CodeConstruct.ARRAY_METHOD]: "an array method such as .map or .reduce",
  [CodeConstruct.ITERATION]: "a loop or an array method",
  [CodeConstruct.CONDITIONAL]: "a conditional (if, switch or ?:)",
  [CodeConstruct.FUNCTION]: "a function",
  [CodeConstruct.ARROW_FUNCTION]: "an arrow function",
  [CodeConstruct.TYPE_ANNOTATION]: "type annotations on your variables",
  [CodeConstruct.RECURSION]: "a function that calls itself",
};

/** A pointer to the material that answers a question. */
export type HelpLink = {
  label: string;
  url: string;
};

/** What every task carries, whatever its type. */
export type TaskPublicBase = {
  id: string;
  prompt: string;
  /** points this task contributes to the exercise total */
  points: number;
  /**
   * Where to read up on this question. Shown beside the question from the
   * start — not answer key, and a student who goes and reads the material has
   * done exactly what the exercise is for.
   */
  helpLinks?: HelpLink[];
  /** Longer guidance shown alongside the links. Also not answer key. */
  helpText?: string;
};

/**
 * A quiz task as sent to the CLIENT — note it deliberately omits the answer key
 * (`correctAnswers`) and any solution explanation. Those stay server-side; see
 * `sanitizeGuideForClient` in utils/exerciseUtils.
 */
export type QuizTaskPublic = TaskPublicBase & {
  type: ExerciseTaskType.QUIZ;
  options: string[];
  /** true for multi-select, false for single-choice */
  allowMultiple: boolean;
};

/**
 * A short-answer task as sent to the CLIENT. The accepted answers and the
 * optional pattern are the answer key and stay server-side.
 */
export type ShortAnswerTaskPublic = TaskPublicBase & {
  type: ExerciseTaskType.SHORT_ANSWER;
  /** optional example of the expected form, e.g. "one word" */
  placeholder?: string;
};

/** A test case as shown to the student. Hidden ones carry no inputs. */
export type CodeTestPublic = {
  label: string;
  hidden: boolean;
  /** JSON-rendered arguments, omitted for hidden tests */
  args?: string;
  /** JSON-rendered expected value, omitted for hidden tests */
  expected?: string;
};

/**
 * A code task as sent to the CLIENT. Hidden test cases appear by label only, so
 * the student knows how many there are without being able to special-case them.
 */
export type CodeTaskPublic = TaskPublicBase & {
  type: ExerciseTaskType.CODE;
  /** the function the tests will call */
  entryPoint: string;
  starterCode: string;
  tests: CodeTestPublic[];
  /** constructs the solution is expected to use, for display */
  requires: CodeConstruct[];
};

/** Discriminated on `type`; gains members as the phases land. */
export type ExerciseTaskPublic =
  | QuizTaskPublic
  | ShortAnswerTaskPublic
  | CodeTaskPublic;

/** One test case's outcome. Hidden cases report pass/fail and nothing else. */
export type CodeTestResult = {
  label: string;
  hidden: boolean;
  passed: boolean;
  /** JSON-rendered, visible tests only */
  expected?: string;
  actual?: string;
  /** the error this case threw, if any */
  error?: string;
};

/** Everything a student is told about their code submission. */
export type CodeFeedback = {
  /** false when type errors stopped it from running at all */
  compiled: boolean;
  /** positions refer to the student's own source lines */
  typeErrors: { line: number; column: number; message: string }[];
  tests: CodeTestResult[];
  testsPassed: number;
  testsTotal: number;
  /** plain-language cause plus the real error, mapped to the student's line */
  runtimeError?: { summary: string; detail: string; line?: number };
  constructsMet: boolean;
  missingConstructs: CodeConstruct[];
};

/**
 * One task's answer, as submitted. The SHAPE IS DETERMINED BY THE TASK, not by
 * the submission — the server always knows the task's type from the guide, so
 * answers stay untagged and previously stored attempts keep working unchanged.
 *
 * quiz: the selected option indices. shortAnswer and code: the typed text.
 */
export type ExerciseAnswerValue = number[] | string;

/**
 * How a single task came out. `pending` means the answer was close enough to an
 * accepted one that it is held for a teacher rather than marked wrong — see
 * docs/exercise-engine-tasks.md, decision 2.
 */
export type TaskStatus = "correct" | "incorrect" | "pending";

/**
 * One task type being drawn from a pool: how many were served this visit and
 * how many exist. Lets the UI say "6 of 14 questions · 2 of 5 coding problems".
 */
export type ExercisePool = {
  type: ExerciseTaskType;
  served: number;
  total: number;
};

export type ExercisePublic = {
  tasks: ExerciseTaskPublic[];
  /** fraction of total points required to pass, 0..1 */
  passThreshold: number;
  /** present for each type that is pooled; absent when nothing is pooled */
  pools?: ExercisePool[];
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
  /** Derived mirror of (discipline, isSpecialty); read via utils/guideTaxonomy. */
  category: string;
  /** Canonical taxonomy axes (may be absent on un-migrated guides). */
  discipline?: "code" | "design";
  isSpecialty?: boolean;
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
