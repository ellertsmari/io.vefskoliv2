import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

/**
 * One Canvas course we push grades into, and the rule for which guides belong
 * in it.
 *
 * The school runs three Canvas courses per module — VFOR (code guides), VEFH
 * (design guides), VLOK (group project) — each split again per cohort (…AA,
 * …BA). A guide alone therefore does not identify a course: module 3's code
 * guides live in BOTH VFOR4WD03AA and VFOR4WD03BA, and which one a given
 * student's grade belongs in depends on where that student is enrolled. Routing
 * takes the intersection of this rule and the student's enrolments (see
 * `CanvasUser` and `lib/canvas/routing`).
 *
 * `selectors` is a LIST rather than a single (module, track) pair because module
 * 1 folds guides and group work into one course. A course claiming several
 * tracks is normal, not a misconfiguration.
 *
 * `lineitemsUrl` and `nrpsUrl` come from the AGS/NRPS claims on any launch in
 * the course — including a teacher's. One launch per course is enough to make
 * every student in it syncable; no student ever has to click anything.
 */
const canvasCourseSelectorSchema = new Schema(
  {
    // Parsed from the guide's module TITLE, never `module.number` — see
    // utils/moduleUtils for why that field cannot be trusted.
    moduleNumber: { type: Schema.Types.Number, required: true },
    track: {
      type: Schema.Types.String,
      required: true,
      enum: ["code", "design", "group"],
    },
  },
  { _id: false }
);

const canvasCourseSchema = new Schema(
  {
    // The LTI `context_id`: stable per Canvas course, and the key everything
    // else in the sync hangs off.
    contextId: { type: Schema.Types.String, required: true, index: true },
    issuer: { type: Schema.Types.String, required: true },
    deploymentId: { type: Schema.Types.String, required: true },

    // Canvas' own course code and name ("VFOR4WD03AA", "Undirstöður …"), stored
    // purely so the admin UI and CSV export are readable by a human who thinks
    // in course codes rather than opaque context ids.
    courseCode: { type: Schema.Types.String, required: false },
    title: { type: Schema.Types.String, required: false },

    // AGS: where line items for this course are created and listed.
    lineitemsUrl: { type: Schema.Types.String, required: false },
    // NRPS: where this course's roster is read.
    nrpsUrl: { type: Schema.Types.String, required: false },

    selectors: { type: [canvasCourseSelectorSchema], required: true, default: [] },

    // Off by default: a course is created by the first launch that happens to
    // land in it, long before anyone has said which guides belong there. Pushing
    // grades into a course nobody has configured is the one mistake that is
    // visible to students, so it takes a deliberate opt-in.
    syncEnabled: { type: Schema.Types.Boolean, required: true, default: false },

    lastRosterSyncAt: { type: Schema.Types.Date, required: false },
  },
  { timestamps: true }
);

// One document per course per platform. Scoped by issuer so a test Canvas
// instance and production can coexist without colliding.
canvasCourseSchema.index({ issuer: 1, contextId: 1 }, { unique: true });
// Routing looks courses up by what they claim.
canvasCourseSchema.index({ "selectors.moduleNumber": 1, "selectors.track": 1 });

export type CanvasCourseSelector = InferSchemaType<
  typeof canvasCourseSelectorSchema
>;
export type CanvasCourseType = InferSchemaType<typeof canvasCourseSchema> & {
  _id: Types.ObjectId;
};
export type CanvasCourseDocument = CanvasCourseType & Document;

export const CanvasCourse =
  models?.CanvasCourse ||
  model<CanvasCourseDocument>("CanvasCourse", canvasCourseSchema);
