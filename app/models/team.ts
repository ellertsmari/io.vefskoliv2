import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

const teamSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "GroupProject",
    index: true,
  },
  name: { type: Schema.Types.String, required: true, default: "New Team" },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  projectName: { type: Schema.Types.String, required: false, default: "" },
  // One-line pitch shown under the project name on the public showcase.
  tagline: { type: Schema.Types.String, required: false, default: "" },
  projectDescription: {
    type: Schema.Types.String,
    required: false,
    default: "",
  },
  links: {
    github: { type: Schema.Types.String, required: false, default: "" },
    figma: { type: Schema.Types.String, required: false, default: "" },
    figjam: { type: Schema.Types.String, required: false, default: "" },
    website: { type: Schema.Types.String, required: false, default: "" },
    backend: { type: Schema.Types.String, required: false, default: "" },
  },
  // Stored images (blob URLs via utils/imageUpload, or legacy data URLs and
  // pasted http(s) URLs), each with a role on the public showcase page:
  // cover screenshot (the hero), team photo, and a small square logo.
  coverImage: { type: Schema.Types.String, required: false, default: "" },
  teamPhoto: { type: Schema.Types.String, required: false, default: "" },
  logo: { type: Schema.Types.String, required: false, default: "" },
  // Per-member consent to have their NAME on the PUBLIC showcase, which is
  // served with no session (see getShowcase). Opt-in: absence of an entry means
  // "no", and it can be switched back off at any time.
  //
  // Consent is individual, never collective — a member who declines is dropped
  // from the public list while their teammates stay, so nobody's silence can
  // block anybody else. An earlier version also gated the team photo on
  // unanimous agreement; that deadlocked whole teams behind one person who had
  // simply never been asked, so consent for the photo now happens where it
  // belongs — when the picture is taken (see the team hub copy) — backed by any
  // member being able to take it down at any time, forever.
  //
  // This affects the public page only. Inside the LMS teachers and teammates
  // always see real names.
  showcaseConsents: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: Schema.Types.Boolean, required: true, default: false },
      updatedAt: { type: Schema.Types.Date, required: true, default: Date.now },
    },
  ],
  // Which pieces of received feedback the team chose to show on their public
  // showcase page, as TeamEvaluation ids. The team owns the choice, so it
  // lives here rather than as a flag on the evaluations themselves — an
  // evaluation is the evaluator's, the decision to publish it is the team's.
  // Only comments are ever published, never scores (see getShowcase).
  showcaseQuotes: [
    { type: Schema.Types.ObjectId, ref: "TeamEvaluation" },
  ],
  createdAt: { type: Schema.Types.Date, required: true, default: Date.now },
});

teamSchema.index({ project: 1, members: 1 });

export type TeamType = InferSchemaType<typeof teamSchema> & {
  _id: Types.ObjectId;
};

export type TeamDocument = TeamType & Document;
export const Team = models.Team || model<TeamDocument>("Team", teamSchema);
