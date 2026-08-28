import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
} from "mongoose";

/**
 * A student's identity and enrolment in one Canvas course.
 *
 * Two jobs, and the second is the less obvious one:
 *
 *  1. Identity — `ltiSub` is the `sub` claim Canvas uses for this person, and
 *     the id AGS scores must be addressed to. Our own `User._id` means nothing
 *     to Canvas.
 *
 *  2. Enrolment — a row here is the record that this student is in THIS course.
 *     That is what resolves the …AA / …BA cohort split without adding a cohort
 *     field to `User`: Canvas already knows who is in which section, so we read
 *     it rather than maintaining a second copy that can disagree.
 *
 * Rows are written by the NRPS roster sync, which reads the full membership of a
 * course without needing anyone to launch the tool. `user` is matched on email;
 * a membership whose email matches no account stays unlinked (`user` absent)
 * rather than inventing one — an unmatched student is a thing a human needs to
 * see, not a thing to paper over.
 */
const canvasUserSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
      index: true,
    },
    contextId: { type: Schema.Types.String, required: true, index: true },

    // The LTI `sub` for this person on this platform.
    ltiSub: { type: Schema.Types.String, required: true, index: true },

    // What NRPS reported, kept even once linked: it is the only way to work out
    // why a membership failed to match an account.
    email: { type: Schema.Types.String, required: false },
    name: { type: Schema.Types.String, required: false },

    // Canvas roles for this membership. Teachers and TAs appear on the roster
    // too and must never be pushed a guide grade.
    roles: { type: [Schema.Types.String], required: true, default: [] },

    // NRPS reports dropped students as Inactive/Deleted rather than omitting
    // them. Keeping the row and flagging it preserves the grade history while
    // stopping further pushes.
    status: {
      type: Schema.Types.String,
      required: true,
      enum: ["Active", "Inactive", "Deleted"],
      default: "Active",
    },

    lastSeenAt: { type: Schema.Types.Date, required: false },
  },
  { timestamps: true }
);

// One membership per person per course.
canvasUserSchema.index({ contextId: 1, ltiSub: 1 }, { unique: true });
// Routing asks "which of this student's courses match?" on every push.
canvasUserSchema.index({ user: 1, contextId: 1 });

export type CanvasUserType = InferSchemaType<typeof canvasUserSchema> & {
  _id: Types.ObjectId;
};
export type CanvasUserDocument = CanvasUserType & Document;

export const CanvasUser =
  models?.CanvasUser || model<CanvasUserDocument>("CanvasUser", canvasUserSchema);
