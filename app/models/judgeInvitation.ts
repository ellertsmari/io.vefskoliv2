import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

// An external judge invited by a teacher via a token link (/judge/<token>).
// Judges are not users — the token is their only credential. `focus` scopes
// which rubric disciplines they must score (general rows are always
// required); their grades weigh like teacher grades.
const judgeInvitationSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "GroupProject",
    index: true,
  },
  name: { type: Schema.Types.String, required: true },
  focus: {
    type: Schema.Types.String,
    required: true,
    enum: ["all", "design", "code"],
    default: "all",
  },
  token: { type: Schema.Types.String, required: true, unique: true },
  // Opt-in, set by the judge themselves on their own page: may a team name
  // them when they publish one of their comments on the public showcase? Off
  // means the quote reads "An industry judge". Nobody can answer this for
  // them, exactly like the students' own showcase consent.
  showcaseNameConsent: {
    type: Schema.Types.Boolean,
    required: true,
    default: false,
  },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

export type JudgeInvitationType = InferSchemaType<
  typeof judgeInvitationSchema
> & {
  _id: Types.ObjectId;
};

export type JudgeInvitationDocument = JudgeInvitationType & Document;
export const JudgeInvitation =
  models.JudgeInvitation ||
  model<JudgeInvitationDocument>("JudgeInvitation", judgeInvitationSchema);
