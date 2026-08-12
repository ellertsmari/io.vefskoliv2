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
 * An auto-graded exercise task. Supports `quiz` (multiple choice) and
 * `shortAnswer` (typed text); `code` follows — see docs/exercise-engine-tasks.md.
 *
 * The ANSWER KEY is server-only and must be stripped before a guide is sent to a
 * student (see `sanitizeGuideForClient` in utils/exerciseUtils): `correctAnswers`
 * for quiz, `acceptedAnswers` and `pattern` for short answer, plus `explanation`
 * and `hint` for both.
 *
 * Type-specific fields are optional at the schema level and required per type in
 * the API's zod schema, because one collection holds every task type.
 */
const exerciseTaskSchema = new Schema(
  {
    type: {
      type: Schema.Types.String,
      required: true,
      enum: ["quiz", "shortAnswer", "code"],
      default: "quiz",
    },
    prompt: { type: Schema.Types.String, required: true },
    options: { type: [Schema.Types.String], required: false },
    allowMultiple: { type: Schema.Types.Boolean, required: false, default: false },
    points: { type: Schema.Types.Number, required: true, default: 1 },
    // server-only answer key (quiz):
    correctAnswers: { type: [Schema.Types.Number], required: false },
    // server-only answer key (short answer). `acceptedAnswers` are compared
    // after normalizing case/whitespace/trailing punctuation; `pattern` is an
    // optional regex for answers with real variation.
    acceptedAnswers: { type: [Schema.Types.String], required: false },
    pattern: { type: Schema.Types.String, required: false },
    // shown inside the input as an example of the expected form
    placeholder: { type: Schema.Types.String, required: false },
    // Code tasks. `tests` is answer key in its own right — some cases are
    // hidden, and every case carries its expected value.
    entryPoint: { type: Schema.Types.String, required: false },
    starterCode: { type: Schema.Types.String, required: false },
    tests: {
      type: [
        new Schema(
          {
            label: { type: Schema.Types.String, required: false },
            args: { type: [Schema.Types.Mixed], required: true },
            expected: { type: Schema.Types.Mixed, required: false },
            hidden: { type: Schema.Types.Boolean, required: false, default: false },
          },
          { _id: false }
        ),
      ],
      required: false,
    },
    // Constructs the solution is expected to use; worth a slice of the marks
    // (constructWeight, default 0.2), never a gate.
    requires: { type: [Schema.Types.String], required: false },
    constructWeight: { type: Schema.Types.Number, required: false, min: 0, max: 1 },
    explanation: { type: Schema.Types.String, required: false },
    // Shown to the student when they answer INCORRECTLY (the explanation is
    // only revealed on a correct answer, so retries stay a learning exercise
    // rather than copy-the-feedback). Should point back at the material, not
    // give the answer away.
    hint: { type: Schema.Types.String, required: false },
    // Optional knowledge goal this task assesses (one of the guide's
    // knowledge items, stored as its text). Powers per-goal feedback for
    // students and per-goal stats for teachers.
    goal: { type: Schema.Types.String, required: false },
  },
  { _id: true }
);

const exerciseSchema = new Schema({
  tasks: { type: [exerciseTaskSchema], required: true },
  // fraction of total points required to pass (0..1)
  passThreshold: { type: Schema.Types.Number, required: true, default: 0.7 },
  // When set (1 <= poolSize < tasks.length), each visit serves a random
  // subset of this many questions; absent = serve all questions.
  poolSize: { type: Schema.Types.Number, required: false, min: 1 },
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
