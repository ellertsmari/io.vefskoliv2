import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const teamEvaluationSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "GroupProject",
    index: true,
  },
  team: { type: Schema.Types.ObjectId, required: true, ref: "Team", index: true },
  // Exactly one of evaluator (logged-in user) or judge (external, via token
  // link) is set.
  evaluator: { type: Schema.Types.ObjectId, required: false, ref: "User" },
  judge: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "JudgeInvitation",
  },
  category: { type: Schema.Types.String, required: true },
  // No score for the special "overall" comment category.
  score: { type: Schema.Types.Number, required: false, min: 0, max: 10 },
  comment: { type: Schema.Types.String, required: false, default: "" },
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

teamEvaluationSchema.index(
  { project: 1, team: 1, evaluator: 1, category: 1 },
  {
    unique: true,
    partialFilterExpression: { evaluator: { $exists: true } },
  }
);
teamEvaluationSchema.index(
  { project: 1, team: 1, judge: 1, category: 1 },
  { unique: true, partialFilterExpression: { judge: { $exists: true } } }
);

export type TeamEvaluationType = InferSchemaType<
  typeof teamEvaluationSchema
> & {
  _id: Types.ObjectId;
};

export type TeamEvaluationDocument = TeamEvaluationType & Document;
export const TeamEvaluation =
  models.TeamEvaluation ||
  model<TeamEvaluationDocument>("TeamEvaluation", teamEvaluationSchema);
