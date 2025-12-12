import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

export enum Vote {
  NO_PASS = "no pass",
  PASS = "pass",
  RECOMMEND_TO_GALLERY = "recommend to Hall of fame",
}

const reviewSchema = new Schema({
  guide: { type: Schema.Types.ObjectId, required: true, ref: "Guide", index: true },
  return: { type: Schema.Types.ObjectId, required: true, ref: "Return", index: true },

  // the owner is the user who submitted the review (vote + comment)
  owner: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  vote: {
    type: Schema.Types.String,
    required: true,
    enum: Object.values(Vote),
  },
  comment: { type: Schema.Types.String, required: true },

  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },

  grade: { type: Schema.Types.Number, required: false },
});

// Compound indexes for common query patterns
reviewSchema.index({ guide: 1, owner: 1 });
reviewSchema.index({ guide: 1, return: 1 });
reviewSchema.index({ guide: 1, grade: 1 }); // For finding ungraded reviews

export type ReviewType = InferSchemaType<typeof reviewSchema>;

export type ReviewTypeWithId = ReviewType & {
  _id: Types.ObjectId;
};

// After someone has graded the review, it becomes a graded review
export type GradedReviewType = ReviewTypeWithId & {
  grade: number;
};

export type ReviewDocument = ReviewTypeWithId & Document;

export type GradedReviewDocument = GradedReviewType & Document;

export const Review =
  models?.Review || model<ReviewDocument>("Review", reviewSchema);

// Legacy type aliases for backwards compatibility during migration
/** @deprecated Use ReviewType instead */
export type FeedbackType = ReviewType;
/** @deprecated Use ReviewTypeWithId instead */
export type FeedbackTypeWithId = ReviewTypeWithId;
/** @deprecated Use GradedReviewType instead */
export type GradedFeedbackType = GradedReviewType;
/** @deprecated Use ReviewDocument instead */
export type FeedbackDocument = ReviewDocument;
/** @deprecated Use GradedReviewDocument instead */
export type GradedFeedbackDocument = GradedReviewDocument;
