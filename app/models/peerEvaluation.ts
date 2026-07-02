import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const peerEvaluationSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "GroupProject",
    index: true,
  },
  team: { type: Schema.Types.ObjectId, required: true, ref: "Team", index: true },
  evaluator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  target: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  contributionScore: {
    type: Schema.Types.Number,
    required: true,
    min: -2,
    max: 2,
  },
  contributionComment: { type: Schema.Types.String, required: true },
  teambuildingScore: {
    type: Schema.Types.Number,
    required: true,
    min: -2,
    max: 2,
  },
  teambuildingComment: { type: Schema.Types.String, required: true },
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

peerEvaluationSchema.index(
  { project: 1, evaluator: 1, target: 1 },
  { unique: true }
);

export type PeerEvaluationType = InferSchemaType<
  typeof peerEvaluationSchema
> & {
  _id: Types.ObjectId;
};

export type PeerEvaluationDocument = PeerEvaluationType & Document;
export const PeerEvaluation =
  models.PeerEvaluation ||
  model<PeerEvaluationDocument>("PeerEvaluation", peerEvaluationSchema);
