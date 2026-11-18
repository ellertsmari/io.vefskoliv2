import "models/autoConnect";
import {
  Document,
  InferSchemaType,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

/**
 * A sign-up sheet: a day with fixed time slots that teams or people claim,
 * e.g. the design review of a group project (one slot per team) or a meet-up
 * a student organises (several places on one slot).
 *
 * Dates are "YYYY-MM-DD" and times "HH:MM", like calendar events. Slots are
 * stored one by one rather than as a range, so the organiser can leave out
 * the lunch break or a time that is already taken.
 *
 * `version` makes every change to `slots` a compare-and-swap: two teams
 * clicking the same slot at once cannot both get it, and a team moving to a
 * new slot can never end up holding two.
 */
const claimSchema = new Schema(
  {
    /** Set on a team sheet: the team that holds the place. */
    team: { type: Schema.Types.ObjectId, ref: "Team", required: false },
    /** Who signed up (on a team sheet, the member who clicked). */
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Schema.Types.Date, required: true, default: Date.now },
  },
  { _id: false }
);

const slotSchema = new Schema(
  {
    startTime: { type: Schema.Types.String, required: true },
    endTime: { type: Schema.Types.String, required: true },
    claims: { type: [claimSchema], default: [] },
  },
  { _id: false }
);

const signupSheetSchema = new Schema(
  {
    title: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: false },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Schema.Types.String, required: true, index: true },
    slotMinutes: { type: Schema.Types.Number, required: true },
    /** Places on each slot. */
    capacity: { type: Schema.Types.Number, required: true, default: 1, min: 1 },
    audience: {
      type: Schema.Types.String,
      required: true,
      enum: ["project", "everyone", "team", "shared"],
    },
    /** audience "project": the group project whose teams sign up. */
    project: { type: Schema.Types.ObjectId, ref: "GroupProject", required: false },
    /** audience "team": the team whose members sign up. */
    team: { type: Schema.Types.ObjectId, ref: "Team", required: false },
    /** audience "shared": the people invited. */
    sharedWith: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    slots: { type: [slotSchema], default: [] },
    version: { type: Schema.Types.Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export type SignupSheetType = InferSchemaType<typeof signupSheetSchema> & {
  _id: Types.ObjectId;
};
export type SignupSheetDocument = SignupSheetType & Document;

export const SignupSheet =
  models?.SignupSheet ||
  model<SignupSheetDocument>("SignupSheet", signupSheetSchema);
