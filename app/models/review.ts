import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const reviewSchema = new Schema({
  guide: { type: Schema.Types.ObjectId, required: false, ref: "Guide" },
  return: { type: Schema.Types.ObjectId, required: true, ref: "Return" },

  // the owner is the user who submitted the feedback and gave a vote and comment
  owner: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  vote: {
    type: Schema.Types.String,
    required: true,
    enum: ["no pass", "pass", "recommend to gallery"],
  },
  comment: { type: Schema.Types.String, required: true },

  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
  updatedAt: { type: Schema.Types.Date, required: false },
  commentAnswer: { type: Schema.Types.String, required: false },

  // the reviewer is the user who reviewed the feedback and gave a grade
  reviewer: { type: Schema.Types.ObjectId, required: false, ref: "User" },
  grade: { type: Schema.Types.Number, required: false },
});

export type FeedbackType = InferSchemaType<typeof reviewSchema> & {
  _id: Types.ObjectId;
};

// after someone has reviewed the feedback it becomes a reviewed feedback
export type ReviewedFeedbackType = FeedbackType & {
  reviewer: Types.ObjectId;
  grade: number;
};

export type FeedbackDocument = FeedbackType & Document;

export type ReviewedFeedbackDocument = FeedbackDocument & {
  reviewer: Types.ObjectId;
  grade: number;
};
export const Review =
  models.Review || model<FeedbackDocument>("Review", reviewSchema);
