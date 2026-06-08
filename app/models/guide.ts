import {
  Document,
  InferSchemaType,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

const guideReferenceSchema = new Schema({
  type: { type: Schema.Types.String, required: true },
  name: { type: Schema.Types.String, required: true },
  link: { type: Schema.Types.String, required: true },
});
//todo: combine guideClassSchema and guideResourcesSchema into  guideReferencesSchema
const guideClassSchema = new Schema({
  title: { type: Schema.Types.String, required: true },
  link: { type: Schema.Types.String, required: true },
});

const guideModuleSchema = new Schema({
  title: { type: Schema.Types.String, required: true },
  number: { type: Schema.Types.Number, required: true },
});

const guideThemeIdeaSchema = new Schema({
  title: { type: Schema.Types.String, required: true },
  description: { type: Schema.Types.String, required: true },
});

const guideKnowledgeSchema = new Schema({
  knowledge: { type: Schema.Types.String, required: true },
});

const guideSkillSchema = new Schema({
  skill: { type: Schema.Types.String, required: true },
});

const guideResourceSchema = new Schema({
  link: { type: Schema.Types.String, required: true },
  description: { type: Schema.Types.String, required: true },
});

/**
 * An auto-graded exercise task. Phase 1 supports `type: "quiz"` only.
 *
 * `correctAnswers` is the answer key (option indices) and `explanation` is the
 * post-submission rationale. BOTH are server-only — they must be stripped before
 * a guide is sent to a student (see `sanitizeGuideForClient` in utils/exerciseUtils).
 */
const exerciseTaskSchema = new Schema(
  {
    type: {
      type: Schema.Types.String,
      required: true,
      enum: ["quiz"],
      default: "quiz",
    },
    prompt: { type: Schema.Types.String, required: true },
    options: { type: [Schema.Types.String], required: true },
    allowMultiple: { type: Schema.Types.Boolean, required: true, default: false },
    points: { type: Schema.Types.Number, required: true, default: 1 },
    // server-only answer key:
    correctAnswers: { type: [Schema.Types.Number], required: true },
    explanation: { type: Schema.Types.String, required: false },
  },
  { _id: true }
);

const exerciseSchema = new Schema({
  tasks: { type: [exerciseTaskSchema], required: true },
  // fraction of total points required to pass (0..1)
  passThreshold: { type: Schema.Types.Number, required: true, default: 0.7 },
});

const guideSchema = new Schema({
  // Canonical taxonomy axes (see app/utils/guideTaxonomy.ts). Not strictly
  // required so existing/un-migrated docs still read fine — the taxonomy helpers
  // fall back to deriving these from `category`.
  discipline: {
    type: Schema.Types.String,
    enum: ["code", "design"],
    required: false,
  },
  isSpecialty: { type: Schema.Types.Boolean, required: false, default: false },
  // DERIVED mirror of (discipline, isSpecialty), kept for legacy/display/LTI
  // consumers. Written on every save via axesToCategory; never string-matched
  // directly in logic.
  category: { type: Schema.Types.String, required: true },
  references: { type: [guideReferenceSchema], required: true },
  title: { type: Schema.Types.String, required: true },
  description: { type: Schema.Types.String, required: true },
  knowledge: { type: [guideKnowledgeSchema], required: true },
  skills: { type: [guideSkillSchema], required: true },
  resources: { type: [guideResourceSchema], required: true },
  createdAt: { type: Schema.Types.Date, required: true },
  updatedAt: { type: Schema.Types.Date, required: true },
  themeIdea: { type: guideThemeIdeaSchema, required: true },
  topicsList: { type: Schema.Types.String, required: true },
  module: { type: guideModuleSchema, required: true },
  classes: { type: [guideClassSchema], required: true },
  order: { type: Schema.Types.Number, required: true },

  // How the guide is completed/graded. Absent on existing guides => peer review.
  gradingMode: {
    type: Schema.Types.String,
    enum: ["peerReview", "auto"],
    required: false,
    default: "peerReview",
  },
  // Present only when gradingMode === "auto". Contains the answer key; never send
  // the raw `exercise` to a student — sanitize it first.
  exercise: { type: exerciseSchema, required: false },
});

export type GuideType = InferSchemaType<typeof guideSchema> & {
  _id: Types.ObjectId;
};

export type ModuleType = InferSchemaType<typeof guideModuleSchema>;

export type GuideDocument = GuideType & Document;
export const Guide = models.Guide || model<GuideDocument>("Guide", guideSchema);
