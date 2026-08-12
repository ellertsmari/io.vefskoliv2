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

  // 0..10, matching the peer-review grade scale.
  score: { type: Schema.Types.Number, required: true },
  passed: { type: Schema.Types.Boolean, required: true },

  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

// Common query: this user's attempts on a given guide.
exerciseAttemptSchema.index({ guide: 1, owner: 1 });

export type ExerciseAttemptType = InferSchemaType<typeof exerciseAttemptSchema> & {
  _id: Types.ObjectId;
};

export type ExerciseAttemptDocument = ExerciseAttemptType & Document;

export const ExerciseAttempt =
  models.ExerciseAttempt ||
  model<ExerciseAttemptDocument>("ExerciseAttempt", exerciseAttemptSchema);
