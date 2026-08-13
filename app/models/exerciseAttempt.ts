import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

/**
 * A student's attempt at an auto-graded guide exercise.
 *
 * One document per submission (students may retry, producing multiple attempts).
 * `score` is on the same 0..10 scale as peer-review grades so it flows through the
 * existing grade/progress UI unchanged. Grading happens server-side in the
 * `submitExercise` action; the stored answers are the student's raw responses.
 */
const exerciseAttemptSchema = new Schema({
  guide: { type: Schema.Types.ObjectId, required: true, ref: "Guide", index: true },
  owner: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },

  // Raw student answers, keyed by task id. The value's shape follows the task:
  // option indices for quiz, text for short answer and code.
  answers: { type: Schema.Types.Mixed, required: true },

  // Code tasks only: the outcome of running the submission, keyed by task id.
  //
  // Stored rather than recomputed because running the sandbox is asynchronous
  // and expensive, while grading is re-run synchronously whenever the answer
  // key changes (analytics, promoting a short answer). The code ran once, at
  // submission; this is what it did.
  codeResults: { type: Schema.Types.Mixed, required: false },

  // Which attempt this is for the student, counting from 1. The question pool
  // is drawn from this, so an attempt keeps its questions from start to finish
  // and a later attempt gets a different set. Without it, "improve your grade"
  // would re-serve the questions whose answers the student was just shown.
  attemptNumber: { type: Schema.Types.Number, required: true, default: 1 },

  // An attempt is worked through one question at a time and only scores when
  // it is finished. Exactly one in-progress attempt exists per student per
  // guide (partial unique index below).
  status: {
    type: Schema.Types.String,
    required: true,
    enum: ["inProgress", "submitted"],
    default: "submitted",
  },

  // Per-task record, keyed by task id: how it went while working through.
  //
  // Kept SERVER-SIDE because the grade depends on it. The score is first-try
  // accuracy, so a client that reported its own progress could simply claim
  // everything was right first time.
  //
  //   { tries: number, correct: boolean, firstTryCorrect: boolean,
  //     skipped: boolean }
  taskProgress: { type: Schema.Types.Mixed, required: false },

  submittedAt: { type: Schema.Types.Date, required: false },

  // 0..10, matching the peer-review grade scale.
  score: { type: Schema.Types.Number, required: true },
  passed: { type: Schema.Types.Boolean, required: true },

  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

// Common query: this user's attempts on a given guide.
exerciseAttemptSchema.index({ guide: 1, owner: 1 });

// At most one attempt in progress per student per guide, enforced by the
// database rather than by the code that creates them. Partial, so the many
// submitted attempts are unaffected.
exerciseAttemptSchema.index(
  { guide: 1, owner: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "inProgress" },
    name: "one_in_progress_attempt_per_guide",
  }
);

export type ExerciseAttemptType = InferSchemaType<typeof exerciseAttemptSchema> & {
  _id: Types.ObjectId;
};

export type ExerciseAttemptDocument = ExerciseAttemptType & Document;

export const ExerciseAttempt =
  models.ExerciseAttempt ||
  model<ExerciseAttemptDocument>("ExerciseAttempt", exerciseAttemptSchema);
