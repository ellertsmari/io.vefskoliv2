import {
  Document,
  InferSchemaType,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

/**
 * A calendar event.
 *
 * Dates are stored as "YYYY-MM-DD" strings and times as "HH:MM" strings: the
 * calendar deals in school-local wall-clock dates, and strings sidestep
 * timezone drift entirely (a holiday on Dec 24 is Dec 24 for everyone).
 *
 * `owner: null` marks an imported school event, which only teachers may edit.
 * Otherwise the owner is whoever created it: students may edit and delete
 * their own, teachers anything. `visibility` decides who else sees it; a
 * "team" event also records which team, since a student can be on several
 * teams over the years.
 *
 * Every occurrence of a repeating event shares a `seriesId`, and imported or
 * copied events carry an `importKey` so running the import twice changes
 * nothing.
 */
const calendarEventSchema = new Schema(
  {
    title: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: false },
    category: {
      type: Schema.Types.String,
      required: true,
      enum: ["milestone", "lecture", "groupwork", "deadline", "holiday"],
    },
    startDate: { type: Schema.Types.String, required: true, index: true },
    endDate: { type: Schema.Types.String, required: true },
    startTime: { type: Schema.Types.String, required: false },
    endTime: { type: Schema.Types.String, required: false },
    link: { type: Schema.Types.String, required: false },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    visibility: {
      type: Schema.Types.String,
      required: true,
      enum: ["everyone", "team", "private"],
      default: "everyone",
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: false,
      index: true,
    },
    seriesId: { type: Schema.Types.String, required: false, index: true },
    importKey: {
      type: Schema.Types.String,
      required: false,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

export type CalendarEventType = InferSchemaType<typeof calendarEventSchema> & {
  _id: Types.ObjectId;
};
export type CalendarEventDocument = CalendarEventType & Document;

export const CalendarEvent =
  models?.CalendarEvent ||
  model<CalendarEventDocument>("CalendarEvent", calendarEventSchema);
