import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

/**
 * A teacher's confirmed peer-evaluation result for one student on one project.
 *
 * The peer scores themselves are advice; this is the teacher saying what that
 * advice comes to — either by accepting the averages the team gave or by
 * replacing them. Both axes are kept, on the same −2..+2 scale as the scores
 * they summarize, because the grade formula multiplies them by each other
 * (`peerGradeFactor`): averaging them here would erase the case the formula
 * exists to catch.
 *
 * Nothing is published from this until a teacher releases the project's
 * grades, and a student with no confirmed result gets no individual grade at
 * all — never a silent default.
 *
 * `basedOn*` records what the students had said at the moment of confirmation,
 * so a result confirmed before the last evaluations arrived can be spotted
 * instead of silently going stale.
 */
const peerEvaluationResultSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "GroupProject",
    index: true,
  },
  student: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  contribution: { type: Schema.Types.Number, required: true, min: -2, max: 2 },
  teambuilding: { type: Schema.Types.Number, required: true, min: -2, max: 2 },
  note: { type: Schema.Types.String, required: false, default: "" },
  basedOnContribution: { type: Schema.Types.Number, required: false },
  basedOnTeambuilding: { type: Schema.Types.Number, required: false },
  basedOnCount: { type: Schema.Types.Number, required: false },
  confirmedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  confirmedAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

peerEvaluationResultSchema.index({ project: 1, student: 1 }, { unique: true });

export type PeerEvaluationResultType = InferSchemaType<
  typeof peerEvaluationResultSchema
> & {
  _id: Types.ObjectId;
};

export type PeerEvaluationResultDocument = PeerEvaluationResultType & Document;
export const PeerEvaluationResult =
  models.PeerEvaluationResult ||
  model<PeerEvaluationResultDocument>(
    "PeerEvaluationResult",
    peerEvaluationResultSchema
  );
